'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { sprints, sprintTasks } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

export async function getSprints(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('sprints')
    .select('*, tasks:sprint_tasks(task:tasks(*, assignee:auth.users!assignee_id(id, email, user_metadata)))')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export async function createSprint(input: {
  project_id: string
  name: string
  goal?: string | null
  status?: string
  start_date?: string | null
  end_date?: string | null
}) {
  const user = await getCurrentUser()
  const [sprint] = await db.insert(sprints).values({
    projectId: input.project_id,
    name: input.name,
    goal: input.goal || null,
    status: input.status || 'planning' as const,
    startDate: input.start_date || null,
    endDate: input.end_date || null,
    createdBy: user.id,
  } as any).returning()

  await createProjectActivity({
    project_id: input.project_id,
    action: 'sprint.created',
    description: `Created sprint "${input.name}"`,
  }).catch(() => {})

  return sprint as any
}

export async function updateSprint(id: string, input: Partial<{
  name: string
  goal: string | null
  status: string
  start_date: string | null
  end_date: string | null
}>) {
  const vals: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) vals.name = input.name
  if (input.goal !== undefined) vals.goal = input.goal
  if (input.status !== undefined) vals.status = input.status
  if (input.start_date !== undefined) vals.startDate = input.start_date
  if (input.end_date !== undefined) vals.endDate = input.end_date
  if (input.status === 'completed') vals.completedAt = new Date()

  const [sprint] = await db.update(sprints).set(vals as any)
    .where(and(eq(sprints.id, id), isNull(sprints.deletedAt))).returning()

  await createProjectActivity({
    project_id: (sprint as any).project_id,
    action: 'sprint.updated',
    description: `Updated sprint "${(sprint as any).name}"`,
    metadata: { changes: Object.keys(input) },
  }).catch(() => {})

  return sprint as any
}

export async function deleteSprint(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: sprint } = await supabase.from('sprints').select('project_id, name').eq('id', id).single()
  await db.update(sprints).set({ deletedAt: new Date() }).where(eq(sprints.id, id))
  if (sprint) {
    await createProjectActivity({
      project_id: (sprint as any).project_id,
      action: 'sprint.deleted',
      description: `Deleted sprint "${(sprint as any).name}"`,
    }).catch(() => {})
  }
  return { success: true }
}

export async function addTaskToSprint(sprintId: string, taskId: string) {
  try {
    await db.insert(sprintTasks).values({ sprintId, taskId })
  } catch (e: any) {
    if (!e.message?.includes('duplicate')) throw e
  }
  return { success: true }
}

export async function removeTaskFromSprint(sprintId: string, taskId: string) {
  await db.delete(sprintTasks)
    .where(and(eq(sprintTasks.sprintId, sprintId), eq(sprintTasks.taskId, taskId)))
  return { success: true }
}

export async function getSprintVelocity(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('sprints')
    .select('id, name, status, start_date, end_date, tasks:sprint_tasks(task:tasks(estimated_hours, status))')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .is('deleted_at', null)
  const sprintList = (data || []).map(s => ({
    ...s,
    completed_points: (s.tasks as any[] || []).filter((st: any) => st.task?.status === 'done').length,
    total_points: (s.tasks as any[] || []).length,
  }))
  return sprintList as any[]
}
