import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CrmTimeline } from '@/lib/types/database'

export async function getTimeline(organizationId: string, workspaceId: string | null, limit = 50) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_timeline')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmTimeline[]
}

export async function getTimelineForEntity(entityType: string, entityId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_timeline')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as CrmTimeline[]
}
