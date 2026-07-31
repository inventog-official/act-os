'use server'

import { and, asc, desc, eq, isNull, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import {
  meetings,
  meetingParticipants,
  meetingNotes,
  meetingDecisions,
  meetingActionItems,
  meetingActivities,
} from '@/db/schema/calendar'
import {
  meetingSchema,
  meetingParticipantSchema,
  meetingNotesSchema,
  meetingDecisionSchema,
  meetingActionItemSchema,
} from '@/lib/utils/validations'
import type { z } from 'zod'
import { getCurrentUser, guardCalendarPermission, logMeetingActivity } from './utils'
import { logCalendarActivity } from './utils'
import { createNotification } from '@/lib/actions/notifications'
import { tasks } from '@/db/schema/projects'

type MeetingInput = z.input<typeof meetingSchema>
type MeetingParticipantInput = z.input<typeof meetingParticipantSchema>
type MeetingNotesInput = z.input<typeof meetingNotesSchema>
type MeetingDecisionInput = z.input<typeof meetingDecisionSchema>
type MeetingActionItemInput = z.input<typeof meetingActionItemSchema>
type MeetingUpdate = Partial<z.input<typeof meetingSchema>>

const NOT_DELETED_MEETING = isNull(meetings.deletedAt)
const NOT_DELETED_NOTES = isNull(meetingNotes.deletedAt)
const NOT_DELETED_DECISION = isNull(meetingDecisions.deletedAt)
const NOT_DELETED_ACTION = isNull(meetingActionItems.deletedAt)

export async function listMeetings(organizationId: string, opts?: { startTime?: string; endTime?: string; projectId?: string; companyId?: string; dealId?: string; status?: string }) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  const conditions: any[] = [eq(meetings.organizationId, organizationId), NOT_DELETED_MEETING]
  if (opts?.projectId) conditions.push(eq(meetings.projectId, opts.projectId))
  if (opts?.companyId) conditions.push(eq(meetings.companyId, opts.companyId))
  if (opts?.dealId) conditions.push(eq(meetings.dealId, opts.dealId))
  if (opts?.status) conditions.push(eq(meetings.status, opts.status))
  if (opts?.startTime) conditions.push(gte(meetings.startTime, new Date(opts.startTime)))
  if (opts?.endTime) conditions.push(lte(meetings.startTime, new Date(opts.endTime)))
  return db.select().from(meetings).where(and(...conditions)).orderBy(asc(meetings.startTime))
}

export async function getMeeting(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  const [meeting] = await db.select().from(meetings)
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
  if (!meeting) throw new Error('Meeting not found')
  const participants = await db.select().from(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId))
  return { ...meeting, participants }
}

export async function createMeeting(organizationId: string, input: MeetingInput, participantInputs?: MeetingParticipantInput[]) {
  await guardCalendarPermission(organizationId, 'meeting:create')
  const user = await getCurrentUser()
  const data = meetingSchema.parse(input)
  const startTime = new Date(data.start_time)
  const endTime = data.end_time ? new Date(data.end_time) : new Date(startTime.getTime() + (data.duration_minutes ?? 60) * 60000)
  const [meeting] = await db.insert(meetings).values({
    ...data,
    startTime,
    endTime,
    organizationId,
    createdBy: user.id,
  } as any).returning()

  if (participantInputs?.length) {
    const validated = participantInputs.map(p => meetingParticipantSchema.parse(p))
    await db.insert(meetingParticipants).values(
      validated.map(p => ({
        meetingId: meeting.id,
        userId: p.user_id ?? null,
        email: p.email ?? null,
        name: p.name ?? null,
        status: p.status,
        role: p.role,
        organizationId,
      } as any))
    )
    for (const p of validated) {
      if (p.user_id && p.user_id !== user.id) {
        await createNotification({
          organization_id: organizationId,
          user_id: p.user_id,
          title: `Meeting: ${meeting.title}`,
          message: `You've been invited to a meeting on ${new Date(startTime).toLocaleString()}.`,
          type: 'info',
        })
      }
    }
  } else {
    await db.insert(meetingParticipants).values({
      meetingId: meeting.id,
      userId: user.id,
      role: 'organizer',
      status: 'accepted',
      organizationId,
    } as any)
  }

  await logMeetingActivity({ organizationId, action: 'meeting.create', resource: 'meeting', meetingId: meeting.id, metadata: { title: meeting.title } })
  await logCalendarActivity({ organizationId, action: 'meeting.create', resource: 'meeting', resourceId: meeting.id, metadata: { title: meeting.title } })
  return meeting
}

