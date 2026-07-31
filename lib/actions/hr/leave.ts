'use server'

import { db } from '@/db'
import { hrLeaveTypes, hrLeaveBalances, hrLeaveRequests } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrLeaveTypeSchema, hrLeaveRequestSchema } from '@/lib/utils/validations'
import { createNotification } from '@/lib/actions/notifications'

export async function getLeaveTypes(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_leave_types')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  return (data || []) as any[]
}

export async function createLeaveType(input: { name: string; code: string; color?: string; daysPerYear?: number; carryOver?: number; requiresApproval?: boolean; organizationId: string }) {
  const parsed = hrLeaveTypeSchema.parse({ name: input.name, code: input.code, color: input.color, days_per_year: input.daysPerYear, carry_over: input.carryOver, requires_approval: input.requiresApproval })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:leave:approve')

  const [data] = await db.insert(hrLeaveTypes).values({
    name: parsed.name,
    code: parsed.code,
    color: parsed.color,
    daysPerYear: parsed.days_per_year?.toString() ?? '0',
    carryOver: parsed.carry_over?.toString() ?? '0',
    requiresApproval: parsed.requires_approval,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()
  return data
}

export async function updateLeaveType(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  for (const [key, value] of Object.entries(input)) {
    values[key] = value ?? null
  }
  await db.update(hrLeaveTypes).set(values).where(and(eq(hrLeaveTypes.id, id), isNull(hrLeaveTypes.deletedAt)))
  return { success: true }
}

export async function deleteLeaveType(id: string) {
  await db.update(hrLeaveTypes).set({ deletedAt: new Date() }).where(eq(hrLeaveTypes.id, id))
  return { success: true }
}

export async function getLeaveBalances(organizationId: string, year?: number) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('hr_leave_balances')
    .select('*, employee:employee_id(first_name, last_name), leave_type:leave_type_id(name, code, color)')
    .eq('organization_id', organizationId)
  if (year) query = query.eq('year', year)
  const { data } = await query
  return (data || []) as any[]
}

export async function setLeaveBalance(input: { employeeId: string; leaveTypeId: string; year: number; totalDays?: number; usedDays?: number; organizationId: string }) {
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:leave:approve')

  const existing = await db.select({ id: hrLeaveBalances.id })
    .from(hrLeaveBalances)
    .where(and(eq(hrLeaveBalances.employeeId, input.employeeId), eq(hrLeaveBalances.leaveTypeId, input.leaveTypeId), eq(hrLeaveBalances.year, input.year)))

  if (existing[0]) {
    await db.update(hrLeaveBalances)
      .set({
        totalDays: input.totalDays?.toString(),
        usedDays: input.usedDays?.toString(),
        updatedAt: new Date(),
      } as any)
      .where(eq(hrLeaveBalances.id, existing[0].id))
    return { success: true }
  }

  await db.insert(hrLeaveBalances).values({
    employeeId: input.employeeId,
    leaveTypeId: input.leaveTypeId,
    year: input.year,
    totalDays: input.totalDays?.toString() ?? '0',
    usedDays: input.usedDays?.toString() ?? '0',
    organizationId: input.organizationId,
  } as any)
  return { success: true }
}

export async function getLeaveRequests(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_leave_requests')
    .select('*, employee:employee_id(first_name, last_name, job_title), leave_type:leave_type_id(name, code, color)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createLeaveRequest(input: {
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason?: string | null
  organizationId: string
}) {
  const parsed = hrLeaveRequestSchema.parse({
    employee_id: input.employeeId,
    leave_type_id: input.leaveTypeId,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: input.reason ?? undefined,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:leave:request')

  const start = new Date(parsed.start_date)
  const end = new Date(parsed.end_date)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

  const [data] = await db.insert(hrLeaveRequests).values({
    employeeId: parsed.employee_id ?? user.id,
    leaveTypeId: parsed.leave_type_id,
    startDate: parsed.start_date,
    endDate: parsed.end_date,
    days: days.toString(),
    reason: parsed.reason || null,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_leave_requests', resourceId: (data as any).id })
  return data
}

export async function updateLeaveRequestStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled', organizationId: string) {
  const user = await getCurrentUser()
  await guardHrPermission(organizationId, 'hr:leave:approve')
  const approvedAt = status === 'approved' ? new Date() : null
  const reviewedAt = status === 'approved' || status === 'rejected' ? new Date() : null

  await db.update(hrLeaveRequests)
    .set({ status, approvedBy: status === 'approved' ? user.id : null, approvedAt, reviewedAt, updatedAt: new Date() })
    .where(eq(hrLeaveRequests.id, id))

  await logHrActivity({ organizationId, action: `leave_${status}`, resource: 'hr_leave_requests', resourceId: id })

  if (status === 'approved' || status === 'rejected') {
    const supabase = await createServerSupabaseClient()
    const { data: req } = await supabase
      .from('hr_leave_requests')
      .select('employee:employee_id(user_id), leave_type:leave_type_id(name), start_date, end_date, days')
      .eq('id', id)
      .single()

    const notifyUserId = (req as any)?.employee?.user_id
    if (notifyUserId) {
      const isApproved = status === 'approved'
      await createNotification({
        organization_id: organizationId,
        user_id: notifyUserId,
        title: isApproved ? 'Leave approved' : 'Leave rejected',
        message: isApproved
          ? `Your ${(req as any)?.leave_type?.name || 'leave'} request (${(req as any)?.start_date?.slice(0, 10)} to ${(req as any)?.end_date?.slice(0, 10)}) was approved`
          : `Your leave request was rejected`,
        type: isApproved ? 'success' : 'warning',
        link: `/hr/leave`,
      })
    }
  }
  return { success: true }
}

export async function deleteLeaveRequest(id: string) {
  await db.update(hrLeaveRequests).set({ deletedAt: new Date() }).where(eq(hrLeaveRequests.id, id))
  return { success: true }
}