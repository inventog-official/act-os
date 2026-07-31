// Pure calendar logic — no server access, safe for client/tests/server.

export function buildRRule(recurrence?: { frequency: string; interval?: number; by_day?: string[]; until?: string | null; count?: number | null }): string | null {
  if (!recurrence?.frequency) return null
  const parts = [`FREQ=${recurrence.frequency.toUpperCase()}`]
  if (recurrence.interval && recurrence.interval > 1) parts.push(`INTERVAL=${recurrence.interval}`)
  if (recurrence.by_day?.length) parts.push(`BYDAY=${recurrence.by_day.join(',')}`)
  if (recurrence.until) parts.push(`UNTIL=${recurrence.until.replace(/[-:]/g, '').replace(/\.\d+/, '')}Z`)
  if (recurrence.count) parts.push(`COUNT=${recurrence.count}`)
  return parts.join(';')
}

export function parseRRule(rule: string): { frequency: string; interval: number; byDay?: string[]; until?: string | null; count?: number | null } {
  const parsed: { frequency: string; interval: number; byDay?: string[]; until?: string | null; count?: number | null } = {
    frequency: 'weekly',
    interval: 1,
  }
  for (const part of rule.split(';')) {
    const [key, ...val] = part.split('=')
    const value = val.join('=')
    if (key === 'FREQ') parsed.frequency = value.toLowerCase()
    else if (key === 'INTERVAL') parsed.interval = Number(value) || 1
    else if (key === 'BYDAY') parsed.byDay = value.split(',')
    else if (key === 'UNTIL') parsed.until = value
    else if (key === 'COUNT') parsed.count = Number(value)
  }
  return parsed
}

export function getOccurrences(start: Date, rrule: string, limit = 50): Date[] {
  const { frequency, interval, byDay } = parseRRule(rrule)
  const occurrences: Date[] = []
  const current = new Date(start)

  const snapToDay = () => {
    if (!byDay?.length) return
    const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
    const target = dayMap[byDay[0]]
    const currentDay = current.getDay()
    const diff = (target - currentDay + 7) % 7
    if (diff > 0) current.setDate(current.getDate() + diff)
  }

  snapToDay()
  occurrences.push(new Date(current))
  let attempts = 0

  while (occurrences.length < limit && attempts < limit * 50) {
    attempts += 1
    if (frequency === 'daily') {
      current.setDate(current.getDate() + interval)
    } else if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7 * interval)
    } else if (frequency === 'monthly') {
      const day = current.getDate()
      current.setMonth(current.getMonth() + interval)
      if (current.getDate() !== day) current.setDate(0)
    } else if (frequency === 'yearly') {
      current.setFullYear(current.getFullYear() + interval)
    }
    snapToDay()
    occurrences.push(new Date(current))
  }
  return occurrences
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function isAvailableFor(
  availability: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean | null }[],
  start: Date,
  end: Date
): boolean {
  const neededBlocks: { start: Date; end: Date }[] = []
  const cursor = new Date(start)
  while (cursor < end) {
    const dayEnd = new Date(cursor)
    dayEnd.setHours(23, 59, 59, 999)
    const blockEnd = dayEnd < end ? dayEnd : end
    neededBlocks.push({ start: new Date(cursor), end: new Date(blockEnd) })
    cursor.setDate(cursor.getDate() + 1)
    cursor.setHours(0, 0, 0, 0)
  }

  for (const block of neededBlocks) {
    const day = block.start.getDay()
    const slot = availability.find(a => a.dayOfWeek === day && a.isActive)
    if (!slot) return false
    const slotStart = minutesToDate(block.start, timeToMinutes(slot.startTime))
    const slotEnd = minutesToDate(block.start, timeToMinutes(slot.endTime))
    if (block.start < slotStart || block.end > slotEnd) return false
  }
  return true
}

export function findConflicts(events: { startDate: Date | string; endDate?: Date | string | null }[], start: Date, end: Date, excludeEventId?: string) {
  return events.filter(e => {
    if (excludeEventId && (e as any).id === excludeEventId) return false
    const eStart = new Date(e.startDate)
    const eEnd = e.endDate ? new Date(e.endDate) : new Date(eStart.getTime() + 60 * 60000)
    return start < eEnd && end > eStart
  })
}

export function minutesToDate(base: Date, minutes: number): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() + minutes * 60000)
}

// ---------------------------------------------------------------------------
// Recurring-series helpers (Modules 3, 20)
// ---------------------------------------------------------------------------

export function toDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export interface SeriesException {
  recurrenceExceptionDate?: Date | string | null
  status?: string | null
}

