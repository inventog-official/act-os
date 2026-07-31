'use server'

import { and, eq, isNull, ilike, or, desc, sql } from 'drizzle-orm'
import { db } from '@/db'
import { calendarEvents as calendarEventsExtras } from '@/db/schema/extras'
import {
  meetings,
  meetingNotes,
  meetingDecisions,
  meetingActionItems,
  communicationThreads,
  communicationMessages,
} from '@/db/schema/calendar'
import { guardCalendarPermission } from './utils'

// Module 31 — Global search across calendar & communication entities.
const LIMIT_PER_TYPE = 15

export async function searchCalendar(organizationId: string, query: string) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const term = query.trim()
  if (!term) return { events: [], meetings: [], threads: [], messages: [], notes: [], decisions: [], actionItems: [] }
  const like = `%${term}%`

  const [events, meetingResults, threads, messages, notes, decisions, actionItems] = await Promise.all([
    db.select().from(calendarEventsExtras)
      .where(and(eq(calendarEventsExtras.organizationId, organizationId), isNull(calendarEventsExtras.deletedAt), or(ilike(calendarEventsExtras.title, like), sql`${calendarEventsExtras.description} ILIKE ${like}`)))
      .orderBy(desc(calendarEventsExtras.startDate)).limit(LIMIT_PER_TYPE),
    db.select().from(meetings)
      .where(and(eq(meetings.organizationId, organizationId), isNull(meetings.deletedAt), or(ilike(meetings.title, like), ilike(meetings.description ?? '', like), ilike(meetings.agenda ?? '', like))))
      .orderBy(desc(meetings.startTime)).limit(LIMIT_PER_TYPE),
    db.select().from(communicationThreads)
      .where(and(eq(communicationThreads.organizationId, organizationId), isNull(communicationThreads.deletedAt), ilike(communicationThreads.title ?? '', like)))
      .orderBy(desc(communicationThreads.updatedAt)).limit(LIMIT_PER_TYPE),
    db.select().from(communicationMessages)
      .where(and(eq(communicationMessages.organizationId, organizationId), isNull(communicationMessages.deletedAt), ilike(communicationMessages.body, like)))
      .orderBy(desc(communicationMessages.createdAt)).limit(LIMIT_PER_TYPE),
    db.select().from(meetingNotes)
      .where(and(eq(meetingNotes.organizationId, organizationId), isNull(meetingNotes.deletedAt), or(ilike(meetingNotes.title, like), ilike(meetingNotes.content ?? '', like))))
      .orderBy(desc(meetingNotes.createdAt)).limit(LIMIT_PER_TYPE),
    db.select().from(meetingDecisions)
      .where(and(eq(meetingDecisions.organizationId, organizationId), isNull(meetingDecisions.deletedAt), or(ilike(meetingDecisions.decision, like), ilike(meetingDecisions.context ?? '', like))))
      .orderBy(desc(meetingDecisions.createdAt)).limit(LIMIT_PER_TYPE),
    db.select().from(meetingActionItems)
      .where(and(eq(meetingActionItems.organizationId, organizationId), isNull(meetingActionItems.deletedAt), ilike(meetingActionItems.description, like)))
      .orderBy(desc(meetingActionItems.createdAt)).limit(LIMIT_PER_TYPE),
  ])
  return {
    events,
    meetings: meetingResults,
    threads,
    messages,
    notes,
    decisions,
    actionItems,
  }
}