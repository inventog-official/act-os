import { describe, it, expect } from 'vitest'
import {
  buildExceptionDateSet,
  expandSeries,
  detectConflicts,
  formatInTimeZone,
  toUTC,
  toDateKey,
} from '@/lib/utils/calendar'

describe('recurring series helpers', () => {
  const parent = {
    startDate: '2026-08-03T09:00:00Z',
    recurrenceRule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO',
  }

  it('buildExceptionDateSet keys exception dates by day', () => {
    const set = buildExceptionDateSet([
      { recurrenceExceptionDate: '2026-08-10T09:00:00Z', status: 'cancelled' },
      { recurrenceExceptionDate: '2026-08-17T09:00:00Z', status: 'scheduled' },
      { recurrenceExceptionDate: null },
    ])
    expect(set.has('2026-08-10')).toBe(true)
    expect(set.has('2026-08-17')).toBe(true)
    expect(set.size).toBe(2)
  })

  it('expands a series into occurrences without duplicates', () => {
    const occ = expandSeries(parent, [], 5)
    expect(occ).toHaveLength(5)
    expect(occ.every(o => o.date.getDay() === 1)).toBe(true)
    expect(occ.every(o => !o.cancelled && !o.edited)).toBe(true)
  })

  it('marks cancelled occurrences from exceptions', () => {
    const occ = expandSeries(parent, [{ recurrenceExceptionDate: '2026-08-17T09:00:00Z', status: 'cancelled' }], 5)
    const cancelled = occ.find(o => toDateKey(o.date) === '2026-08-17')
    expect(cancelled?.cancelled).toBe(true)
    expect(occ.filter(o => o.cancelled)).toHaveLength(1)
  })

  it('marks edited occurrences from exceptions', () => {
    const occ = expandSeries(parent, [{ recurrenceExceptionDate: '2026-08-10T09:00:00Z', status: 'scheduled' }], 4)
    const edited = occ.find(o => toDateKey(o.date) === '2026-08-10')
    expect(edited?.edited).toBe(true)
    expect(edited?.exception?.status).toBe('scheduled')
  })

  it('treats a single event without recurrence as a one-off occurrence', () => {
    const occ = expandSeries({ startDate: '2026-08-20T14:00:00Z', recurrenceRule: null }, [], 10)
    expect(occ).toHaveLength(1)
    expect(toDateKey(occ[0].date)).toBe('2026-08-20')
  })

  it('respects the occurrence limit', () => {
    const occ = expandSeries({ startDate: '2026-08-03T09:00:00Z', recurrenceRule: 'FREQ=DAILY' }, [], 3)
    expect(occ).toHaveLength(3)
  })
})

describe('detectConflicts', () => {
  const availability = [
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true }, // Tuesday
  ]
  const events = [{ startDate: '2026-08-18T10:00:00', endDate: '2026-08-18T11:00:00' }]

  it('returns no conflict for a free slot within working hours', () => {
    const r = detectConflicts(availability, events, [], [], new Date('2026-08-18T13:00:00'), new Date('2026-08-18T14:00:00'))
    expect(r.hasConflict).toBe(false)
    expect(r.reasons).toHaveLength(0)
  })

  it('flags an overlapping existing event', () => {
    const r = detectConflicts(availability, events, [], [], new Date('2026-08-18T10:30:00'), new Date('2026-08-18T11:30:00'))
    expect(r.hasConflict).toBe(true)
    expect(r.reasons.join()).toContain('existing event')
  })

  it('excludes the excluded event id', () => {
    const withId = [{ id: 'abc', startDate: '2026-08-18T10:00:00', endDate: '2026-08-18T11:00:00' }]
    const r = detectConflicts(availability, withId, [], [], new Date('2026-08-18T10:30:00'), new Date('2026-08-18T11:30:00'), 'abc')
    expect(r.hasConflict).toBe(false)
  })

  it('flags days outside configured working hours', () => {
    const r = detectConflicts(availability, [], [], [], new Date('2026-08-18T18:00:00'), new Date('2026-08-18T19:00:00'))
    expect(r.hasConflict).toBe(true)
    expect(r.reasons.join()).toContain('working hours')
  })

  it('flags approved leave', () => {
    const r = detectConflicts(
      availability, [], [{ startDate: '2026-08-17', endDate: '2026-08-21' }], [],
      new Date('2026-08-18T13:00:00'), new Date('2026-08-18T14:00:00')
    )
    expect(r.hasConflict).toBe(true)
    expect(r.reasons.join()).toContain('leave')
  })

  it('flags organization holidays', () => {
    const r = detectConflicts(
      availability, [], [], [{ holidayDate: '2026-08-18' }],
      new Date('2026-08-18T13:00:00'), new Date('2026-08-18T14:00:00')
    )
    expect(r.hasConflict).toBe(true)
    expect(r.reasons.join()).toContain('holiday')
  })
})

describe('timezone helpers', () => {
  it('formats a date in a target timezone', () => {
    const s = formatInTimeZone('2026-08-18T12:00:00Z', 'UTC', { hour: 'numeric', minute: 'numeric', hour12: false })
    expect(s).toBe('12:00')
  })

  it('re-interprets wall-clock time in a source timezone as UTC', () => {
    const utc = toUTC('2026-08-18T09:00:00', 'America/New_York')
    expect(utc.toISOString().slice(0, 16)).toBe('2026-08-18T13:00')
  })

  it('leaves UTC input unchanged', () => {
    const utc = toUTC('2026-08-18T09:00:00', 'UTC')
    expect(utc.toISOString().slice(0, 16)).toBe('2026-08-18T09:00')
  })
})