export async function updateMeeting(organizationId: string, meetingId: string, input: MeetingUpdate) {
  await guardCalendarPermission(organizationId, 'meeting:update')
  const data = meetingSchema.partial().parse(input)
  const patch: any = { ...data, updatedAt: new Date() }
  if (data.start_time) {
    patch.startTime = new Date(data.start_time)
    patch.endTime = data.end_time ? new Date(data.end_time) : new Date(new Date(data.start_time).getTime() + (data.duration_minutes ?? 60) * 60000)
  }
  const [meeting] = await db.update(meetings)
    .set(patch)
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
    .returning()
  if (!meeting) throw new Error('Meeting not found')
  await logMeetingActivity({ organizationId, action: 'meeting.update', resource: 'meeting', meetingId, metadata: { title: meeting.title } })
  return meeting
}

export async function cancelMeeting(organizationId: string, meetingId: string, reason?: string) {
  await guardCalendarPermission(organizationId, 'meeting:cancel')
  const [meeting] = await db.update(meetings)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
    .returning()
  if (!meeting) throw new Error('Meeting not found')
  await notifyMeetingParticipants(meeting.id, `Meeting cancelled: ${meeting.title}`, reason || 'This meeting has been cancelled.')
  await logMeetingActivity({ organizationId, action: 'meeting.cancel', resource: 'meeting', meetingId, metadata: { reason } })
  return meeting
}

async function notifyMeetingParticipants(meetingId: string, title: string, message: string) {
  const participants = await db.select().from(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId))
  for (const p of participants) {
    if (p.userId) {
      await createNotification({
        organization_id: p.organizationId,
        user_id: p.userId,
        title,
        message,
        type: 'info',
      })
    }
  }
}

export async function rescheduleMeeting(organizationId: string, meetingId: string, startTime: string, endTime?: string, reason?: string) {
  await guardCalendarPermission(organizationId, 'meeting:update')
  const data = meetingSchema.partial().parse({ start_time: startTime, end_time: endTime || undefined })
  const [existing] = await db.select().from(meetings)
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
  if (!existing) throw new Error('Meeting not found')

  const start = new Date(data.start_time!)
  const end = data.end_time ? new Date(data.end_time) : new Date(start.getTime() + (existing.durationMinutes ?? 60) * 60000)
  const [meeting] = await db.update(meetings)
    .set({ startTime: start, endTime: end, status: existing.status === 'scheduled' ? 'scheduled' : 'rescheduled', updatedAt: new Date() })
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
    .returning()
  if (!meeting) throw new Error('Meeting not found')

  await notifyMeetingParticipants(
    meeting.id,
    `Meeting rescheduled: ${meeting.title}`,
    `New time: ${new Date(start).toLocaleString()}${reason ? ` — ${reason}` : ''}`
  )
  await logMeetingActivity({ organizationId, action: 'meeting.reschedule', resource: 'meeting', meetingId, metadata: { from: existing.startTime, to: start, reason } })
  await logCalendarActivity({ organizationId, action: 'meeting.reschedule', resource: 'meeting', resourceId: meeting.id, metadata: { from: existing.startTime, to: start } })
  return meeting
}

export async function convertActionItemToTask(organizationId: string, actionItemId: string, opts?: { projectId?: string; title?: string }) {
  await guardCalendarPermission(organizationId, 'meeting:action:manage')
  const user = await getCurrentUser()
  const [actionItem] = await db.select().from(meetingActionItems)
    .where(and(eq(meetingActionItems.id, actionItemId), eq(meetingActionItems.organizationId, organizationId), NOT_DELETED_ACTION))
  if (!actionItem) throw new Error('Action item not found')
  if (actionItem.taskId) throw new Error('Action item is already linked to a task')

  const [task] = await db.insert(tasks).values({
    title: opts?.title || actionItem.description,
    description: `Created from meeting action item (${actionItem.id})`,
    assigneeId: actionItem.assigneeId,
    dueDate: actionItem.dueDate,
    projectId: opts?.projectId ?? null,
    status: actionItem.status === 'done' ? 'done' as const : 'todo' as const,
    priority: 'medium' as const,
    organizationId,
    createdBy: user.id,
  } as any).returning()

  const [updated] = await db.update(meetingActionItems)
    .set({ taskId: task.id, updatedAt: new Date() })
    .where(and(eq(meetingActionItems.id, actionItemId), eq(meetingActionItems.organizationId, organizationId)))
    .returning()

  if (actionItem.assigneeId && actionItem.assigneeId !== user.id) {
    await createNotification({
      organization_id: organizationId,
      user_id: actionItem.assigneeId,
      title: `Task created from meeting: ${task.title}`,
      message: 'An action item from a meeting was turned into a task assigned to you.',
      type: 'info',
    })
  }

  await logMeetingActivity({ organizationId, action: 'meeting.action.task', resource: 'meeting_action', meetingId: actionItem.meetingId, resourceId: actionItem.id, metadata: { taskId: task.id } })
  return updated
}

