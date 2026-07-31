'use server'

import { db } from '@/db'
import { hrAttendance, hrWorkSchedules, hrHolidays } from '@/db/schema'
import { eq, and, isNull, gte, lte } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrAttendanceSchema, hrWorkScheduleSchema, hrHolidaySchema } from '@/lib/utils/validations'

export async function getWorkSchedules(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_work_schedules')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  return (data || []) as any[]
}

export async function createWorkSchedule(input: { name: string; description?: string | null; workingDays?: string[]; startTime?: string | null; endTime?: string | null; weeklyHours?: number; shift?: string; flexible?: boolean; workMode?: string; organizationId: string }) {
  const parsed = hrWorkScheduleSchema.parse({
    name: input.name,
    description: input.description ?? undefined,
    working_days: input.workingDays,
    start_time: input.startTime,
    end_time: input.endTime,
    weekly_hours: input.weeklyHours,
    shift: input.shift,
    flexible: input.flexible,
    work_mode: input.workMode,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:attendance:manage')

  const [data] = await db.insert(hrWorkSchedules).values({
    name: parsed.name,
    description: parsed.description || null,
    workingDays: parsed.working_days,
    startTime: parsed.start_time ?? null,
    endTime: parsed.end_time ?? null,
    weeklyHours: parsed.weekly_hours?.toString() ?? '40',
    shift: parsed.shift,
    flexible: parsed.flexible,
    workMode: parsed.work_mode,
    organizationId: input.organizationId,
    createdBy: user.id,
  }).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_work_schedules', resourceId: (data as any).id })
  return data
}

export async function deleteWorkSchedule(id: string) {
  await db.update(hrWorkSchedules).set({ deletedAt: new Date() }).where(eq(hrWorkSchedules.id, id))
  return { success: true }
}

export async function getAttendance(organizationId: string, fromDate?: string, toDate?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('hr_attendance')
    .select('*, employee:employee_id(first_name, last_name, job_title)')
    .eq('organization_id', organizationId)
    .order('attendance_date', { ascending: false })
    .limit(200)
  if (fromDate) query = query.gte('attendance_date', fromDate)
  if (toDate) query = query.lte('attendance_date', toDate)
  const { data } = await query
  return (data || []) as any[]
}

export async function getAttendanceForEmployee(employeeId: string, fromDate?: string, toDate?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('hr_attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('attendance_date', { ascending: false })
    .limit(200)
  if (fromDate) query = query.gte('attendance_date', fromDate)
  if (toDate) query = query.lte('attendance_date', toDate)
  const { data } = await query
  return (data || []) as any[]
}

export async function recordAttendance(input: {
  employeeId: string
  attendanceDate: string
  checkIn?: string | null
  checkOut?: string | null
  status?: string
  workingMinutes?: number
  overtimeMinutes?: number
  lateMinutes?: number
  earlyDepartureMinutes?: number
  notes?: string | null
  organizationId: string
}) {
  const parsed = hrAttendanceSchema.parse({
    employee_id: input.employeeId,
    attendance_date: input.attendanceDate,
    check_in: input.checkIn,
    check_out: input.checkOut,
    status: input.status,
    working_minutes: input.workingMinutes,
    overtime_minutes: input.overtimeMinutes,
    late_minutes: input.lateMinutes,
    early_departure_minutes: input.earlyDepartureMinutes,
    notes: input.notes ?? undefined,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:attendance:manage')

  const [data] = await db.insert(hrAttendance).values({
    employeeId: parsed.employee_id,
    attendanceDate: parsed.attendance_date,
    checkIn: parsed.check_in ? new Date(parsed.check_in) : null,
    checkOut: parsed.check_out ? new Date(parsed.check_out) : null,
    status: parsed.status,
    workingMinutes: parsed.working_minutes ?? 0,
    overtimeMinutes: parsed.overtime_minutes ?? 0,
    lateMinutes: parsed.late_minutes ?? 0,
    earlyDepartureMinutes: parsed.early_departure_minutes ?? 0,
    notes: parsed.notes || null,
    createdBy: user.id,
    organizationId: input.organizationId,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_attendance', resourceId: (data as any).id })
  return data
}

export async function updateAttendance(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    checkIn: 'checkIn', checkOut: 'checkOut', status: 'status', workingMinutes: 'workingMinutes',
    overtimeMinutes: 'overtimeMinutes', lateMinutes: 'lateMinutes', earlyDepartureMinutes: 'earlyDepartureMinutes', notes: 'notes',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrAttendance).set(values).where(eq(hrAttendance.id, id))
  return { success: true }
}

export async function deleteAttendance(id: string) {
  await db.delete(hrAttendance).where(eq(hrAttendance.id, id))
  return { success: true }
}

export async function getHolidays(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_holidays')
    .select('*, department:department_id(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('holiday_date')
  return (data || []) as any[]
}

export async function createHoliday(input: { name: string; holidayDate: string; holidayType?: string; departmentId?: string | null; organizationId: string }) {
  const parsed = hrHolidaySchema.parse({ name: input.name, holiday_date: input.holidayDate, holiday_type: input.holidayType, department_id: input.departmentId })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:attendance:manage')

  const [data] = await db.insert(hrHolidays).values({
    name: parsed.name,
    holidayDate: parsed.holiday_date,
    holidayType: parsed.holiday_type,
    departmentId: parsed.department_id ?? null,
    organizationId: input.organizationId,
    createdBy: user.id,
  }).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_holidays', resourceId: (data as any).id })
  return data
}

export async function deleteHoliday(id: string) {
  await db.update(hrHolidays).set({ deletedAt: new Date() }).where(eq(hrHolidays.id, id))
  return { success: true }
}