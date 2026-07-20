'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getTaskComments(taskId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('task_comments')
    .select('*, user:auth.users(id, email, user_metadata)')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return (data || []) as any[]
}

export async function createComment(input: {
  task_id: string
  content: string
  mentions?: string[]
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('task_comments').insert({
    task_id: input.task_id,
    user_id: user.id,
    content: input.content,
    mentions: input.mentions || [],
  }).select('*, user:auth.users(id, email, user_metadata)').single()

  if (error) throw error
  return data as any
}

export async function updateComment(id: string, content: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('task_comments').update({
    content,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) throw error
  return data as any
}

export async function deleteComment(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('task_comments').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error
  return { success: true }
}
