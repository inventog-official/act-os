import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmLead } from '@/lib/types/database'

export async function getLeads(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_leads')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as CrmLead[]
}

export async function getLeadById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as CrmLead
}

export async function createLead(input: {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  company_id?: string | null
  company_name?: string | null
  website?: string | null
  industry?: string | null
  lead_source?: string | null
  priority?: string | null
  status?: string
  pipeline_stage_id?: string | null
  estimated_deal_value?: number | null
  expected_close_date?: string | null
  description?: string | null
  notes?: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to?: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      ...input,
      created_by: user.id,
      updated_by: user.id,
      status: input.status || 'new',
    })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: 'lead_created',
    description: `Lead ${input.first_name} ${input.last_name} created`,
    entity_type: 'lead',
    entity_id: data.id,
    lead_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmLead
}

export async function updateLead(id: string, input: Partial<CrmLead>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_leads')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as CrmLead
}

export async function deleteLead(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('crm_leads')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)

  if (error) throw error
}

export async function bulkDeleteLeads(ids: string[]) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('crm_leads')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .in('id', ids)

  if (error) throw error
}

export async function bulkUpdateLeads(ids: string[], updates: Partial<CrmLead>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('crm_leads')
    .update({ ...updates, updated_by: user.id })
    .in('id', ids)

  if (error) throw error
}
