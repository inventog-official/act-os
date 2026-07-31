'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, guardHrPermission } from './utils'

export async function getHrDashboardStats(organizationId: string) {
  await guardHrPermission(organizationId, 'hr:dashboard:view')
  const supabase = await createServerSupabaseClient()

  const [employees, departments, attendance, leave, openings, candidates, activeReviews, goals] = await Promise.all([
    supabase.from('hr_employees').select('*').eq('organization_id', organizationId).is('deleted_at', null),
    supabase.from('hr_departments').select('*').eq('organization_id', organizationId).is('deleted_at', null),
    supabase.from('hr_attendance').select('*').eq('organization_id', organizationId),
    supabase.from('hr_leave_requests').select('*').eq('organization_id', organizationId).eq('status', 'pending').is('deleted_at', null),
    supabase.from('hr_job_openings').select('*').eq('organization_id', organizationId).eq('status', 'open').is('deleted_at', null),
    supabase.from('hr_candidates').select('*').eq('organization_id', organizationId).is('deleted_at', null),
    supabase.from('hr_performance_reviews').select('*').eq('organization_id', organizationId).in('status', ['draft', 'submitted']).is('deleted_at', null),
    supabase.from('hr_goals').select('*').eq('organization_id', organizationId).in('status', ['not_started', 'in_progress']).is('deleted_at', null),
  ])

  const empRows = employees.data || []
  const attRows = attendance.data || []
  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = attRows.filter(a => a.attendance_date === today)

  return {
    totalEmployees: empRows.length,
    activeEmployees: empRows.filter(e => e.employment_status === 'active').length,
    departments: departments.data?.length || 0,
    todayPresent: todayAttendance.filter(a => a.status === 'present').length,
    todayAbsent: todayAttendance.filter(a => a.status === 'absent').length,
    attendanceRate: todayAttendance.length ? Math.round((todayAttendance.filter(a => a.status === 'present').length / todayAttendance.length) * 100) : 0,
    pendingLeave: leave.data?.length || 0,
    openPositions: openings.data?.length || 0,
    candidates: candidates.data?.length || 0,
    candidatesInPipeline: (candidates.data || []).filter(c => !['hired', 'rejected'].includes(c.stage)).length,
    activeReviews: activeReviews.data?.length || 0,
    activeGoals: goals.data?.length || 0,
  }
}

export async function getHeadcountByDepartment(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const [departments, employees] = await Promise.all([
    supabase.from('hr_departments').select('*').eq('organization_id', organizationId).is('deleted_at', null),
    supabase.from('hr_employees').select('department_id').eq('organization_id', organizationId).is('deleted_at', null).eq('employment_status', 'active'),
  ])

  const deps = departments.data || []
  const emps = employees.data || []
  return deps.map(d => ({
    id: d.id,
    name: d.name,
    headcount: emps.filter(e => e.department_id === d.id).length,
  }))
}

export async function getAttendanceTrend(organizationId: string, days = 14) {
  const supabase = await createServerSupabaseClient()
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data } = await supabase
    .from('hr_attendance')
    .select('attendance_date, status')
    .eq('organization_id', organizationId)
    .gte('attendance_date', from)
    .order('attendance_date')

  const byDate: Record<string, { total: number; present: number }> = {}
  for (const a of (data || [])) {
    if (!byDate[a.attendance_date]) byDate[a.attendance_date] = { total: 0, present: 0 }
    byDate[a.attendance_date].total++
    if (a.status === 'present') byDate[a.attendance_date].present++
  }

  return Object.entries(byDate)
    .map(([date, d]) => ({ date, present: d.present, total: d.total, rate: d.total ? Math.round((d.present / d.total) * 100) : 0 }))
    .slice(-days)
}

export async function getLeaveSummary(organizationId: string, year?: number) {
  const supabase = await createServerSupabaseClient()
  const y = year || new Date().getFullYear()

  const [balances, requests] = await Promise.all([
    supabase
      .from('hr_leave_balances')
      .select('*, leave_type:leave_type_id(name, code, color)')
      .eq('organization_id', organizationId)
      .eq('year', y),
    supabase
      .from('hr_leave_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
  ])

  const usedByType: Record<string, number> = {}
  for (const r of (requests.data || [])) {
    if (r.status !== 'approved') continue
    usedByType[r.leave_type_id] = (usedByType[r.leave_type_id] || 0) + Number(r.days || 0)
  }

  const totals: Record<string, { leaveType: string; code: string; color: string; total: number; used: number }> = {}
  for (const b of (balances.data || [])) {
    const code = b.leave_type?.code || '_'
    const t = totals[code] || { leaveType: b.leave_type?.name || 'Unknown', code, color: b.leave_type?.color || '#3b82f6', total: 0, used: 0 }
    t.total += Number(b.total_days || 0)
    t.used += Number(b.used_days || 0) + (usedByType[b.leave_type_id] || 0)
    totals[code] = t
  }

  return Object.values(totals)
}

export async function getRecruitmentFunnel(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_candidates')
    .select('stage')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)

  const stages = ['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']
  const counts: Record<string, number> = {}
  for (const c of (data || [])) counts[c.stage] = (counts[c.stage] || 0) + 1
  return stages.map(s => ({ stage: s, count: counts[s] || 0 }))
}

export async function getDepartmentHeadcountReport(organizationId: string) {
  await guardHrPermission(organizationId, 'hr:reports:read')
  return getHeadcountByDepartment(organizationId)
}

export async function getPerformanceDistribution(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_performance_reviews')
    .select('rating')
    .eq('organization_id', organizationId)
    .not('rating', 'is', null)
    .is('deleted_at', null)

  const bands = { '0-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 }
  for (const r of (data || [])) {
    const rating = Number(r.rating || 0)
    if (rating < 2) bands['0-2']++
    else if (rating < 3) bands['2-3']++
    else if (rating < 4) bands['3-4']++
    else bands['4-5']++
  }
  return Object.entries(bands).map(([band, count]) => ({ band, count }))
}