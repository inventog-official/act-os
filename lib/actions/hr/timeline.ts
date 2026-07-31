'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getHrTimeline(organizationId: string, limit = 50) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_activities')
    .select('*, user:user_id(id, email)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []) as any[]
}

export async function getOrgChart(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const [departments, employees] = await Promise.all([
    supabase.from('hr_departments').select('*').eq('organization_id', organizationId).is('deleted_at', null),
    supabase.from('hr_employees').select('*').eq('organization_id', organizationId).is('deleted_at', null).eq('employment_status', 'active'),
  ])

  const deps = departments.data || []
  const emps = employees.data || []

  return {
    departments: deps.map(d => ({
      id: d.id,
      name: d.name,
      managerId: d.manager_id,
      employees: emps
        .filter(e => e.department_id === d.id)
        .map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, jobTitle: e.job_title, managerId: e.manager_id })),
    })),
    unassigned: emps
      .filter(e => !e.department_id)
      .map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, jobTitle: e.job_title, managerId: e.manager_id })),
  }
}

export async function getWorkforceCapacity(organizationId: string) {
  const supabase = await createServerSupabaseClient()

  const [employees, attendance] = await Promise.all([
    supabase.from('hr_employees').select('*').eq('organization_id', organizationId).is('deleted_at', null).eq('employment_status', 'active'),
    supabase.from('hr_attendance').select('*').eq('organization_id', organizationId),
  ])

  const emps = employees.data || []
  const att = attendance.data || []

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const weekAgo = att.filter(a => a.attendance_date >= weekStart)

  const totalScheduledMinutes = emps.length * 5 * 8 * 60
  const totalLoggedMinutes = weekAgo.reduce((s, a) => s + Number(a.working_minutes || 0), 0)

  const projectMembers = await supabase
    .from('project_members')
    .select('user_id, project:projects(name, status)')

  const utilMap: Record<string, number> = {}
  for (const pm of (projectMembers.data || [])) {
    const emp = emps.find(e => e.user_id === pm.user_id)
    if (!emp) continue
    if ((pm as any).project?.status === 'active') utilMap[emp.id] = (utilMap[emp.id] || 0) + 1
  }

  const capacity = emps.map(e => ({
    id: e.id,
    name: `${e.first_name} ${e.last_name}`,
    jobTitle: e.job_title,
    departmentId: e.department_id,
    allocation: Math.min(100, (utilMap[e.id] || 0) * 100),
    utilization: totalScheduledMinutes ? Math.round((totalLoggedMinutes / Math.max(1, totalScheduledMinutes)) * 100) : 0,
  }))

  return {
    capacity,
    totalCapacity: Math.round((totalLoggedMinutes / Math.max(1, totalScheduledMinutes)) * 100),
    todayPresent: att.filter(a => a.attendance_date === today && a.status === 'present').length,
    activeEmployees: emps.length,
  }
}