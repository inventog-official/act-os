import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getOrganizationBySlug(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as { id: string; name: string; slug: string; owner_id: string } | null
}

export async function getCurrentWorkspace(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: defaultWorkspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(1)
    .single()
  return defaultWorkspace as { id: string; name: string } | null
}
