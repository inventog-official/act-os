'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getProjectFiles(projectId: string, folderId?: string | null) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('project_files')
    .select('*, creator:auth.users(id, email, user_metadata)')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (folderId) query = query.eq('folder_id', folderId)

  const { data } = await query
  return (data || []) as any[]
}

export async function createFolder(input: {
  project_id: string
  name: string
  parent_id?: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from('project_folders').insert({
    project_id: input.project_id,
    name: input.name,
    parent_id: input.parent_id || null,
    created_by: user.id,
  }).select().single()

  if (error) throw error
  return data as any
}

export async function getProjectFolders(projectId: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('project_folders')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })

  return (data || []) as any[]
}
