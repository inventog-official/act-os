'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, guardHrPermission } from './utils'

export async function getCapacityOverview(organizationId: string) {
  await guardHrPermission(organizationId, 'hr:capacity:read')
  const supabase = await createServerSupabaseClient()

  const [employees, attendance, projectMembers] = await Promise.all([
    supabase.from('hr_employees').select('id, first_name, last_name, job_title, department_id, user_id').eq('organization_id', organizationId).is('deleted_at', null).eq('employment_status', 'active'),
    supabase.from('hr_attendance').select('employee_id, working_minutes, attendance_date').eq('organization_id', organizationId),
    supabase.from('project_members').select('user_id, project:projects(name, status)'),
  ])

  const emps = employees.data || []
  const att = attendance.data || []
  const pm = projectMembers.data || []

  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const weekAtt = att.filter(a => a.attendance_date >= weekStart)

  const perEmployeeMinutes: Record<string, number> = {}
  for (const a of weekAtt) perEmployeeMinutes[a.employee_id] = (perEmployeeMinutes[a.employee_id] || 0) + Number(a.working_minutes || 0)

  const activeProjectsByUser: Record<string, number> = {}
  for (const m of pm) {
    if ((m as any).project?.status === 'active') {
      const empl = emps.find(e => e.user_id === m.user_id)
      if (empl) activeProjectsByUser[empl.id] = (activeProjectsByUser[empl.id] || 0) + 1
    }
  }

  const rows = emps.map(e => {
    const minutes = perEmployeeMinutes[e.id] || 0
    const marginTarget = 40 * 60 * 5
    const utilization = Math.min(100, Math.round((minutes / marginTarget) * 100))
    const allocation = Math.min(100, (activeProjectsByUser[e.id] || 0) * 100)
    return {
      employeeId: e.id,
      name: `${e.first_name} ${e.last_name}`,
      jobTitle: e.job_title,
      departmentId: e.department_id,
      availability: Math.max(0, 100 - allocation),
      utilization,
      allocation,
    }
  })

  return {
    rows,
    availableEmployees: rows.filter(r => r.availability > 0),
    overallUtilization: rows.length ? Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length) : 0,
    overAllocated: rows.filter(r => r.allocation > 100).length,
  }
}

export async function suggestResourceAllocation(organizationId: string) {
  await guardHrPermission(organizationId, 'hr:capacity:read')
  const overview = await getCapacityOverview(organizationId)
  const supabase = await createServerSupabaseClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .is('deleted_at', null)

  return {
    available: overview.rows.filter(r => r.availability > 30).map(r => ({ name: r.name, jobTitle: r.jobTitle, availability: r.availability })),
    suggestedForProjects: (projects?.slice(0, 5) || []).map(p => ({
      projectId: p.id,
      projectName: p.name,
      candidateCount: overview.rows.filter(r => r.availability > 50).length,
    })),
  }
}