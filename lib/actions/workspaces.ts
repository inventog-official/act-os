import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/crm/utils'
import type { Workspace } from '@/lib/types/database'

export async function getWorkspaces(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data as Workspace[]
}

export async function createWorkspace(input: {
  name: string
  slug: string
  description?: string | null
  organization_id: string
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      organization_id: input.organization_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Workspace
}

export async function updateWorkspace(id: string, input: { name?: string; slug?: string; description?: string | null }) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('workspaces')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Workspace
}

export async function deleteWorkspace(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('workspaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
