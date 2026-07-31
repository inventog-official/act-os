'use server'

import { and, asc, desc, eq, isNull, gte, lte, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { calendarEvents } from '@/db/schema/extras'
import { calendarEventParticipants } from '@/db/schema/calendar'
import {
  calendarEventSchema,
  calendarRecurrenceSchema,
  calendarParticipantSchema,
  calendarDuplicateSchema,
  calendarRescheduleSchema,
  calendarSeriesEditSchema,
} from '@/lib/utils/validations'
import type { z } from 'zod'
import { getCurrentUser, guardCalendarPermission, logCalendarActivity } from './utils'
import { buildRRule, getOccurrences } from '@/lib/utils/calendar'

type CalendarEventInput = z.input<typeof calendarEventSchema>
type CalendarRecurrenceInput = z.input<typeof calendarRecurrenceSchema>
type CalendarParticipantInput = z.input<typeof calendarParticipantSchema>
type CalendarEventUpdate = Partial<z.input<typeof calendarEventSchema>>
type CalendarDuplicateInput = z.input<typeof calendarDuplicateSchema>
type CalendarRescheduleInput = z.input<typeof calendarRescheduleSchema>
type CalendarSeriesEditInput = z.input<typeof calendarSeriesEditSchema>

const NOT_DELETED = isNull(calendarEvents.deletedAt)

function toEventValues(data: Partial<CalendarEventInput>) {
  return {
    title: data.title,
    description: data.description ?? null,
    eventType: data.event_type,
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    endDate: data.end_date ? new Date(data.end_date) : null,
    allDay: data.all_day,
    color: data.color,
    timezone: data.timezone,
    location: data.location ?? null,
    meetingLink: data.meeting_link ?? null,
    organizerId: data.organizer_id ?? null,
    reminderMinutes: data.reminder_minutes,
    projectId: data.project_id ?? null,
    taskId: data.task_id ?? null,
    companyId: data.company_id ?? null,
    contactId: data.contact_id ?? null,
    dealId: data.deal_id ?? null,
    leadId: data.lead_id ?? null,
    employeeId: data.employee_id ?? null,
    workspaceId: data.workspace_id ?? null,
    status: data.status,
  }
}

export async function listEvents(organizationId: string, opts?: {
  startDate?: string
  endDate?: string
  projectId?: string
  taskId?: string
  status?: string
  includeRecurring?: boolean
}) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const conditions: any[] = [eq(calendarEvents.organizationId, organizationId), NOT_DELETED]
  if (opts?.projectId) conditions.push(eq(calendarEvents.projectId, opts.projectId))
  if (opts?.taskId) conditions.push(eq(calendarEvents.taskId, opts.taskId))
  if (opts?.status) conditions.push(eq(calendarEvents.status, opts.status))
  if (opts?.startDate) conditions.push(gte(calendarEvents.startDate, new Date(opts.startDate)))
  if (opts?.endDate) conditions.push(lte(calendarEvents.startDate, new Date(opts.endDate)))
  const events = await db.select().from(calendarEvents).where(and(...conditions)).orderBy(asc(calendarEvents.startDate))

  let result: any[] = [...events]
  if (opts?.includeRecurring) {
    const parents = events.filter(e => e.recurrenceRule && !e.recurrenceParentId)
    const expanded: any[] = []
    for (const parent of parents) {
      const occurrences = getOccurrences(new Date(parent.startDate), parent.recurrenceRule!, 30)
      const exceptions = events.filter(e => e.recurrenceParentId === parent.id)
      for (const occ of occurrences) {
        const occKey = occ.toISOString().slice(0, 10)
        const exception = exceptions.find(e => {
          const d = e.recurrenceExceptionDate ? new Date(e.recurrenceExceptionDate).toISOString().slice(0, 10) : ''
          return d === occKey
        })
        if (exception) {
          if (exception.status !== 'cancelled') expanded.push({ ...exception, title: `${exception.title} (edited)` })
        } else {
          const duration = parent.endDate ? new Date(parent.endDate).getTime() - new Date(parent.startDate).getTime() : 0
          expanded.push({
            ...parent,
            id: undefined,
            startDate: occ,
            endDate: duration ? new Date(occ.getTime() + duration) : null,
          })
        }
      }
    }
    if (expanded.length) {
      const exceptIds = new Set(expanded.filter(e => e.id).map(e => e.id))
      result = [...events.filter(e => !e.recurrenceRule && !e.recurrenceParentId), ...expanded]
      result = result.filter(e => !(e.recurrenceRule && !exceptIds.has(e.id)))
      result = result.filter(e => !(e.recurrenceParentId))
      result = [...events.filter(e => !e.recurrenceRule && !e.recurrenceParentId), ...expanded]
    }
  }
  return result
}

