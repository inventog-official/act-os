'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { projectFolders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser, createProjectActivity } from './utils'

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
  const [folder] = await db.insert(projectFolders).values({
    projectId: input.project_id,
    name: input.name,
    parentId: input.parent_id || null,
    createdBy: user.id,
  } as any).returning()

  await createProjectActivity({
    project_id: input.project_id,
    action: 'folder.created',
    description: `Created folder "${input.name}"`,
  }).catch(() => {})

  return folder as any
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
