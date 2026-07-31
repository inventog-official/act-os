'use server'

import { and, asc, desc, eq, isNull, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  communicationThreads,
  communicationThreadMembers,
  communicationMessages,
  emailConnections,
  emailMessages,
  meetings,
  meetingNotes,
  meetingDecisions,
  meetingActionItems,
} from '@/db/schema/calendar'
import {
  communicationThreadSchema,
  communicationMessageSchema,
  emailMessageSchema,
} from '@/lib/utils/validations'
import type { z } from 'zod'
import { getCurrentUser, guardCalendarPermission } from './utils'
import { getOrganizationId } from './utils'
import { createNotification } from '@/lib/actions/notifications'

type CommunicationThreadInput = z.input<typeof communicationThreadSchema>
type CommunicationMessageInput = z.input<typeof communicationMessageSchema>
type EmailMessageInput = z.input<typeof emailMessageSchema>

const NOT_DELETED_THREAD = isNull(communicationThreads.deletedAt)
const NOT_DELETED_MESSAGE = isNull(communicationMessages.deletedAt)
const NOT_DELETED_EMAIL = isNull(emailMessages.deletedAt)

export async function listThreads(organizationId: string, opts?: { entityType?: string; entityId?: string; search?: string; archived?: boolean }) {
  await guardCalendarPermission(organizationId, 'communication:view')
  const conditions: any[] = [eq(communicationThreads.organizationId, organizationId), NOT_DELETED_THREAD]
  if (opts?.entityType && opts?.entityId) {
    conditions.push(eq(communicationThreads.entityType, opts.entityType))
    conditions.push(eq(communicationThreads.entityId, opts.entityId))
  }
  if (opts?.archived !== undefined) conditions.push(eq(communicationThreads.isArchived, opts.archived))
  if (opts?.search) conditions.push(ilike(communicationThreads.title, `%${opts.search}%`))
  return db.select().from(communicationThreads).where(and(...conditions)).orderBy(desc(communicationThreads.updatedAt))
}

export async function getThread(organizationId: string, threadId: string) {
  await guardCalendarPermission(organizationId, 'communication:view')
  const [thread] = await db.select().from(communicationThreads)
    .where(and(eq(communicationThreads.organizationId, organizationId), eq(communicationThreads.id, threadId), NOT_DELETED_THREAD))
  if (!thread) throw new Error('Thread not found')
  const members = await db.select().from(communicationThreadMembers).where(eq(communicationThreadMembers.threadId, threadId))
  return { ...thread, members }
}

export async function createThread(organizationId: string, input: CommunicationThreadInput) {
  await guardCalendarPermission(organizationId, 'communication:manage')
  const user = await getCurrentUser()
  const data = communicationThreadSchema.parse(input)
  const [thread] = await db.insert(communicationThreads).values({
    threadType: data.thread_type,
    entityType: data.entity_type ?? null,
    entityId: data.entity_id ?? null,
    title: data.title || null,
    organizationId,
    workspaceId: data.workspace_id ?? null,
    createdBy: user.id,
  } as any).returning()

  const memberIds = [...new Set([user.id, ...data.member_ids])]
  await db.insert(communicationThreadMembers).values(
    memberIds.map(userId => ({ threadId: thread.id, userId } as any))
  )
  return thread
}

export async function updateThread(organizationId: string, threadId: string, input: Partial<CommunicationThreadInput>) {
  await guardCalendarPermission(organizationId, 'communication:manage')
  const data = communicationThreadSchema.partial().parse(input)
  const [thread] = await db.update(communicationThreads)
    .set({
      title: data.title,
      threadType: data.thread_type,
      entityType: data.entity_type,
      entityId: data.entity_id,
      updatedAt: new Date(),
    } as any)
    .where(and(eq(communicationThreads.organizationId, organizationId), eq(communicationThreads.id, threadId), NOT_DELETED_THREAD))
    .returning()
  if (!thread) throw new Error('Thread not found')
  if (data.member_ids?.length) {
    const existing = await db.select().from(communicationThreadMembers).where(eq(communicationThreadMembers.threadId, threadId))
    const existingIds = new Set(existing.map(m => m.userId))
    const toAdd = data.member_ids.filter(id => !existingIds.has(id))
    if (toAdd.length) await db.insert(communicationThreadMembers).values(toAdd.map(userId => ({ threadId, userId } as any)))
  }
  return thread
}

export async function archiveThread(organizationId: string, threadId: string, archived: boolean) {
  await guardCalendarPermission(organizationId, 'communication:manage')
  const [thread] = await db.update(communicationThreads)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(and(eq(communicationThreads.organizationId, organizationId), eq(communicationThreads.id, threadId), NOT_DELETED_THREAD))
    .returning()
  if (!thread) throw new Error('Thread not found')
  return thread
}

export async function deleteThread(organizationId: string, threadId: string) {
  await guardCalendarPermission(organizationId, 'communication:manage')
  const [thread] = await db.update(communicationThreads)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(communicationThreads.organizationId, organizationId), eq(communicationThreads.id, threadId)))
    .returning()
  if (!thread) throw new Error('Thread not found')
  return thread
}

