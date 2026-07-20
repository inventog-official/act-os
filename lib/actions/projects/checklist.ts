'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getTaskChecklist(taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('task_checklist_items')
    .select('*')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true })

  return (data || []) as any[]
}

export async function addChecklistItem(input: {
  task_id: string
  text: string
  sort_order?: number
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('task_checklist_items').insert({
    task_id: input.task_id,
    text: input.text,
    sort_order: input.sort_order || 0,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function toggleChecklistItem(id: string, completed: boolean) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('task_checklist_items').update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    completed_by: completed ? user.id : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) throw error
  return data as any
}

export async function deleteChecklistItem(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}
