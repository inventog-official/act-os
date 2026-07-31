import { describe, it, expect } from 'vitest'
import {
  calendarEventSchema,
  calendarRecurrenceSchema,
  calendarParticipantSchema,
  calendarAvailabilitySchema,
  calendarScheduleSchema,
  meetingSchema,
  meetingNotesSchema,
  meetingDecisionSchema,
  meetingActionItemSchema,
  communicationThreadSchema,
  communicationMessageSchema,
  emailMessageSchema,
} from '@/lib/utils/validations'
import { buildRRule, parseRRule, getOccurrences, isAvailableFor, findConflicts } from '@/lib/utils/calendar'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('calendar event schema', () => {
  it('accepts a valid event', () => {
    const r = calendarEventSchema.parse({ title: 'Standup', start_date: '2026-08-18T09:00:00' })
    expect(r.title).toBe('Standup')
    expect(r.event_type).toBe('event')
    expect(r.all_day).toBe(false)
    expect(r.timezone).toBe('UTC')
  })

  it('accepts all event types', () => {
    for (const t of ['task', 'milestone', 'meeting', 'deadline', 'reminder', 'event', 'appointment', 'call']) {
      expect(calendarEventSchema.parse({ title: 'x', event_type: t, start_date: '2026-08-18' }).event_type).toBe(t)
    }
  })

  it('rejects missing title', () => {
    expect(() => calendarEventSchema.parse({ start_date: '2026-08-18' })).toThrow()
  })

  it('rejects invalid event type', () => {
    expect(() => calendarEventSchema.parse({ title: 'x', event_type: 'party', start_date: '2026-08-18' })).toThrow()
  })

  it('validates reminder minutes range', () => {
    expect(() => calendarEventSchema.parse({ title: 'x', start_date: '2026-08-18', reminder_minutes: [20000] })).toThrow()
    expect(calendarEventSchema.parse({ title: 'x', start_date: '2026-08-18', reminder_minutes: [15, 60] }).reminder_minutes).toEqual([15, 60])
  })
})

describe('calendar recurrence schema', () => {
  it('accepts a valid weekly recurrence', () => {
    const r = calendarRecurrenceSchema.parse({ frequency: 'weekly', interval: 2, by_day: ['MO', 'WE'] })
    expect(r.frequency).toBe('weekly')
    expect(r.interval).toBe(2)
    expect(r.by_day).toEqual(['MO', 'WE'])
  })

  it('rejects invalid frequency', () => {
    expect(() => calendarRecurrenceSchema.parse({ frequency: 'biweekly' })).toThrow()
  })

  it('rejects invalid by_day', () => {
    expect(() => calendarRecurrenceSchema.parse({ frequency: 'weekly', by_day: ['XX'] })).toThrow()
  })

  it('defaults interval to 1', () => {
    expect(calendarRecurrenceSchema.parse({ frequency: 'daily' }).interval).toBe(1)
  })
})

describe('participant / availability / schedule schemas', () => {
  it('accepts a valid participant', () => {
    const r = calendarParticipantSchema.parse({ event_id: UUID, user_id: UUID, role: 'organizer' })
    expect(r.status).toBe('pending')
  })

  it('rejects invalid participant status', () => {
    expect(() => calendarParticipantSchema.parse({ event_id: UUID, user_id: UUID, status: 'maybe' })).toThrow()
  })

  it('accepts availability with HH:MM', () => {
    const r = calendarAvailabilitySchema.parse({ day_of_week: 1, start_time: '09:00', end_time: '17:00' })
    expect(r.is_active).toBe(true)
  })

  it('rejects malformed availability time', () => {
    expect(() => calendarAvailabilitySchema.parse({ day_of_week: 1, start_time: 'nine', end_time: '17:00' })).toThrow()
  })

  it('accepts a valid schedule request', () => {
    const r = calendarScheduleSchema.parse({
      title: 'Sync',
      duration_minutes: 30,
      attendee_ids: [UUID],
      start_date: '2026-08-18',
      start_time: '09:00',
    })
    expect(r.buffer_minutes).toBe(15)
  })

  it('requires at least one attendee', () => {
    expect(() => calendarScheduleSchema.parse({
      title: 'Sync', duration_minutes: 30, attendee_ids: [], start_date: '2026-08-18', start_time: '09:00',
    })).toThrow()
  })
})