export async function listMessages(organizationId: string, threadId: string) {
  await guardCalendarPermission(organizationId, 'communication:view')
  return db.select().from(communicationMessages)
    .where(and(eq(communicationMessages.threadId, threadId), eq(communicationMessages.organizationId, organizationId), NOT_DELETED_MESSAGE))
    .orderBy(asc(communicationMessages.createdAt))
}

export async function sendMessage(organizationId: string, input: CommunicationMessageInput) {
  await guardCalendarPermission(organizationId, 'communication:send')
  const user = await getCurrentUser()
  const data = communicationMessageSchema.parse(input)
  const [message] = await db.insert(communicationMessages).values({
    threadId: data.thread_id,
    senderId: user.id,
    body: data.body,
    messageType: data.message_type,
    parentId: data.parent_id ?? null,
    mentions: data.mentions,
    attachmentUrl: data.attachment_url || null,
    organizationId,
  } as any).returning()
  await db.update(communicationThreads)
    .set({ updatedAt: new Date() })
    .where(eq(communicationThreads.id, data.thread_id))
  for (const mentionedId of data.mentions) {
    if (mentionedId !== user.id) {
      await createNotification({
        organization_id: organizationId,
        user_id: mentionedId,
        title: 'You were mentioned',
        message: data.body.slice(0, 120),
        type: 'info',
      })
    }
  }
  return message
}

export async function deleteMessage(organizationId: string, messageId: string) {
  await guardCalendarPermission(organizationId, 'communication:manage')
  const user = await getCurrentUser()
  const [message] = await db.update(communicationMessages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(communicationMessages.id, messageId),
      eq(communicationMessages.organizationId, organizationId),
      or(eq(communicationMessages.senderId, user.id), sql`TRUE`)
    ))
    .returning()
  if (!message) throw new Error('Message not found')
  return message
}

export async function getMyThreads(organizationId: string) {
  await guardCalendarPermission(organizationId, 'communication:view')
  const user = await getCurrentUser()
  const memberships = await db.select().from(communicationThreadMembers)
    .where(eq(communicationThreadMembers.userId, user.id))
  if (!memberships.length) return []
  const threadIds = memberships.map(m => m.threadId)
  return db.select().from(communicationThreads)
    .where(and(
      eq(communicationThreads.organizationId, organizationId),
      NOT_DELETED_THREAD,
      or(...threadIds.map(id => eq(communicationThreads.id, id))),
    ))
    .orderBy(desc(communicationThreads.updatedAt))
}

// ============================================================================
// Email integration foundation — provider abstraction
// ============================================================================

export async function listEmailConnections(organizationId: string) {
  await guardCalendarPermission(organizationId, 'email:view')
  const user = await getCurrentUser()
  const connections = await db.select().from(emailConnections)
    .where(and(eq(emailConnections.userId, user.id), eq(emailConnections.organizationId, organizationId), isNull(emailConnections.deletedAt)))
  // Never expose token material to the client.
  return connections.map(({ accessTokenCiphertext, refreshTokenCiphertext, ...safe }) => safe)
}

export async function saveEmailConnection(organizationId: string, input: { provider: string; emailAddress: string; displayName?: string; accessToken: string; refreshToken?: string }) {
  await guardCalendarPermission(organizationId, 'email:connection:manage')
  const user = await getCurrentUser()
  const [connection] = await db.insert(emailConnections).values({
    userId: user.id,
    organizationId,
    provider: input.provider,
    emailAddress: input.emailAddress,
    displayName: input.displayName ?? null,
    accessTokenCiphertext: input.accessToken,
    refreshTokenCiphertext: input.refreshToken ?? null,
    status: 'connected',
  } as any).returning()
  return { ...connection, accessTokenCiphertext: undefined, refreshTokenCiphertext: undefined }
}

export async function disconnectEmailConnection(organizationId: string, connectionId: string) {
  await guardCalendarPermission(organizationId, 'email:connection:manage')
  const user = await getCurrentUser()
  const [connection] = await db.update(emailConnections)
    .set({ status: 'disconnected', updatedAt: new Date() })
    .where(and(eq(emailConnections.id, connectionId), eq(emailConnections.userId, user.id), eq(emailConnections.organizationId, organizationId)))
    .returning()
  if (!connection) throw new Error('Connection not found')
  return { ...connection, accessTokenCiphertext: undefined, refreshTokenCiphertext: undefined }
}

export async function listEmailMessages(organizationId: string, opts?: { threadId?: string; direction?: string; search?: string }) {
  await guardCalendarPermission(organizationId, 'email:view')
  const conditions: any[] = [eq(emailMessages.organizationId, organizationId), NOT_DELETED_EMAIL]
  if (opts?.threadId) conditions.push(eq(emailMessages.threadId, opts.threadId))
  if (opts?.direction) conditions.push(eq(emailMessages.direction, opts.direction))
  if (opts?.search) conditions.push(or(ilike(emailMessages.subject, `%${opts.search}%`), ilike(emailMessages.fromEmail, `%${opts.search}%`)))
  return db.select().from(emailMessages).where(and(...conditions)).orderBy(desc(emailMessages.createdAt))
}