export async function getEvent(organizationId: string, eventId: string) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const [event] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.organizationId, organizationId), eq(calendarEvents.id, eventId), NOT_DELETED))
  if (!event) throw new Error('Event not found')
  const participants = await db.select().from(calendarEventParticipants)
    .where(eq(calendarEventParticipants.eventId, eventId))
  return { ...event, participants }
}

export async function createEvent(organizationId: string, input: CalendarEventInput, recurrence?: CalendarRecurrenceInput) {
  await guardCalendarPermission(organizationId, 'calendar:create')
  const user = await getCurrentUser()
  const data = calendarEventSchema.parse(input)
  const rec = recurrence ? calendarRecurrenceSchema.parse(recurrence) : undefined
  const [event] = await db.insert(calendarEvents).values({
    ...toEventValues(data),
    recurrenceRule: rec ? buildRRule(rec) : null,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logCalendarActivity({
    organizationId, action: 'event.create', resource: 'event', eventId: event.id,
    resourceId: event.id, metadata: { title: event.title, eventType: event.eventType },
  })
  return event
}

export async function updateEvent(organizationId: string, eventId: string, input: CalendarEventUpdate, recurrence?: CalendarRecurrenceInput) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const data = calendarEventSchema.partial().parse(input)
  const rec = recurrence ? calendarRecurrenceSchema.parse(recurrence) : undefined
  const values: any = { ...toEventValues(data), updatedAt: new Date() }
  if (rec) values.recurrenceRule = buildRRule(rec)
  const [event] = await db.update(calendarEvents)
    .set(values)
    .where(and(eq(calendarEvents.organizationId, organizationId), eq(calendarEvents.id, eventId), NOT_DELETED))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.update', resource: 'event', eventId,
    resourceId: eventId, metadata: { title: event.title },
  })
  return event
}

export async function deleteEvent(organizationId: string, eventId: string) {
  await guardCalendarPermission(organizationId, 'calendar:delete')
  const [event] = await db.update(calendarEvents)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(calendarEvents.organizationId, organizationId), eq(calendarEvents.id, eventId)))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.delete', resource: 'event', eventId,
    resourceId: eventId, metadata: { title: event.title },
  })
  return event
}

export async function updateEventStatus(organizationId: string, eventId: string, status: 'scheduled' | 'cancelled' | 'completed') {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const [event] = await db.update(calendarEvents)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(calendarEvents.organizationId, organizationId), eq(calendarEvents.id, eventId), NOT_DELETED))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.status', resource: 'event', eventId,
    resourceId: eventId, metadata: { status },
  })
  return event
}

export async function cancelRecurringOccurrence(organizationId: string, parentId: string, occurrenceDate: string) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const user = await getCurrentUser()
  const [parent] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId)))
  if (!parent?.recurrenceRule) throw new Error('Parent recurring event not found')

  const duration = parent.endDate ? new Date(parent.endDate).getTime() - new Date(parent.startDate).getTime() : 0
  const occStart = new Date(occurrenceDate)
  const [exception] = await db.insert(calendarEvents).values({
    title: parent.title,
    description: parent.description,
    eventType: parent.eventType,
    startDate: occStart,
    endDate: duration ? new Date(occStart.getTime() + duration) : null,
    allDay: parent.allDay,
    color: parent.color,
    timezone: parent.timezone,
    location: parent.location,
    meetingLink: parent.meetingLink,
    organizerId: parent.organizerId,
    status: 'cancelled',
    recurrenceParentId: parent.id,
    recurrenceExceptionDate: new Date(occurrenceDate),
    projectId: parent.projectId,
    taskId: parent.taskId,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logCalendarActivity({
    organizationId, action: 'event.occurrence.cancel', resource: 'event',
    eventId: exception.id, resourceId: parent.id, metadata: { occurrenceDate },
  })
  return exception
}

export async function listEventParticipants(organizationId: string, eventId: string) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  return db.select().from(calendarEventParticipants).where(eq(calendarEventParticipants.eventId, eventId))
}

export async function addEventParticipant(organizationId: string, input: CalendarParticipantInput) {
  await guardCalendarPermission(organizationId, 'calendar:create')
  const data = calendarParticipantSchema.parse(input)
  const [participant] = await db.insert(calendarEventParticipants).values({
    eventId: data.event_id,
    userId: data.user_id ?? null,
    email: data.email || null,
    name: data.name || null,
    status: data.status,
    role: data.role,
    organizationId,
  } as any).returning()
  await logCalendarActivity({
    organizationId, action: 'event.participant.add', resource: 'event',
    eventId: data.event_id, resourceId: participant.id, metadata: { userId: data.user_id ?? data.email },
  })
  return participant
}

