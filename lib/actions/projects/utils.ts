'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

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
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('project_activities').insert({
    project_id: params.project_id,
    user_id: user.id,
    action: params.action,
    description: params.description || null,
    metadata: params.metadata || {},
  })

  if (error) console.error('Project activity insert error:', error)
}