export async function sendEmail(organizationId: string, input: EmailMessageInput) {
  await guardCalendarPermission(organizationId, 'email:send')
  const user = await getCurrentUser()
  const data = emailMessageSchema.parse(input)

  // Provider foundation: for real deliveries the active connection's transport
  // would be used (Gmail/Outlook API or Resend). We store the record and keep
  // the abstraction ready. PII stays server-side.
  const [email] = await db.insert(emailMessages).values({
    provider: 'resend',
    subject: data.subject,
    body: data.body || null,
    fromEmail: user.email ?? 'no-reply@actos.local',
    fromName: null,
    toEmails: data.to_emails,
    ccEmails: data.cc_emails,
    bccEmails: data.bcc_emails,
    direction: 'outbound',
    status: 'sent',
    sentAt: new Date(),
    threadId: data.thread_id ?? null,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  return email
}

export async function searchMessages(organizationId: string, query: string, limit = 50) {
  await guardCalendarPermission(organizationId, 'communication:view')
  if (!query.trim()) return []
  const term = `%${query.trim()}%`
  return db.select().from(communicationMessages)
    .where(and(
      eq(communicationMessages.organizationId, organizationId),
      NOT_DELETED_MESSAGE,
      ilike(communicationMessages.body, term),
    ))
    .orderBy(desc(communicationMessages.createdAt))
    .limit(limit)
}

export async function getEntityCommunication(organizationId: string, entityType: string, entityId: string, limit = 50) {
  await guardCalendarPermission(organizationId, 'communication:view')
  const threads = await db.select().from(communicationThreads)
    .where(and(
      eq(communicationThreads.organizationId, organizationId),
      eq(communicationThreads.entityType, entityType),
      eq(communicationThreads.entityId, entityId),
      NOT_DELETED_THREAD,
    ))
    .orderBy(desc(communicationThreads.updatedAt))
    .limit(limit)

  const withMessages = await Promise.all(threads.map(async thread => {
    const messages = await db.select().from(communicationMessages)
      .where(and(eq(communicationMessages.threadId, thread.id), eq(communicationMessages.organizationId, organizationId), NOT_DELETED_MESSAGE))
      .orderBy(asc(communicationMessages.createdAt))
      .limit(limit)
    return { ...thread, messages }
  }))
  return withMessages
}

// ============================================================================
// Business Communication Graph (Modules 15, 16, 17, 30)
// ============================================================================

export async function getCommunicationGraph(organizationId: string, entityType: string, entityId: string, limit = 25) {
  await guardCalendarPermission(organizationId, 'communication:view')
  const entityColumn = entityType === 'project' ? 'projectId' as const
    : entityType === 'company' ? 'companyId' as const
      : entityType === 'deal' ? 'dealId' as const
        : entityType === 'contact' ? 'contactId' as const
          : entityType === 'employee' ? 'employeeId' as const
            : entityType === 'task' ? 'taskId' as const
              : null

  const conditions: any[] = [eq(meetings.organizationId, organizationId), isNull(meetings.deletedAt)]
  if (entityColumn) conditions.push(eq(meetings[entityColumn], entityId))

  const [relatedMeetings, threads] = await Promise.all([
    db.select().from(meetings).where(and(...conditions)).orderBy(desc(meetings.startTime)).limit(limit),
    db.select().from(communicationThreads)
      .where(and(eq(communicationThreads.organizationId, organizationId), eq(communicationThreads.entityType, entityType), eq(communicationThreads.entityId, entityId), isNull(communicationThreads.deletedAt)))
      .orderBy(desc(communicationThreads.updatedAt))
      .limit(limit),
  ])

  const meetingIds = relatedMeetings.map(m => m.id)
  const [notes, decisions, actionItems, messages] = await Promise.all([
    meetingIds.length ? db.select().from(meetingNotes).where(and(sql`${meetingNotes.meetingId} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})`, eq(meetingNotes.organizationId, organizationId), isNull(meetingNotes.deletedAt))) : Promise.resolve([]),
    meetingIds.length ? db.select().from(meetingDecisions).where(and(sql`${meetingDecisions.meetingId} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})`, eq(meetingDecisions.organizationId, organizationId), isNull(meetingDecisions.deletedAt))) : Promise.resolve([]),
    meetingIds.length ? db.select().from(meetingActionItems).where(and(sql`${meetingActionItems.meetingId} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})`, eq(meetingActionItems.organizationId, organizationId), isNull(meetingActionItems.deletedAt))) : Promise.resolve([]),
    threads.length ? db.select().from(communicationMessages).where(and(sql`${communicationMessages.threadId} IN (${sql.join(threads.map(t => sql`${t.id}`), sql`, `)})`, eq(communicationMessages.organizationId, organizationId), isNull(communicationMessages.deletedAt))).orderBy(asc(communicationMessages.createdAt)).limit(limit) : Promise.resolve([]),
  ])

  return {
    entityType,
    entityId,
    meetings: relatedMeetings,
    notes,
    decisions,
    actionItems,
    threads,
    messages,
  }
}