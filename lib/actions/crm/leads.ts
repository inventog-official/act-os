import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmLead } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'
import { db } from '@/db'
import { eq, inArray } from 'drizzle-orm'
import { crmLeads } from '@/db/schema'

async function getLeadOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_leads')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

export async function getLeads(organizationId: string, workspaceId: string | null) {
  await requirePermission(organizationId, 'crm:leads:read')
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
  await requirePermission(input.organization_id, 'crm:leads:create')
  const user = await getCurrentUser()

  const [data] = await db
    .insert(crmLeads)
    .values({
      firstName: input.first_name,
      lastName: input.last_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      jobTitle: input.job_title ?? null,
      companyId: input.company_id ?? null,
      companyName: input.company_name ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      leadSource: input.lead_source ?? null,
      priority: input.priority ?? null,
      status: input.status ?? 'new',
      pipelineStageId: input.pipeline_stage_id ?? null,
      estimatedDealValue: input.estimated_deal_value != null ? String(input.estimated_deal_value) : null,
      expectedCloseDate: input.expected_close_date != null ? new Date(input.expected_close_date) : null,
      description: input.description ?? null,
      notes: input.notes ?? null,
      organizationId: input.organization_id,
      workspaceId: input.workspace_id,
      assignedTo: input.assigned_to ?? null,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning()

  await createTimelineEntry({
    action: 'lead_created',
    description: `Lead ${input.first_name} ${input.last_name} created`,
    entity_type: 'lead',
    entity_id: data.id,
    lead_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as unknown as CrmLead
}

export async function updateLead(id: string, input: Partial<CrmLead>) {
  const orgId = await getLeadOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:leads:update')

  const user = await getCurrentUser()

  const updateData: Partial<typeof crmLeads.$inferInsert> = {
    updatedBy: user.id,
  }

  if (input.first_name !== undefined) updateData.firstName = input.first_name
  if (input.last_name !== undefined) updateData.lastName = input.last_name
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.job_title !== undefined) updateData.jobTitle = input.job_title
  if (input.company_id !== undefined) updateData.companyId = input.company_id
  if (input.company_name !== undefined) updateData.companyName = input.company_name
  if (input.website !== undefined) updateData.website = input.website
  if (input.industry !== undefined) updateData.industry = input.industry
  if (input.lead_source !== undefined) updateData.leadSource = input.lead_source
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.status !== undefined) updateData.status = input.status
  if (input.pipeline_stage_id !== undefined) updateData.pipelineStageId = input.pipeline_stage_id
  if (input.estimated_deal_value !== undefined) updateData.estimatedDealValue = input.estimated_deal_value != null ? String(input.estimated_deal_value) : null
  if (input.expected_close_date !== undefined) updateData.expectedCloseDate = input.expected_close_date != null ? new Date(input.expected_close_date) : null
  if (input.description !== undefined) updateData.description = input.description
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.assigned_to !== undefined) updateData.assignedTo = input.assigned_to

  const [data] = await db
    .update(crmLeads)
    .set(updateData)
    .where(eq(crmLeads.id, id))
    .returning()

  return data as unknown as CrmLead
}

export async function deleteLead(id: string) {
  const orgId = await getLeadOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:leads:delete')

  const user = await getCurrentUser()

  await db
    .update(crmLeads)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(crmLeads.id, id))
}

export async function bulkDeleteLeads(ids: string[]) {
  const user = await getCurrentUser()

  await db
    .update(crmLeads)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(inArray(crmLeads.id, ids))
}

export async function bulkUpdateLeads(ids: string[], updates: Partial<CrmLead>) {
  const user = await getCurrentUser()

  const updateData: Partial<typeof crmLeads.$inferInsert> = {
    updatedBy: user.id,
  }

  if (updates.first_name !== undefined) updateData.firstName = updates.first_name
  if (updates.last_name !== undefined) updateData.lastName = updates.last_name
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.phone !== undefined) updateData.phone = updates.phone
  if (updates.job_title !== undefined) updateData.jobTitle = updates.job_title
  if (updates.company_id !== undefined) updateData.companyId = updates.company_id
  if (updates.company_name !== undefined) updateData.companyName = updates.company_name
  if (updates.website !== undefined) updateData.website = updates.website
  if (updates.industry !== undefined) updateData.industry = updates.industry
  if (updates.lead_source !== undefined) updateData.leadSource = updates.lead_source
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.pipeline_stage_id !== undefined) updateData.pipelineStageId = updates.pipeline_stage_id
  if (updates.estimated_deal_value !== undefined) updateData.estimatedDealValue = updates.estimated_deal_value != null ? String(updates.estimated_deal_value) : null
  if (updates.expected_close_date !== undefined) updateData.expectedCloseDate = updates.expected_close_date != null ? new Date(updates.expected_close_date) : null
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.notes !== undefined) updateData.notes = updates.notes
  if (updates.assigned_to !== undefined) updateData.assignedTo = updates.assigned_to

  await db
    .update(crmLeads)
    .set(updateData)
    .where(inArray(crmLeads.id, ids))
}
