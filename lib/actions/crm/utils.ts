import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CrmLead, CrmCompany, CrmContact, CrmDeal, CrmActivity, CrmTask, CrmNote, CrmTimeline } from '@/lib/types/database'

type EntityType = 'lead' | 'company' | 'contact' | 'deal' | 'activity' | 'note' | 'task'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createTimelineEntry(params: {
  action: string
  description: string | null
  entity_type: EntityType
  entity_id: string
  lead_id?: string | null
  company_id?: string | null
  contact_id?: string | null
  deal_id?: string | null
  metadata?: Record<string, unknown>
  organization_id: string
  workspace_id: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('crm_timeline').insert({
    action: params.action,
    description: params.description,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    lead_id: params.lead_id || null,
    company_id: params.company_id || null,
    contact_id: params.contact_id || null,
    deal_id: params.deal_id || null,
    metadata: params.metadata || {},
    organization_id: params.organization_id,
    workspace_id: params.workspace_id,
    created_by: user.id,
  })

  if (error) console.error('Timeline insert error:', error)
}

export async function getOrganizationMembers(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('organization_members')
    .select('user_id, user:auth.users(id, email)')
    .eq('organization_id', organizationId)
  return data || []
}