export async function completeMeeting(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:update')
  const [meeting] = await db.update(meetings)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId), NOT_DELETED_MEETING))
    .returning()
  if (!meeting) throw new Error('Meeting not found')
  await logMeetingActivity({ organizationId, action: 'meeting.complete', resource: 'meeting', meetingId })
  return meeting
}

export async function deleteMeeting(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:manage')
  const [meeting] = await db.update(meetings)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(meetings.organizationId, organizationId), eq(meetings.id, meetingId)))
    .returning()
  if (!meeting) throw new Error('Meeting not found')
  await logMeetingActivity({ organizationId, action: 'meeting.delete', resource: 'meeting', meetingId, metadata: { title: meeting.title } })
  return meeting
}

export async function addMeetingParticipant(organizationId: string, input: MeetingParticipantInput) {
  await guardCalendarPermission(organizationId, 'meeting:manage')
  const data = meetingParticipantSchema.parse(input)
  const [participant] = await db.insert(meetingParticipants).values({ ...data, organizationId } as any).returning()
  await logMeetingActivity({ organizationId, action: 'meeting.participant.add', resource: 'meeting', meetingId: data.meeting_id, resourceId: participant.id, metadata: { userId: data.user_id ?? data.email } })
  return participant
}

export async function updateMeetingParticipantStatus(organizationId: string, participantId: string, status: 'pending' | 'accepted' | 'declined' | 'tentative') {
  await guardCalendarPermission(organizationId, 'meeting:update')
  const [participant] = await db.update(meetingParticipants)
    .set({ status })
    .where(and(eq(meetingParticipants.id, participantId), eq(meetingParticipants.organizationId, organizationId)))
    .returning()
  if (!participant) throw new Error('Participant not found')
  await logMeetingActivity({ organizationId, action: 'meeting.participant.status', resource: 'meeting', meetingId: participant.meetingId, resourceId: participant.id })
  return participant
}

// Notes
export async function listMeetingNotes(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  return db.select().from(meetingNotes)
    .where(and(eq(meetingNotes.meetingId, meetingId), eq(meetingNotes.organizationId, organizationId), NOT_DELETED_NOTES))
    .orderBy(desc(meetingNotes.createdAt))
}

export async function createMeetingNotes(organizationId: string, input: MeetingNotesInput) {
  await guardCalendarPermission(organizationId, 'meeting:notes:manage')
  const user = await getCurrentUser()
  const data = meetingNotesSchema.parse(input)
  const [notes] = await db.insert(meetingNotes).values({
    ...data,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logMeetingActivity({ organizationId, action: 'meeting.notes.create', resource: 'meeting_notes', meetingId: data.meeting_id, resourceId: notes.id })
  return notes
}

export async function updateMeetingNotes(organizationId: string, notesId: string, input: Partial<MeetingNotesInput>) {
  await guardCalendarPermission(organizationId, 'meeting:notes:manage')
  const data = meetingNotesSchema.partial().parse(input)
  const [notes] = await db.update(meetingNotes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(meetingNotes.id, notesId), eq(meetingNotes.organizationId, organizationId), NOT_DELETED_NOTES))
    .returning()
  if (!notes) throw new Error('Notes not found')
  await logMeetingActivity({ organizationId, action: 'meeting.notes.update', resource: 'meeting_notes', meetingId: notes.meetingId, resourceId: notesId })
  return notes
}

export async function deleteMeetingNotes(organizationId: string, notesId: string) {
  await guardCalendarPermission(organizationId, 'meeting:notes:manage')
  const [notes] = await db.update(meetingNotes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(meetingNotes.id, notesId), eq(meetingNotes.organizationId, organizationId)))
    .returning()
  if (!notes) throw new Error('Notes not found')
  await logMeetingActivity({ organizationId, action: 'meeting.notes.delete', resource: 'meeting_notes', meetingId: notes.meetingId, resourceId: notesId })
  return notes
}

// Decisions
export async function listMeetingDecisions(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  return db.select().from(meetingDecisions)
    .where(and(eq(meetingDecisions.meetingId, meetingId), eq(meetingDecisions.organizationId, organizationId), NOT_DELETED_DECISION))
    .orderBy(desc(meetingDecisions.createdAt))
}