describe('meeting schemas', () => {
  it('accepts a valid meeting', () => {
    const r = meetingSchema.parse({ title: 'Kickoff', start_time: '2026-08-19T10:00:00' })
    expect(r.meeting_type).toBe('internal')
    expect(r.status).toBe('scheduled')
    expect(r.timezone).toBe('UTC')
  })

  it('accepts valid meeting types', () => {
    for (const t of ['internal', 'customer', 'project', 'one_on_one', 'recruitment', 'standup', 'other']) {
      expect(meetingSchema.parse({ title: 'x', meeting_type: t, start_time: '2026-08-19' }).meeting_type).toBe(t)
    }
  })

  it('rejects invalid meeting type', () => {
    expect(() => meetingSchema.parse({ title: 'x', meeting_type: 'party', start_time: '2026-08-19' })).toThrow()
  })

  it('validates notes with mentions', () => {
    const r = meetingNotesSchema.parse({ meeting_id: UUID, content: 'Notes', mentions: [UUID] })
    expect(r.mentions).toHaveLength(1)
    expect(() => meetingNotesSchema.parse({ meeting_id: UUID, mentions: ['not-a-uuid'] })).toThrow()
  })

  it('validates decisions', () => {
    const r = meetingDecisionSchema.parse({ meeting_id: UUID, decision: 'Ship it' })
    expect(r.status).toBe('open')
    expect(() => meetingDecisionSchema.parse({ meeting_id: UUID })).toThrow()
  })

  it('validates action items', () => {
    const r = meetingActionItemSchema.parse({ meeting_id: UUID, description: 'Follow up' })
    expect(r.status).toBe('open')
  })
})

describe('communication schemas', () => {
  it('accepts a valid thread', () => {
    const r = communicationThreadSchema.parse({ title: 'General', thread_type: 'team' })
    expect(r.member_ids).toEqual([])
  })

  it('rejects invalid thread type', () => {
    expect(() => communicationThreadSchema.parse({ thread_type: 'carrier-pigeon' })).toThrow()
  })

  it('accepts a valid message with mentions', () => {
    const r = communicationMessageSchema.parse({ thread_id: UUID, body: 'hello @you', mentions: [UUID] })
    expect(r.message_type).toBe('message')
  })

  it('rejects empty message body', () => {
    expect(() => communicationMessageSchema.parse({ thread_id: UUID, body: '   ' })).toThrow()
  })

  it('rejects invalid mention uuids', () => {
    expect(() => communicationMessageSchema.parse({ thread_id: UUID, body: 'x', mentions: ['nope'] })).toThrow()
  })
})

describe('email schema', () => {
  it('accepts a valid email', () => {
    const r = emailMessageSchema.parse({ subject: 'Hi', to_emails: ['a@b.com'] })
    expect(r.cc_emails).toEqual([])
  })

  it('rejects email without recipients', () => {
    expect(() => emailMessageSchema.parse({ subject: 'Hi', to_emails: [] })).toThrow()
  })

  it('rejects invalid recipient email', () => {
    expect(() => emailMessageSchema.parse({ subject: 'Hi', to_emails: ['not-an-email'] })).toThrow()
  })
})

describe('RRULE helpers', () => {
  it('builds a weekly rule', () => {
    expect(buildRRule({ frequency: 'weekly', interval: 1, by_day: ['MO', 'WE'] })).toBe('FREQ=WEEKLY;BYDAY=MO,WE')
  })

  it('returns null when no recurrence provided', () => {
    expect(buildRRule(undefined)).toBeNull()
  })

  it('builds a daily rule without interval', () => {
    expect(buildRRule({ frequency: 'daily' })).toBe('FREQ=DAILY')
  })

  it('parses a weekly rule', () => {
    const r = parseRRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR')
    expect(r.frequency).toBe('weekly')
    expect(r.interval).toBe(2)
    expect(r.byDay).toEqual(['MO', 'FR'])
  })

  it('round-trips build and parse', () => {
    const built = buildRRule({ frequency: 'monthly', interval: 1, until: '2026-12-31' })
    const parsed = parseRRule(built!)
    expect(parsed.frequency).toBe('monthly')
    expect(parsed.until).toBeDefined()
  })
})

