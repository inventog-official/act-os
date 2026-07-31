'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { taskChecklistItems } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

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

  const [item] = await db.insert(taskChecklistItems).values({
    taskId: input.task_id,
    text: input.text,
    sortOrder: input.sort_order || 0,
    createdBy: user.id,
  } as any).returning()

  const { data: task } = await supabase.from('tasks').select('project_id, title').eq('id', input.task_id).single()
  if (task) {
    await createProjectActivity({
      project_id: (task as any).project_id,
      action: 'checklist.added',
      description: `Added checklist item to task "${(task as any).title}"`,
    }).catch(() => {})
  }

  return item as any
}

export async function toggleChecklistItem(id: string, completed: boolean) {
  const user = await getCurrentUser()
  const [item] = await db.update(taskChecklistItems).set({
    completed,
    completedAt: completed ? new Date() : null,
    completedBy: completed ? user.id : null,
    updatedAt: new Date(),
  } as any).where(eq(taskChecklistItems.id, id)).returning()
  return item as any
}

export async function deleteChecklistItem(id: string) {
  await db.delete(taskChecklistItems).where(eq(taskChecklistItems.id, id))
  return { success: true }
}
