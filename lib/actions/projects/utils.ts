'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { projectActivities } from '@/db/schema'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createProjectActivity(params: {
  project_id: string
  action: string
  description?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()

  try {
    await db.insert(projectActivities).values({
      projectId: params.project_id,
      userId: user.id,
      action: params.action,
      description: params.description || null,
      metadata: params.metadata || {},
    })
  } catch (e) {
    console.error('Project activity insert error:', e)
  }
}
