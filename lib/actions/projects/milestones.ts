'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { milestones, milestoneTasks } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

export async function getMilestones(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('milestones')
    .select('*, tasks:milestone_tasks(task:tasks(*))')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
  return (data || []) as any[]
}

export async function createMilestone(input: {
  project_id: string
  name: string
  description?: string | null
  status?: string
  due_date?: string | null
}) {
  const user = await getCurrentUser()
  const [ms] = await db.insert(milestones).values({
    projectId: input.project_id,
    name: input.name,
    description: input.description || null,
    status: input.status || 'pending' as const,
    dueDate: input.due_date || null,
    createdBy: user.id,
  } as any).returning()

  await createProjectActivity({
    project_id: input.project_id,
    action: 'milestone.created',
    description: `Created milestone "${input.name}"`,
  }).catch(() => {})

  return ms as any
}

export async function updateMilestone(id: string, input: Partial<{
  name: string
  description: string | null
  status: string
  due_date: string | null
  completed_at: string | null
}>) {
  const vals: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) vals.name = input.name
  if (input.description !== undefined) vals.description = input.description
  if (input.status !== undefined) vals.status = input.status
  if (input.due_date !== undefined) vals.dueDate = input.due_date
  if (input.status === 'completed' && !input.completed_at) vals.completedAt = new Date()
  else if (input.completed_at !== undefined) vals.completedAt = input.completed_at

  const [ms] = await db.update(milestones).set(vals as any)
    .where(and(eq(milestones.id, id), isNull(milestones.deletedAt))).returning()

  await createProjectActivity({
    project_id: (ms as any).project_id,
    action: 'milestone.updated',
    description: `Updated milestone "${(ms as any).name}"`,
    metadata: { changes: Object.keys(input) },
  }).catch(() => {})

  return ms as any
}

export async function deleteMilestone(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: ms } = await supabase.from('milestones').select('project_id, name').eq('id', id).single()
  await db.update(milestones).set({ deletedAt: new Date() }).where(eq(milestones.id, id))
  if (ms) {
    await createProjectActivity({
      project_id: (ms as any).project_id,
      action: 'milestone.deleted',
      description: `Deleted milestone "${(ms as any).name}"`,
    }).catch(() => {})
  }
  return { success: true }
}

export async function addTaskToMilestone(milestoneId: string, taskId: string) {
  try {
    await db.insert(milestoneTasks).values({ milestoneId, taskId })
  } catch (e: any) {
    if (!e.message?.includes('duplicate')) throw e
  }
  return { success: true }
}

export async function removeTaskFromMilestone(milestoneId: string, taskId: string) {
  await db.delete(milestoneTasks)
    .where(and(eq(milestoneTasks.milestoneId, milestoneId), eq(milestoneTasks.taskId, taskId)))
  return { success: true }
}