export async function updateEventParticipantStatus(organizationId: string, participantId: string, status: 'pending' | 'accepted' | 'declined' | 'tentative') {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const [participant] = await db.update(calendarEventParticipants)
    .set({ status })
    .where(and(eq(calendarEventParticipants.id, participantId), eq(calendarEventParticipants.organizationId, organizationId)))
    .returning()
  if (!participant) throw new Error('Participant not found')
  await logCalendarActivity({
    organizationId, action: 'event.participant.status', resource: 'event',
    eventId: participant.eventId, resourceId: participant.id, metadata: { status },
  })
  return participant
}

export async function removeEventParticipant(organizationId: string, participantId: string) {
  await guardCalendarPermission(organizationId, 'calendar:delete')
  const [participant] = await db.delete(calendarEventParticipants)
    .where(and(eq(calendarEventParticipants.id, participantId), eq(calendarEventParticipants.organizationId, organizationId)))
    .returning()
  if (!participant) throw new Error('Participant not found')
  await logCalendarActivity({
    organizationId, action: 'event.participant.remove', resource: 'event',
    eventId: participant.eventId, resourceId: participant.id,
  })
  return participant
}

export async function duplicateEvent(organizationId: string, input: CalendarDuplicateInput) {
  await guardCalendarPermission(organizationId, 'calendar:create')
  const user = await getCurrentUser()
  const data = calendarDuplicateSchema.parse(input)
  const [source] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, data.event_id), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
  if (!source) throw new Error('Source event not found')

  const startDate = data.start_date ? new Date(data.start_date) : new Date(source.startDate)
  const duration = source.endDate ? new Date(source.endDate).getTime() - new Date(source.startDate).getTime() : 0
  const [copy] = await db.insert(calendarEvents).values({
    title: data.title || `${source.title} (copy)`,
    description: source.description,
    eventType: source.eventType,
    startDate,
    endDate: duration ? new Date(startDate.getTime() + duration) : null,
    allDay: source.allDay,
    color: source.color,
    timezone: source.timezone,
    location: source.location,
    meetingLink: source.meetingLink,
    organizerId: source.organizerId,
    reminderMinutes: source.reminderMinutes,
    projectId: source.projectId,
    taskId: source.taskId,
    companyId: source.companyId,
    contactId: source.contactId,
    dealId: source.dealId,
    leadId: source.leadId,
    employeeId: source.employeeId,
    status: 'scheduled',
    organizationId,
    createdBy: user.id,
  } as any).returning()

  const participants = await db.select().from(calendarEventParticipants).where(eq(calendarEventParticipants.eventId, source.id))
  if (participants.length) {
    await db.insert(calendarEventParticipants).values(
      participants.map(p => ({
        eventId: copy.id,
        userId: p.userId,
        email: p.email,
        name: p.name,
        status: 'pending',
        role: p.role,
        organizationId,
      } as any))
    )
  }
  await logCalendarActivity({
    organizationId, action: 'event.duplicate', resource: 'event',
    eventId: copy.id, resourceId: source.id, metadata: { sourceTitle: source.title },
  })
  return copy
}

export async function rescheduleEvent(organizationId: string, input: CalendarRescheduleInput) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const data = calendarRescheduleSchema.parse(input)
  const startDate = new Date(data.start_date)
  const [existing] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, data.event_id), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
  if (!existing) throw new Error('Event not found')

  const duration = existing.endDate ? new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime() : 0
  const values: any = { startDate, updatedAt: new Date() }
  if (data.end_date) values.endDate = new Date(data.end_date)
  else if (duration) values.endDate = new Date(startDate.getTime() + duration)
  else values.endDate = null

  const [event] = await db.update(calendarEvents)
    .set(values)
    .where(and(eq(calendarEvents.id, data.event_id), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.reschedule', resource: 'event',
    eventId: event.id, resourceId: event.id, metadata: { from: existing.startDate, to: startDate },
  })
  return event
}

