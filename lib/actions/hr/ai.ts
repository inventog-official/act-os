'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getHrTool } from '@/lib/ai/hr-tools'
import { getHrDashboardStats, getHeadcountByDepartment, getAttendanceTrend, getLeaveSummary, getRecruitmentFunnel, getPerformanceDistribution } from './reports'
import { getWorkforceCapacity, getOrgChart } from './timeline'
import { getHrTimeline } from './timeline'

export async function hrAIAction(name: string, organizationId: string, args?: Record<string, unknown>) {
  const tool = getHrTool(name)
  if (!tool) throw new Error(`Unknown HR tool: ${name}`)
  if (!organizationId) throw new Error('Organization is required')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (tool.requiresApproval && tool.risk !== 'low') {
    return {
      requiresApproval: true,
      tool: name,
      risk: tool.risk,
      message: 'This action requires approval before execution.',
    }
  }

  const results: Record<string, unknown> = {}
  const days = Number(args?.days || 14)
  const year = Number(args?.year || new Date().getFullYear())

  if (name === 'get_hr_dashboard_stats') results.data = await getHrDashboardStats(organizationId)
  else if (name === 'get_headcount_by_department') results.data = await getHeadcountByDepartment(organizationId)
  else if (name === 'get_attendance_trend') results.data = await getAttendanceTrend(organizationId, days)
  else if (name === 'get_leave_summary') results.data = await getLeaveSummary(organizationId, year)
  else if (name === 'get_recruitment_funnel') results.data = await getRecruitmentFunnel(organizationId)
  else if (name === 'get_performance_distribution') results.data = await getPerformanceDistribution(organizationId)
  else if (name === 'get_workforce_capacity') results.data = await getWorkforceCapacity(organizationId)
  else if (name === 'get_org_chart') results.data = await getOrgChart(organizationId)
  else if (name === 'get_hr_timeline') results.data = await getHrTimeline(organizationId)
  else throw new Error(`Unsupported HR tool: ${name}`)

  return { ...results, tool: name, audited: tool.audited, reversible: tool.reversible }
}

export async function hrAssistantAnswer(question: string, organizationId: string) {
  const q = question.toLowerCase()
  const stats = await getHrDashboardStats(organizationId)

  if (q.includes('headcount') || q.includes('employee') || q.includes('team size')) {
    const byDept = await getHeadcountByDepartment(organizationId)
    return {
      answer: `You have ${stats.totalEmployees} employees total (${stats.activeEmployees} active) across ${stats.departments} departments. ` + byDept.map(d => `${d.name}: ${d.headcount}`).join(', '),
      data: { totalEmployees: stats.totalEmployees, activeEmployees: stats.activeEmployees, byDept },
    }
  }

  if (q.includes('attendance') || q.includes('absent') || q.includes('present')) {
    return {
      answer: `Today ${stats.todayPresent} employees are present and ${stats.todayAbsent} absent. Overall attendance rate is ${stats.attendanceRate}%.`,
      data: stats,
    }
  }

  if (q.includes('leave')) {
    const summary = await getLeaveSummary(organizationId)
    const pending = stats.pendingLeave
    return {
      answer: `There are ${pending} pending leave requests. ` + summary.map(s => `${s.leaveType}: ${s.used}/${s.total} days used`).join(', ') || 'No leave balances set up yet.',
      data: { pending, summary },
    }
  }

  if (q.includes('recruit') || q.includes('hiring') || q.includes('candidate') || q.includes('job')) {
    const funnel = await getRecruitmentFunnel(organizationId)
    const open = funnel.filter(f => f.stage === 'offer' || f.stage === 'interview' || f.stage === 'technical').reduce((s, f) => s + f.count, 0)
    return {
      answer: `You have ${stats.openPositions} open positions and ${stats.candidates} candidates in the pipeline (${open} in active consideration). ` + funnel.filter(f => f.count > 0).map(f => `${f.stage}: ${f.count}`).join(', '),
      data: { openPositions: stats.openPositions, candidates: stats.candidates, funnel },
    }
  }

  if (q.includes('capacity') || q.includes('workload') || q.includes('utilization')) {
    const capacity = await getWorkforceCapacity(organizationId)
    return {
      answer: `Overall capacity utilization is ${capacity.totalCapacity}%. ${capacity.todayPresent} of ${capacity.activeEmployees} active employees are present today.`,
      data: capacity,
    }
  }

  return {
    answer: `Here is a snapshot of your workforce: ${stats.totalEmployees} employees (${stats.activeEmployees} active), ${stats.departments} departments, ${stats.openPositions} open positions, ${stats.pendingLeave} pending leave requests.`,
    data: stats,
  }
}

export { getHrDashboardStats }