export async function createMeetingDecision(organizationId: string, input: MeetingDecisionInput) {
  await guardCalendarPermission(organizationId, 'meeting:decision:manage')
  const user = await getCurrentUser()
  const data = meetingDecisionSchema.parse(input)
  const [decision] = await db.insert(meetingDecisions).values({
    ...data,
    decisionDate: new Date(data.decision_date),
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logMeetingActivity({ organizationId, action: 'meeting.decision.create', resource: 'meeting_decision', meetingId: data.meeting_id, resourceId: decision.id })
  return decision
}

export async function updateMeetingDecisionStatus(organizationId: string, decisionId: string, status: 'open' | 'in_progress' | 'done' | 'blocked' | 'cancelled') {
  await guardCalendarPermission(organizationId, 'meeting:decision:manage')
  const [decision] = await db.update(meetingDecisions)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(meetingDecisions.id, decisionId), eq(meetingDecisions.organizationId, organizationId), NOT_DELETED_DECISION))
    .returning()
  if (!decision) throw new Error('Decision not found')
  await logMeetingActivity({ organizationId, action: 'meeting.decision.status', resource: 'meeting_decision', meetingId: decision.meetingId, resourceId: decisionId, metadata: { status } })
  return decision
}

// Action Items
export async function listMeetingActionItems(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  return db.select().from(meetingActionItems)
    .where(and(eq(meetingActionItems.meetingId, meetingId), eq(meetingActionItems.organizationId, organizationId), NOT_DELETED_ACTION))
    .orderBy(asc(meetingActionItems.dueDate))
}

export async function createMeetingActionItem(organizationId: string, input: MeetingActionItemInput) {
  await guardCalendarPermission(organizationId, 'meeting:action:manage')
  const user = await getCurrentUser()
  const data = meetingActionItemSchema.parse(input)
  const [actionItem] = await db.insert(meetingActionItems).values({
    ...data,
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logMeetingActivity({ organizationId, action: 'meeting.action.create', resource: 'meeting_action', meetingId: data.meeting_id, resourceId: actionItem.id })
  return actionItem
}

export async function updateMeetingActionItem(organizationId: string, actionItemId: string, input: Partial<MeetingActionItemInput>) {
  await guardCalendarPermission(organizationId, 'meeting:action:manage')
  const data = meetingActionItemSchema.partial().parse(input)
  const patch: any = { ...data, updatedAt: new Date() }
  if (data.due_date) patch.dueDate = new Date(data.due_date)
  const [actionItem] = await db.update(meetingActionItems)
    .set(patch)
    .where(and(eq(meetingActionItems.id, actionItemId), eq(meetingActionItems.organizationId, organizationId), NOT_DELETED_ACTION))
    .returning()
  if (!actionItem) throw new Error('Action item not found')
  await logMeetingActivity({ organizationId, action: 'meeting.action.update', resource: 'meeting_action', meetingId: actionItem.meetingId, resourceId: actionItemId })
  return actionItem
}

export async function deleteMeetingActionItem(organizationId: string, actionItemId: string) {
  await guardCalendarPermission(organizationId, 'meeting:action:manage')
  const [actionItem] = await db.update(meetingActionItems)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(meetingActionItems.id, actionItemId), eq(meetingActionItems.organizationId, organizationId)))
    .returning()
  if (!actionItem) throw new Error('Action item not found')
  await logMeetingActivity({ organizationId, action: 'meeting.action.delete', resource: 'meeting_action', meetingId: actionItem.meetingId, resourceId: actionItemId })
  return actionItem
}

export async function getMeetingSummary(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  const meeting = await getMeeting(organizationId, meetingId)
  const notes = await listMeetingNotes(organizationId, meetingId)
  const decisions = await listMeetingDecisions(organizationId, meetingId)
  const actionItems = await listMeetingActionItems(organizationId, meetingId)
  return { meeting, notes, decisions, actionItems }
}

export async function getMeetingActivities(organizationId: string, meetingId: string) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  return db.select().from(meetingActivities)
    .where(and(eq(meetingActivities.organizationId, organizationId), eq(meetingActivities.meetingId, meetingId)))
    .orderBy(desc(meetingActivities.createdAt))
}

export async function getMeetingHistory(organizationId: string, opts?: { companyId?: string; dealId?: string; projectId?: string; contactId?: string; employeeId?: string; limit?: number }) {
  await guardCalendarPermission(organizationId, 'meeting:view')
  const conditions: any[] = [eq(meetings.organizationId, organizationId), NOT_DELETED_MEETING]
  if (opts?.companyId) conditions.push(eq(meetings.companyId, opts.companyId))
  if (opts?.dealId) conditions.push(eq(meetings.dealId, opts.dealId))
  if (opts?.projectId) conditions.push(eq(meetings.projectId, opts.projectId))
  if (opts?.contactId) conditions.push(eq(meetings.contactId, opts.contactId))
  if (opts?.employeeId) conditions.push(eq(meetings.employeeId, opts.employeeId))
  const items = await db.select().from(meetings).where(and(...conditions)).orderBy(desc(meetings.startTime)).limit(opts?.limit ?? 50)
  return items
}