export async function editRecurringOccurrence(
  organizationId: string,
  parentId: string,
  occurrenceDate: string,
  input: CalendarSeriesEditInput
) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const user = await getCurrentUser()
  const data = calendarSeriesEditSchema.parse(input)
  const [parent] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId)))
  if (!parent?.recurrenceRule) throw new Error('Parent recurring event not found')

  const duration = parent.endDate ? new Date(parent.endDate).getTime() - new Date(parent.startDate).getTime() : 0
  const occStart = data.start_date ? new Date(data.start_date) : new Date(occurrenceDate)
  const [exception] = await db.insert(calendarEvents).values({
    title: data.title || parent.title,
    description: data.description !== undefined ? data.description : parent.description,
    eventType: parent.eventType,
    startDate: occStart,
    endDate: data.end_date
      ? new Date(data.end_date)
      : duration
        ? new Date(occStart.getTime() + duration)
        : null,
    allDay: data.all_day ?? parent.allDay,
    color: data.color ?? parent.color,
    timezone: data.timezone ?? parent.timezone,
    location: data.location !== undefined ? data.location : parent.location,
    meetingLink: data.meeting_link !== undefined ? data.meeting_link : parent.meetingLink,
    organizerId: parent.organizerId,
    reminderMinutes: parent.reminderMinutes,
    projectId: parent.projectId,
    taskId: parent.taskId,
    companyId: parent.companyId,
    dealId: parent.dealId,
    leadId: parent.leadId,
    employeeId: parent.employeeId,
    status: 'scheduled',
    recurrenceParentId: parent.id,
    recurrenceExceptionDate: new Date(occurrenceDate),
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logCalendarActivity({
    organizationId, action: 'event.occurrence.edit', resource: 'event',
    eventId: exception.id, resourceId: parent.id, metadata: { occurrenceDate },
  })
  return exception
}

export async function updateRecurringSeries(organizationId: string, parentId: string, input: CalendarSeriesEditInput) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const data = calendarSeriesEditSchema.parse(input)
  const patch: any = { updatedAt: new Date() }
  if (data.title !== undefined) patch.title = data.title
  if (data.description !== undefined) patch.description = data.description
  if (data.location !== undefined) patch.location = data.location
  if (data.meeting_link !== undefined) patch.meetingLink = data.meeting_link
  if (data.all_day !== undefined) patch.allDay = data.all_day
  if (data.color !== undefined) patch.color = data.color
  if (data.timezone !== undefined) patch.timezone = data.timezone

  const [parent] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId)))
  if (!parent?.recurrenceRule) throw new Error('Parent recurring event not found')

  const duration = parent.endDate ? new Date(parent.endDate).getTime() - new Date(parent.startDate).getTime() : 0
  if (data.start_date) {
    const newStart = new Date(data.start_date)
    patch.startDate = newStart
    patch.endDate = data.end_date ? new Date(data.end_date) : duration ? new Date(newStart.getTime() + duration) : null
  }

  const [event] = await db.update(calendarEvents)
    .set(patch)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.series.update', resource: 'event',
    eventId: event.id, resourceId: event.id, metadata: { title: event.title },
  })
  return event
}

export async function cancelRecurringSeries(organizationId: string, parentId: string, occurrenceDate?: string) {
  await guardCalendarPermission(organizationId, 'calendar:update')
  const user = await getCurrentUser()
  const [parent] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId)))
  if (!parent?.recurrenceRule) throw new Error('Parent recurring event not found')

  if (occurrenceDate) {
    const [exception] = await db.insert(calendarEvents).values({
      title: parent.title,
      description: parent.description,
      eventType: parent.eventType,
      startDate: new Date(occurrenceDate),
      endDate: null,
      allDay: parent.allDay,
      color: parent.color,
      timezone: parent.timezone,
      organizerId: parent.organizerId,
      status: 'cancelled',
      recurrenceParentId: parent.id,
      recurrenceExceptionDate: new Date(occurrenceDate),
      organizationId,
      createdBy: user.id,
    } as any).returning()
    await logCalendarActivity({
      organizationId, action: 'event.occurrence.cancel', resource: 'event',
      eventId: exception.id, resourceId: parent.id, metadata: { occurrenceDate },
    })
    return exception
  }

  const [event] = await db.update(calendarEvents)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId)))
    .returning()
  if (!event) throw new Error('Event not found')
  await logCalendarActivity({
    organizationId, action: 'event.series.cancel', resource: 'event',
    eventId: event.id, resourceId: event.id, metadata: { title: event.title },
  })
  return event
}

export async function getRecurringSeries(organizationId: string, parentId: string) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const [parent] = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.id, parentId), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
  if (!parent?.recurrenceRule) throw new Error('Parent recurring event not found')
  const exceptions = await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.recurrenceParentId, parentId), eq(calendarEvents.organizationId, organizationId), NOT_DELETED))
  return { parent, exceptions, occurrences: getOccurrences(new Date(parent.startDate), parent.recurrenceRule!, 50) }
}