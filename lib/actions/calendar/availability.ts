'use server'

import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { calendarAvailability } from '@/db/schema/calendar'
import { calendarEvents as calendarEventsExtras } from '@/db/schema/extras'
import { hrLeaveRequests, hrHolidays, hrEmployees } from '@/db/schema/hr'
import { calendarAvailabilitySchema, calendarScheduleSchema } from '@/lib/utils/validations'
import type { z } from 'zod'
import { getCurrentUser, guardCalendarPermission, logCalendarActivity } from './utils'
import { isAvailableFor, findConflicts, minutesToDate, detectConflicts } from '@/lib/utils/calendar'

type CalendarAvailabilityInput = z.input<typeof calendarAvailabilitySchema>
type CalendarScheduleInput = z.input<typeof calendarScheduleSchema>

const NOT_DELETED = isNull(calendarEventsExtras.deletedAt)

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export async function listAvailability(organizationId: string, userId?: string) {
  await guardCalendarPermission(organizationId, 'calendar:availability:manage')
  const conditions: any[] = [eq(calendarAvailability.organizationId, organizationId)]
  if (userId) conditions.push(eq(calendarAvailability.userId, userId))
  return db.select().from(calendarAvailability).where(and(...conditions)).orderBy(asc(calendarAvailability.dayOfWeek))
}

export async function saveAvailability(organizationId: string, input: CalendarAvailabilityInput) {
  await guardCalendarPermission(organizationId, 'calendar:availability:manage')
  const user = await getCurrentUser()
  const data = calendarAvailabilitySchema.parse(input)
  const [existing] = await db.select().from(calendarAvailability)
    .where(and(eq(calendarAvailability.userId, user.id), eq(calendarAvailability.dayOfWeek, data.day_of_week)))
  if (existing) {
    const [updated] = await db.update(calendarAvailability).set({
      startTime: data.start_time as any,
      endTime: data.end_time as any,
      timezone: data.timezone,
      isActive: data.is_active,
      updatedAt: new Date(),
    }).where(eq(calendarAvailability.id, existing.id)).returning()
    await logCalendarActivity({ organizationId, action: 'availability.update', resource: 'availability', resourceId: existing.id })
    return updated
  }
  const [row] = await db.insert(calendarAvailability).values({
    userId: user.id,
    organizationId,
    dayOfWeek: data.day_of_week,
    startTime: data.start_time as any,
    endTime: data.end_time as any,
    timezone: data.timezone,
    isActive: data.is_active,
  } as any).returning()
  await logCalendarActivity({ organizationId, action: 'availability.create', resource: 'availability', resourceId: row.id })
  return row
}

export async function deleteAvailability(organizationId: string, availabilityId: string) {
  await guardCalendarPermission(organizationId, 'calendar:availability:manage')
  const user = await getCurrentUser()
  const [row] = await db.delete(calendarAvailability)
    .where(and(eq(calendarAvailability.id, availabilityId), eq(calendarAvailability.userId, user.id), eq(calendarAvailability.organizationId, organizationId)))
    .returning()
  if (!row) throw new Error('Availability not found')
  await logCalendarActivity({ organizationId, action: 'availability.delete', resource: 'availability', resourceId: availabilityId })
  return row
}

export async function getConflictingEvents(organizationId: string, userIds: string[], start: Date, end: Date, excludeEventId?: string) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const conditions: any[] = [
    eq(calendarEventsExtras.organizationId, organizationId),
    NOT_DELETED,
    eq(calendarEventsExtras.status, 'scheduled'),
    // Overlap check
  ]
  const events = await db.select().from(calendarEventsExtras)
    .where(and(...conditions))
  return findConflicts(events, start, end, excludeEventId)
}

