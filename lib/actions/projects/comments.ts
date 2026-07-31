'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { taskComments } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

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

  const { data: task } = await supabase.from('tasks').select('project_id, title').eq('id', input.task_id).single()

  const [comment] = await db.insert(taskComments).values({
    taskId: input.task_id,
    userId: user.id,
    content: input.content,
    mentions: input.mentions || [],
  } as any).returning()

  const inserted = await supabase.from('task_comments')
    .select('*, user:auth.users(id, email, user_metadata)')
    .eq('id', (comment as any).id).single()

  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'comment.created',
      description: `Added comment on task "${(task as any).title}"`,
    }).catch(() => {})
  }

  return inserted.data as any
}

export async function updateComment(id: string, content: string) {
  await db.update(taskComments).set({ content, updatedAt: new Date() }).where(eq(taskComments.id, id))
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('task_comments').select('*').eq('id', id).single()
  return data as any
}

export async function deleteComment(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: comment } = await supabase.from('task_comments').select('task_id').eq('id', id).single()
  const { data: task } = comment
    ? await supabase.from('tasks').select('project_id, title').eq('id', (comment as any).task_id).single()
    : { data: null }

  await db.update(taskComments).set({ deletedAt: new Date() }).where(eq(taskComments.id, id))

  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'comment.deleted',
      description: `Deleted comment on task "${(task as any).title}"`,
    }).catch(() => {})
  }
  return { success: true }
}