/**
 * Returns the set of occurrence dates that are cancelled or edited by
 * exceptions, keyed by YYYY-MM-DD. Used to collapse a recurring series into
 * its visible occurrences without duplicating records (Module 3).
 */
export function buildExceptionDateSet(exceptions: SeriesException[]): Set<string> {
  const set = new Set<string>()
  for (const e of exceptions) {
    if (e.recurrenceExceptionDate) set.add(toDateKey(e.recurrenceExceptionDate))
  }
  return set
}

export interface SeriesOccurrence {
  date: Date
  cancelled: boolean
  edited: boolean
  exception?: SeriesException
}

/**
 * Expand a recurring series into individual occurrences, overlaying any
 * per-occurrence exceptions (cancel/edits) without creating duplicate rows.
 */
export function expandSeries(parent: { startDate: Date | string; recurrenceRule?: string | null; endDate?: Date | string | null }, exceptions: SeriesException[], limit = 50): SeriesOccurrence[] {
  if (!parent.recurrenceRule) {
    return [{
      date: new Date(parent.startDate),
      cancelled: false,
      edited: false,
    }]
  }
  const occurrences = getOccurrences(new Date(parent.startDate), parent.recurrenceRule, limit)
  const byDate = new Map<string, SeriesException>()
  for (const ex of exceptions) {
    if (ex.recurrenceExceptionDate) byDate.set(toDateKey(ex.recurrenceExceptionDate), ex)
  }
  return occurrences.map(occ => {
    const ex = byDate.get(toDateKey(occ))
    return {
      date: occ,
      cancelled: !!ex && ex.status === 'cancelled',
      edited: !!ex && ex.status !== 'cancelled',
      exception: ex,
    }
  })
}

// ---------------------------------------------------------------------------
// Conflict detection with leave / holidays / working hours (Modules 4, 21)
// ---------------------------------------------------------------------------

export interface LeaveBlock {
  startDate: string
  endDate: string
}

export interface ConflictResult {
  hasConflict: boolean
  reasons: string[]
}

/**
 * Working-hours aware conflict check: folds in HR leave requests and holiday
 * records so availability never considers a day available just because the
 * client calendar says so (Modules 4, 21).
 */
export function detectConflicts(
  availability: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean | null }[],
  events: { startDate: Date | string; endDate?: Date | string | null }[],
  leave: LeaveBlock[],
  holidays: { holidayDate: string }[],
  start: Date,
  end: Date,
  excludeEventId?: string
): ConflictResult {
  const reasons: string[] = []

  if (!isAvailableFor(availability, start, end)) {
    reasons.push('Outside configured working hours')
  }

  const overlappingEvents = findConflicts(events, start, end, excludeEventId)
  if (overlappingEvents.length) {
    reasons.push(`Conflicts with ${overlappingEvents.length} existing event(s)`)
  }

  const leaveOverlap = leave.some(l => {
    const ls = new Date(l.startDate)
    const le = new Date(l.endDate)
    le.setHours(23, 59, 59, 999)
    return start < le && end > ls
  })
  if (leaveOverlap) reasons.push('Attendee is on approved leave')

  const holidayOverlap = holidays.some(h => {
    const hd = new Date(h.holidayDate)
    hd.setHours(0, 0, 0, 0)
    const hEnd = new Date(hd)
    hEnd.setHours(23, 59, 59, 999)
    return start < hEnd && end > hd
  })
  if (holidayOverlap) reasons.push('Falls on an organization holiday')

  return { hasConflict: reasons.length > 0, reasons }
}

// ---------------------------------------------------------------------------
// Time-zone helpers (Module 20)
// ---------------------------------------------------------------------------

export function formatInTimeZone(date: Date | string, timeZone: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  try {
    return new Intl.DateTimeFormat('en-US', { ...opts, timeZone }).format(typeof date === 'string' ? new Date(date) : date)
  } catch {
    return new Date(date).toLocaleString()
  }
}

export function toUTC(date: Date | string, sourceTimeZone: string): Date {
  if (date instanceof Date) return new Date(date.getTime())
  const str = String(date)
  // Already timezone-qualified — parse as an instant.
  if (/[zZ]|[+-]\d\d:\d\d$/.test(str)) return new Date(str)
  // Naive wall-clock string — parse its components explicitly (TZ-independent).
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):?(\d{2})?)?/.exec(str)
  if (!m) return new Date(str)
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  if (sourceTimeZone === 'UTC' || sourceTimeZone === 'Etc/UTC') {
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
  }
  const wall = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: sourceTimeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(wall)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || 0)
  const offsetMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second')) - wall.getTime()
  return new Date(wall.getTime() - offsetMs)
}