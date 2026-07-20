'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

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
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('sprints').insert({
    project_id: input.project_id,
    name: input.name,
    goal: input.goal || null,
    status: input.status || 'planning',
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function updateSprint(id: string, input: Partial<{
  name: string
  goal: string | null
  status: string
  start_date: string | null
  end_date: string | null
}>) {
  const supabase = await createServerSupabaseClient()

  const updateData: any = { ...input, updated_at: new Date().toISOString() }

  if (input.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from('sprints').update(updateData).eq('id', id).is('deleted_at', null).select().single()

  if (error) throw error
  return data as any
}

export async function deleteSprint(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('sprints').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
  return { success: true }
}

export async function addTaskToSprint(sprintId: string, taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('sprint_tasks').insert({
    sprint_id: sprintId,
    task_id: taskId,
  })

  if (error && !error.message.includes('duplicate')) throw error
  return { success: true }
}

export async function removeTaskFromSprint(sprintId: string, taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('sprint_tasks').delete()
    .eq('sprint_id', sprintId)
    .eq('task_id', taskId)

  if (error) throw error
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

  const sprints = (data || []).map(s => ({
    ...s,
    completed_points: (s.tasks as any[] || []).filter((st: any) => st.task?.status === 'done').length,
    total_points: (s.tasks as any[] || []).length,
  }))

  return sprints as any[]
}
