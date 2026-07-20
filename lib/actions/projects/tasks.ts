'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'
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

  const { data, error } = await supabase.from('tasks').insert({
    title: input.title,
    description: input.description || null,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id || null,
    project_id: input.project_id || null,
    assignee_id: input.assignee_id || null,
    status: input.status || 'todo',
    priority: input.priority || 'medium',
    due_date: input.due_date || null,
    estimated_hours: input.estimated_hours || null,
    is_recurring: input.is_recurring || false,
    recurring_config: input.recurring_config || null,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
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

  const updateData: any = { ...input, updated_at: new Date().toISOString() }

  if (input.status === 'done' && !input.completed_at) {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from('tasks').update(updateData).eq('id', id).is('deleted_at', null).select().single()

  if (error) throw error
  return data as any
}

export async function deleteTask(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('tasks').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
  return { success: true }
}

export async function reorderTasks(tasks: { id: string; sort_order: number }[]) {
  const supabase = await createServerSupabaseClient()

  for (const task of tasks) {
    await supabase.from('tasks').update({ sort_order: task.sort_order }).eq('id', task.id)
  }

  return { success: true }
}
