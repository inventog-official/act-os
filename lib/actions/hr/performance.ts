'use server'

import { db } from '@/db'
import { hrPerformanceCycles, hrPerformanceReviews, hrGoals } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, logHrActivity, guardHrPermission } from './utils'
import { hrPerformanceCycleSchema, hrPerformanceReviewSchema, hrGoalSchema } from '@/lib/utils/validations'

export async function getPerformanceCycles(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_performance_cycles')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createPerformanceCycle(input: { name: string; periodType?: string; startDate?: string | null; endDate?: string | null; status?: string; organizationId: string }) {
  const parsed = hrPerformanceCycleSchema.parse({
    name: input.name,
    period_type: input.periodType,
    start_date: input.startDate,
    end_date: input.endDate,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:performance:manage')

  const [data] = await db.insert(hrPerformanceCycles).values({
    name: parsed.name,
    periodType: parsed.period_type,
    startDate: parsed.start_date || null,
    endDate: parsed.end_date || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  }).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_performance_cycles', resourceId: (data as any).id })
  return data
}

export async function updatePerformanceCycle(id: string, input: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = { name: 'name', periodType: 'periodType', startDate: 'startDate', endDate: 'endDate', status: 'status' }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  await db.update(hrPerformanceCycles).set(values).where(and(eq(hrPerformanceCycles.id, id), isNull(hrPerformanceCycles.deletedAt)))
  return { success: true }
}

export async function deletePerformanceCycle(id: string) {
  await db.update(hrPerformanceCycles).set({ deletedAt: new Date() }).where(eq(hrPerformanceCycles.id, id))
  return { success: true }
}

export async function getPerformanceReviews(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_performance_reviews')
    .select('*, employee:employee_id(first_name, last_name, job_title), cycle:cycle_id(name, period_type), reviewer:reviewer_id(first_name, last_name)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createPerformanceReview(input: {
  employeeId: string
  cycleId: string
  reviewerId?: string | null
  rating?: number | null
  goalsAchieved?: string | null
  strengths?: string | null
  improvements?: string | null
  overallFeedback?: string | null
  developmentPlan?: string | null
  status?: string
  organizationId: string
}) {
  const parsed = hrPerformanceReviewSchema.parse({
    employee_id: input.employeeId,
    cycle_id: input.cycleId,
    reviewer_id: input.reviewerId,
    rating: input.rating,
    goals_achieved: input.goalsAchieved ?? undefined,
    strengths: input.strengths ?? undefined,
    improvements: input.improvements ?? undefined,
    overall_feedback: input.overallFeedback ?? undefined,
    development_plan: input.developmentPlan ?? undefined,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:performance:manage')

  const [data] = await db.insert(hrPerformanceReviews).values({
    employeeId: parsed.employee_id,
    cycleId: parsed.cycle_id,
    reviewerId: parsed.reviewer_id ?? null,
    rating: parsed.rating?.toString() ?? null,
    goalsAchieved: parsed.goals_achieved || null,
    strengths: parsed.strengths || null,
    improvements: parsed.improvements || null,
    overallFeedback: parsed.overall_feedback || null,
    developmentPlan: parsed.development_plan || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_performance_reviews', resourceId: (data as any).id })
  return data
}

export async function updatePerformanceReview(id: string, input: Record<string, unknown>, organizationId: string) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    reviewerId: 'reviewerId', rating: 'rating', goalsAchieved: 'goalsAchieved', strengths: 'strengths',
    improvements: 'improvements', overallFeedback: 'overallFeedback', developmentPlan: 'developmentPlan', status: 'status',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  if (input.status === 'submitted' && input.status !== undefined) values.submittedAt = new Date()
  await db.update(hrPerformanceReviews).set(values).where(and(eq(hrPerformanceReviews.id, id), isNull(hrPerformanceReviews.deletedAt)))
  await logHrActivity({ organizationId, action: 'update', resource: 'hr_performance_reviews', resourceId: id })
  return { success: true }
}

export async function getGoals(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('hr_goals')
    .select('*, department:department_id(name), employee:employee_id(first_name, last_name), parent:parent_goal_id(title)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createGoal(input: {
  title: string
  description?: string | null
  goalLevel?: string
  parentGoalId?: string | null
  departmentId?: string | null
  employeeId?: string | null
  target?: number | null
  deadline?: string | null
  status?: string
  organizationId: string
}) {
  const parsed = hrGoalSchema.parse({
    title: input.title,
    description: input.description ?? undefined,
    goal_level: input.goalLevel,
    parent_goal_id: input.parentGoalId,
    department_id: input.departmentId,
    employee_id: input.employeeId,
    target: input.target,
    deadline: input.deadline,
    status: input.status,
  })
  const user = await getCurrentUser()
  await guardHrPermission(input.organizationId, 'hr:goals:manage')

  const [data] = await db.insert(hrGoals).values({
    title: parsed.title,
    description: parsed.description || null,
    goalLevel: parsed.goal_level,
    parentGoalId: parsed.parent_goal_id ?? null,
    departmentId: parsed.department_id ?? null,
    employeeId: parsed.employee_id ?? null,
    target: parsed.target?.toString() ?? null,
    deadline: parsed.deadline || null,
    status: parsed.status,
    organizationId: input.organizationId,
    createdBy: user.id,
  } as any).returning()

  await logHrActivity({ organizationId: input.organizationId, action: 'create', resource: 'hr_goals', resourceId: (data as any).id })
  return data
}

export async function updateGoal(id: string, input: Record<string, unknown>, organizationId: string) {
  const values: Record<string, unknown> = { updatedAt: new Date() }
  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', goalLevel: 'goalLevel', parentGoalId: 'parentGoalId',
    departmentId: 'departmentId', employeeId: 'employeeId', target: 'target', currentValue: 'currentValue',
    progress: 'progress', deadline: 'deadline', status: 'status',
  }
  for (const [key, value] of Object.entries(input)) {
    if (key in fieldMap) values[key] = value ?? null
  }
  if (input.progress !== undefined && input.target === undefined) {
    const [goal] = await db.select({ target: hrGoals.target, currentValue: hrGoals.currentValue }).from(hrGoals).where(eq(hrGoals.id, id))
    const target = Number((goal as any)?.target || 0)
    if (target > 0) {
      const progress = Number(input.progress)
      values.currentValue = ((progress / 100) * target).toString()
    }
  }
  await db.update(hrGoals).set(values).where(and(eq(hrGoals.id, id), isNull(hrGoals.deletedAt)))
  await logHrActivity({ organizationId, action: 'update', resource: 'hr_goals', resourceId: id })
  return { success: true }
}

export async function deleteGoal(id: string) {
  await db.update(hrGoals).set({ deletedAt: new Date() }).where(eq(hrGoals.id, id))
  return { success: true }
}