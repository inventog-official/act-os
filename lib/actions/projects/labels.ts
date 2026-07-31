'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { taskLabels, taskLabelAssignments } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

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
  const [label] = await db.insert(taskLabels).values({
    name: input.name,
    color: input.color || '#6b7280',
    projectId: input.project_id || null,
    organizationId: input.organization_id,
    createdBy: user.id,
  } as any).returning()

  if (input.project_id) {
    await createProjectActivity({
      project_id: input.project_id,
      action: 'label.created',
      description: `Created label "${input.name}"`,
    }).catch(() => {})
  }

  return label as any
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
    await db.delete(taskLabelAssignments).where(eq(taskLabelAssignments.id, existing.data.id))
    return { attached: false }
  }

  await db.insert(taskLabelAssignments).values({ taskId, labelId })
  return { attached: true }
}

export async function deleteLabel(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: label } = await supabase.from('task_labels').select('project_id, name').eq('id', id).single()
  await db.update(taskLabels).set({ deletedAt: new Date() }).where(eq(taskLabels.id, id))
  if (label && (label as any).project_id) {
    await createProjectActivity({
      project_id: (label as any).project_id,
      action: 'label.deleted',
      description: `Deleted label "${(label as any).name}"`,
    }).catch(() => {})
  }
  return { success: true }
}
