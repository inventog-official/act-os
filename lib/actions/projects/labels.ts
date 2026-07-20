'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getProjectLabels(projectId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('task_labels')
    .select('*')
    .eq('project_id', projectId)
    .is('deleted_at', null)

  return (data || []) as any[]
}

export async function createLabel(input: {
  name: string
  color?: string
  project_id?: string | null
  organization_id: string
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('task_labels').insert({
    name: input.name,
    color: input.color || '#6b7280',
    project_id: input.project_id || null,
    organization_id: input.organization_id,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function toggleTaskLabel(taskId: string, labelId: string) {
  const supabase = await createServerSupabaseClient()

  const existing = await supabase
    .from('task_label_assignments')
    .select('id')
    .eq('task_id', taskId)
    .eq('label_id', labelId)
    .single()

  if (existing.data) {
    await supabase.from('task_label_assignments').delete().eq('id', existing.data.id)
    return { attached: false }
  }

  await supabase.from('task_label_assignments').insert({ task_id: taskId, label_id: labelId })
  return { attached: true }
}

export async function deleteLabel(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('task_labels').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
  return { success: true }
}
