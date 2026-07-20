'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

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
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('milestones').insert({
    project_id: input.project_id,
    name: input.name,
    description: input.description || null,
    status: input.status || 'pending',
    due_date: input.due_date || null,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function updateMilestone(id: string, input: Partial<{
  name: string
  description: string | null
  status: string
  due_date: string | null
  completed_at: string | null
}>) {
  const supabase = await createServerSupabaseClient()

  const updateData: any = { ...input, updated_at: new Date().toISOString() }

  if (input.status === 'completed' && !input.completed_at) {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from('milestones').update(updateData).eq('id', id).is('deleted_at', null).select().single()

  if (error) throw error
  return data as any
}

export async function deleteMilestone(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('milestones').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
  return { success: true }
}

export async function addTaskToMilestone(milestoneId: string, taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('milestone_tasks').insert({
    milestone_id: milestoneId,
    task_id: taskId,
  })

  if (error && !error.message.includes('duplicate')) throw error
  return { success: true }
}

export async function removeTaskFromMilestone(milestoneId: string, taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('milestone_tasks').delete()
    .eq('milestone_id', milestoneId)
    .eq('task_id', taskId)

  if (error) throw error
  return { success: true }
}