describe('getOccurrences', () => {
  it('generates daily occurrences', () => {
    const start = new Date('2026-08-18T09:00:00Z')
    const occ = getOccurrences(start, 'FREQ=DAILY', 5)
    expect(occ).toHaveLength(5)
    expect(occ[1].getDate()).toBe(19)
  })

  it('generates weekly occurrences', () => {
    const start = new Date('2026-08-18T09:00:00Z')
    const occ = getOccurrences(start, 'FREQ=WEEKLY;INTERVAL=1', 4)
    expect(occ).toHaveLength(4)
    expect(occ[1].getDate()).toBe(25)
  })

  it('respects BYDAY when provided', () => {
    const start = new Date('2026-08-18T09:00:00Z')
    const occ = getOccurrences(start, 'FREQ=WEEKLY;BYDAY=MO', 4)
    expect(occ.every(d => d.getDay() === 1)).toBe(true)
  })

  it('generates monthly occurrences', () => {
    const start = new Date('2026-08-18T09:00:00Z')
    const occ = getOccurrences(start, 'FREQ=MONTHLY', 3)
    expect(occ).toHaveLength(3)
    expect(occ[1].getMonth()).toBe(8)
  })
})

describe('availability & conflicts', () => {
  const slots = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true as boolean | null },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true as boolean | null },
  ]

  it('returns true for time within working hours', () => {
    const start = new Date('2026-08-18T09:00:00Z')
    const end = new Date('2026-08-18T10:00:00Z')
    expect(isAvailableFor(slots, start, end)).toBe(true)
  })

  it('returns false outside working hours', () => {
    const start = new Date('2026-08-18T18:00:00Z')
    const end = new Date('2026-08-18T19:00:00Z')
    expect(isAvailableFor(slots, start, end)).toBe(false)
  })

  it('returns false for unavailable day', () => {
    const start = new Date('2026-08-22T10:00:00Z')
    const end = new Date('2026-08-22T11:00:00Z')
    expect(isAvailableFor(slots, start, end)).toBe(false)
  })

  it('handles multi-day windows with a gap', () => {
    const start = new Date('2026-08-21T10:00:00Z')
    const end = new Date('2026-08-24T10:00:00Z')
    expect(isAvailableFor(slots, start, end)).toBe(false)
  })

  it('isAvailableForFn matches reference behavior', () => {
    const start = new Date('2026-08-18T10:00:00Z')
    const end = new Date('2026-08-18T11:00:00Z')
    expect(isAvailableFor(slots, start, end)).toBe(true)
  })

  it('finds overlapping conflicts', () => {
    const events = [
      { id: 'a', startDate: new Date('2026-08-18T09:00:00Z'), endDate: new Date('2026-08-18T10:30:00Z') },
      { id: 'b', startDate: new Date('2026-08-18T11:00:00Z'), endDate: new Date('2026-08-18T12:00:00Z') },
    ]
    const conflicts = findConflicts(events, new Date('2026-08-18T10:00:00Z'), new Date('2026-08-18T11:30:00Z'))
    expect(conflicts).toHaveLength(2)
  })

  it('excludes the event being rescheduled', () => {
    const events = [
      { id: 'a', startDate: new Date('2026-08-18T09:00:00Z'), endDate: new Date('2026-08-18T10:30:00Z') },
    ]
    const conflicts = findConflicts(events, new Date('2026-08-18T09:30:00Z'), new Date('2026-08-18T11:00:00Z'), 'a')
    expect(conflicts).toHaveLength(0)
  })

  it('findConflictsFn matches reference behavior', () => {
    const events = [{ startDate: new Date('2026-08-18T09:00:00Z'), endDate: new Date('2026-08-18T10:00:00Z') }]
    expect(findConflicts(events, new Date('2026-08-18T09:30:00Z'), new Date('2026-08-18T10:30:00Z'))).toHaveLength(1)
    expect(findConflicts(events, new Date('2026-08-18T10:00:00Z'), new Date('2026-08-18T11:00:00Z'))).toHaveLength(0)
  })
})

describe('permissions for calendar tools', () => {
  it('exposes calendar tool definitions', async () => {
    const { getCalendarTool } = await import('@/lib/ai/calendar-tools')
    expect(getCalendarTool('create_event')).toBeDefined()
    expect(getCalendarTool('create_event')?.requiresApproval).toBe(true)
    expect(getCalendarTool('create_event')?.audited).toBe(true)
    expect(getCalendarTool('create_event')?.permission).toBe('calendar:create')
    expect(getCalendarTool('list_upcoming_events')?.risk).toBe('low')
    expect(getCalendarTool('unknown')).toBeUndefined()
  })

  it('role filtering exposes all tools to admins', async () => {
    const { getCalendarToolsForRole } = await import('@/lib/ai/calendar-tools')
    const employeeTools = getCalendarToolsForRole('employee')
    expect(getCalendarToolsForRole('admin')?.length).toBeGreaterThan(10)
    expect(employeeTools?.length).toBeGreaterThan(0)
    expect(employeeTools?.some(t => t.name === 'create_event')).toBe(false)
  })
})