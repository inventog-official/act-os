import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import { db } from '@/db'
import { crmDeals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CrmDeal } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getDealOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_deals')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

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
  await requirePermission(input.organization_id, 'crm:deals:create')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmDeals).values({
    name: input.name,
    dealValue: input.deal_value.toString(),
    probability: input.probability ?? 0,
    pipelineId: input.pipeline_id,
    pipelineStageId: input.pipeline_stage_id,
    leadId: input.lead_id ?? null,
    companyId: input.company_id ?? null,
    contactId: input.contact_id ?? null,
    expectedCloseDate: input.expected_close_date ? new Date(input.expected_close_date) : null,
    notes: input.notes ?? null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    assignedTo: input.assigned_to ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  }).returning()

  await createTimelineEntry({
    action: 'deal_created',
    description: `Deal ${input.name} created`,
    entity_type: 'deal',
    entity_id: data.id,
    deal_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as unknown as CrmDeal
}

export async function updateDealStage(id: string, pipelineStageId: string) {
  const orgId = await getDealOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:deals:update')
  const user = await getCurrentUser()

  const supabase = await createServerSupabaseClient()
  const { data: oldDeal } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('id', id)
    .single()

  const [data] = await db.update(crmDeals)
    .set({ pipelineStageId, updatedBy: user.id })
    .where(eq(crmDeals.id, id))
    .returning()

  const stage = await getStageById(pipelineStageId)
  const oldStage = oldDeal ? await getStageById(oldDeal.pipeline_stage_id).catch(() => null) : null

  await createTimelineEntry({
    action: 'deal_stage_changed',
    description: `Deal moved from ${oldStage?.name || 'unknown'} to ${stage?.name || 'unknown'}`,
    entity_type: 'deal',
    entity_id: id,
    deal_id: id,
    organization_id: data.organizationId,
    workspace_id: data.workspaceId,
    metadata: { from_stage: oldStage?.name, to_stage: stage?.name },
  })

  if (stage?.name === 'Won' || stage?.name === 'won') {
    await createTimelineEntry({
      action: 'deal_won',
      description: `Deal ${data.name} won!`,
      entity_type: 'deal',
      entity_id: id,
      deal_id: id,
      organization_id: data.organizationId,
      workspace_id: data.workspaceId,
    })
  }

  return data as unknown as CrmDeal
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
  const orgId = await getDealOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:deals:update')
  const user = await getCurrentUser()

  const vals: Record<string, unknown> = { updatedBy: user.id }
  if (input.name !== undefined) vals.name = input.name
  if (input.deal_value !== undefined) vals.dealValue = input.deal_value
  if (input.probability !== undefined) vals.probability = input.probability
  if (input.pipeline_id !== undefined) vals.pipelineId = input.pipeline_id
  if (input.pipeline_stage_id !== undefined) vals.pipelineStageId = input.pipeline_stage_id
  if (input.lead_id !== undefined) vals.leadId = input.lead_id
  if (input.company_id !== undefined) vals.companyId = input.company_id
  if (input.contact_id !== undefined) vals.contactId = input.contact_id
  if (input.expected_close_date !== undefined) vals.expectedCloseDate = input.expected_close_date ? new Date(input.expected_close_date) : null
  if (input.actual_close_date !== undefined) vals.actualCloseDate = input.actual_close_date ? new Date(input.actual_close_date) : null
  if (input.notes !== undefined) vals.notes = input.notes
  if (input.organization_id !== undefined) vals.organizationId = input.organization_id
  if (input.workspace_id !== undefined) vals.workspaceId = input.workspace_id
  if (input.assigned_to !== undefined) vals.assignedTo = input.assigned_to

  const [data] = await db.update(crmDeals)
    .set(vals)
    .where(eq(crmDeals.id, id))
    .returning()

  return data as unknown as CrmDeal
}

export async function deleteDeal(id: string) {
  const orgId = await getDealOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:deals:delete')
  const user = await getCurrentUser()
  await db.update(crmDeals)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(crmDeals.id, id))
}
