import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmDeal } from '@/lib/types/database'

export async function getDeals(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_deals')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmDeal[]
}

export async function getDealsByStage(organizationId: string, workspaceId: string | null, pipelineId: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_deals')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('pipeline_id', pipelineId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmDeal[]
}

export async function createDeal(input: {
  name: string
  deal_value: number
  probability?: number
  pipeline_id: string
  pipeline_stage_id: string
  lead_id?: string | null
  company_id?: string | null
  contact_id?: string | null
  expected_close_date?: string | null
  notes?: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to?: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      ...input,
      probability: input.probability ?? 0,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: 'deal_created',
    description: `Deal ${input.name} created`,
    entity_type: 'deal',
    entity_id: data.id,
    deal_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmDeal
}

export async function updateDealStage(id: string, pipelineStageId: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data: oldDeal } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('crm_deals')
    .update({ pipeline_stage_id: pipelineStageId, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const stage = await getStageById(pipelineStageId)
  const oldStage = oldDeal ? await getStageById(oldDeal.pipeline_stage_id).catch(() => null) : null

  await createTimelineEntry({
    action: 'deal_stage_changed',
    description: `Deal moved from ${oldStage?.name || 'unknown'} to ${stage?.name || 'unknown'}`,
    entity_type: 'deal',
    entity_id: id,
    deal_id: id,
    organization_id: data.organization_id,
    workspace_id: data.workspace_id,
    metadata: { from_stage: oldStage?.name, to_stage: stage?.name },
  })

  if (stage?.name === 'Won' || stage?.name === 'won') {
    await createTimelineEntry({
      action: 'deal_won',
      description: `Deal ${data.name} won!`,
      entity_type: 'deal',
      entity_id: id,
      deal_id: id,
      organization_id: data.organization_id,
      workspace_id: data.workspace_id,
    })
  }

  return data as CrmDeal
}

async function getStageById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_pipeline_stages')
    .select('name')
    .eq('id', id)
    .single()
  return data
}

export async function updateDeal(id: string, input: Partial<CrmDeal>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_deals')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CrmDeal
}

export async function deleteDeal(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('crm_deals')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)
  if (error) throw error
}
