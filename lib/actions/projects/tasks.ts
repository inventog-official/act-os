'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { tasks } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'
import { createNotification } from '@/lib/actions/notifications'
import type { Task } from '@/lib/types/database'

export async function getTasks(organizationId: string, projectId?: string | null, workspaceId?: string | null) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('tasks')
    .select('*, assignee:auth.users!assignee_id(id, email, user_metadata), comments:task_comments(*), labels:task_label_assignments(label:task_labels(*)), checklist:task_checklist_items(*), attachments:task_attachments(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data } = await query
  return (data || []) as any[]
}

export async function getTaskById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('tasks')
    .select('*, assignee:auth.users!assignee_id(id, email, user_metadata), comments:task_comments(*, user:auth.users(id, email, user_metadata)), labels:task_label_assignments(label:task_labels(*)), checklist:task_checklist_items(*), attachments:task_attachments(*), dependencies:task_dependencies(*), watchers:task_watchers(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  return data as any
}

export async function createTask(input: {
  title: string
  description?: string | null
  organization_id: string
  workspace_id?: string | null
  project_id?: string | null
  assignee_id?: string | null
  status?: string
  priority?: string
  due_date?: string | null
  estimated_hours?: number | null
  is_recurring?: boolean
  recurring_config?: Record<string, unknown> | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const [task] = await db.insert(tasks).values({
    title: input.title,
    description: input.description || null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id || null,
    projectId: input.project_id || null,
    assigneeId: input.assignee_id || null,
    status: input.status || 'todo' as const,
    priority: input.priority || 'medium' as const,
    dueDate: input.due_date || null,
    estimatedHours: input.estimated_hours || null,
    isRecurring: input.is_recurring || false,
    recurringConfig: input.recurring_config || null,
    createdBy: user.id,
  } as any).returning()

  const data = task as any

  await createProjectActivity({
    project_id: input.project_id || data.project_id,
    action: 'task.created',
    description: `Created task "${input.title}"`,
  })

  if (input.assignee_id) {
    const { data: t } = await supabase.from('tasks').select('*, project:projects(organization_id, name)').eq('id', data.id).single()
    if (t) {
      await createNotification({
        organization_id: (t as any).project?.organization_id || input.organization_id,
        user_id: input.assignee_id,
        title: `Assigned to task: ${input.title}`,
        message: `You have been assigned to "${input.title}"`,
        type: 'info',
        link: `/projects/${data.project_id}/tasks/${data.id}`,
      }).catch(() => {})
    }
  }

  return data
}

export async function updateTask(id: string, input: Partial<{
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  assignee_id: string | null
  project_id: string | null
  is_recurring: boolean
  recurring_config: Record<string, unknown> | null
  completed_at: string | null
}>) {
  const supabase = await createServerSupabaseClient()
  const user = await getCurrentUser()

  const { data: oldTask } = await supabase.from('tasks').select('*, project:projects(organization_id, name)').eq('id', id).is('deleted_at', null).single()

  const updateVals: Record<string, unknown> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) updateVals.title = input.title
  if (input.description !== undefined) updateVals.description = input.description
  if (input.status !== undefined) updateVals.status = input.status
  if (input.priority !== undefined) updateVals.priority = input.priority
  if (input.due_date !== undefined) updateVals.dueDate = input.due_date
  if (input.estimated_hours !== undefined) updateVals.estimatedHours = input.estimated_hours
  if (input.actual_hours !== undefined) updateVals.actualHours = input.actual_hours
  if (input.assignee_id !== undefined) updateVals.assigneeId = input.assignee_id
  if (input.project_id !== undefined) updateVals.projectId = input.project_id
  if (input.is_recurring !== undefined) updateVals.isRecurring = input.is_recurring
  if (input.recurring_config !== undefined) updateVals.recurringConfig = input.recurring_config
  if (input.status === 'done' && !input.completed_at) {
    updateVals.completedAt = new Date()
  } else if (input.completed_at !== undefined) {
    updateVals.completedAt = input.completed_at
  }

  const [task] = await db.update(tasks)
    .set(updateVals as any)
    .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
    .returning()

  const data = task as any

  const changes = Object.keys(input).filter(k => (input as any)[k] !== undefined)
  await createProjectActivity({
    project_id: data.project_id || (oldTask as any)?.project_id,
    action: 'task.updated',
    description: input.title ? `Updated task "${input.title}"` : 'Updated task',
    metadata: { changes },
  })

  if (input.assignee_id && input.assignee_id !== (oldTask as any)?.assignee_id) {
    const orgId = (oldTask as any)?.project?.organization_id
    if (orgId) {
      await createNotification({
        organization_id: orgId,
        user_id: input.assignee_id,
        title: `Assigned to task: ${data.title}`,
        message: `You have been assigned to "${data.title}"`,
        type: 'info',
        link: `/projects/${data.project_id}/tasks/${id}`,
      }).catch(() => {})
    }
  }

  return data
}

export async function deleteTask(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: task } = await supabase.from('tasks').select('*, project:projects(organization_id)').eq('id', id).is('deleted_at', null).single()

  await db.update(tasks)
    .set({ deletedAt: new Date() })
    .where(eq(tasks.id, id))

  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'task.deleted',
      description: `Deleted task "${(task as any).title}"`,
    }).catch(() => {})
  }

  return { success: true }
}

export async function reorderTasks(taskList: { id: string; sort_order: number }[]) {
  for (const t of taskList) {
    await db.update(tasks)
      .set({ sortOrder: t.sort_order })
      .where(eq(tasks.id, t.id))
  }
  return { success: true }
}