export async function detectConflictsForUsers(
  organizationId: string,
  userIds: string[],
  start: Date,
  end: Date,
  excludeEventId?: string
) {
  await guardCalendarPermission(organizationId, 'calendar:view')
  const availability = await db.select().from(calendarAvailability)
    .where(and(eq(calendarAvailability.organizationId, organizationId), eq(calendarAvailability.isActive, true)))
  const events = await db.select().from(calendarEventsExtras)
    .where(and(eq(calendarEventsExtras.organizationId, organizationId), NOT_DELETED, eq(calendarEventsExtras.status, 'scheduled')))
  const leave = await db.select().from(hrLeaveRequests)
    .where(and(eq(hrLeaveRequests.organizationId, organizationId), eq(hrLeaveRequests.status, 'approved')))
  const holidays = await db.select().from(hrHolidays)
    .where(eq(hrHolidays.organizationId, organizationId))
  const employees = await db.select().from(hrEmployees)
    .where(eq(hrEmployees.organizationId, organizationId))
  const employeeIdByUserId = new Map(employees.filter(e => e.userId).map(e => [e.userId, e.id]))

  const perUser: Record<string, { hasConflict: boolean; reasons: string[] }> = {}
  for (const userId of userIds) {
    const userAvailability = availability.filter(a => a.userId === userId)
    const userEvents = events.filter(e => e.createdBy === userId || e.organizerId === userId)
    const employeeId = employeeIdByUserId.get(userId)
    const userLeave = employeeId ? leave.filter(l => l.employeeId === employeeId) : []
    perUser[userId] = detectConflicts(
      userAvailability as any,
      userEvents as any,
      userLeave as any,
      holidays as any,
      start,
      end,
      excludeEventId
    )
  }
  return { start, end, userIds, perUser }
}

export async function getTeamAvailability(organizationId: string, userIds: string[], date: Date) {
  await guardCalendarPermission(organizationId, 'calendar:availability:manage')
  const availability = await db.select().from(calendarAvailability)
    .where(and(eq(calendarAvailability.organizationId, organizationId)))
  const day = date.getDay()
  return userIds.map(userId => {
    const slots = availability.filter(a => a.userId === userId && a.dayOfWeek === day && a.isActive)
    return { userId, available: slots.length > 0, slots }
  })
}

export async function findScheduleSlot(organizationId: string, input: CalendarScheduleInput) {
  await guardCalendarPermission(organizationId, 'calendar:create')
  const data = calendarScheduleSchema.parse(input)
  const user = await getCurrentUser()
  const availability = await db.select().from(calendarAvailability)
    .where(and(eq(calendarAvailability.organizationId, organizationId), eq(calendarAvailability.isActive, true)))
  const attendees = [...new Set([user.id, ...data.attendee_ids])]

  const searchDate = new Date(data.start_date)
  const desiredStart = minutesToDate(searchDate, timeToMinutes(data.start_time))
  const existingEvents = await db.select().from(calendarEventsExtras)
    .where(and(
      eq(calendarEventsExtras.organizationId, organizationId),
      NOT_DELETED,
      eq(calendarEventsExtras.status, 'scheduled'),
    ))
  const duration = data.duration_minutes
  const buffer = data.buffer_minutes

  const windowStart = new Date(desiredStart)
  windowStart.setDate(windowStart.getDate() - 7)
  const windowEnd = new Date(desiredStart)
  windowEnd.setDate(windowEnd.getDate() + 30)

  let best: { start: Date; end: Date } | null = null
  const cursor = new Date(windowStart)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= windowEnd) {
    for (let mins = 0; mins < 24 * 60; mins += 15) {
      const candidateStart = minutesToDate(cursor, mins)
      const candidateEnd = new Date(candidateStart.getTime() + duration * 60000)

      const allAvailable = attendees.every(attendeeId => {
        const userSlots = availability.filter(a => a.userId === attendeeId)
        return isAvailableFor(userSlots, candidateStart, candidateEnd)
      })
      if (!allAvailable) continue

      const conflicts = attendees.some(attendeeId => {
        const conflicting = findConflicts(existingEvents.filter(e => e.createdBy === attendeeId || e.organizerId === attendeeId), candidateStart, candidateEnd)
        return conflicting.length > 0
      })
      if (conflicts) continue

      if (candidateStart >= windowStart && candidateEnd <= windowEnd) {
        const finalStart = new Date(candidateStart.getTime() + buffer * 60000)
        const finalEnd = new Date(finalStart.getTime() + duration * 60000)
        best = { start: finalStart, end: finalEnd }
        break
      }
    }
    if (best) break
    cursor.setDate(cursor.getDate() + 1)
  }

  if (!best) return { found: false, message: 'No available slot found in the next 30 days for all attendees.' }

  const finalAvailabilityCheck = attendees.every(attendeeId => {
    const userSlots = availability.filter(a => a.userId === attendeeId)
    return isAvailableFor(userSlots, best!.start, best!.end)
  })
  return {
    found: true,
    start: best.start,
    end: best.end,
    attendees,
    allAttendeesAvailable: finalAvailabilityCheck,
  }
}