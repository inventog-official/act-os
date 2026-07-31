import { db } from '@/db'
import { crmCompanies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmCompany } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getCompanyOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_companies')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

export async function getCompanies(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_companies')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as CrmCompany[]
}

export async function getCompanyById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as CrmCompany
}

export async function createCompany(input: {
  name: string
  industry?: string | null
  employee_count?: number | null
  revenue?: number | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  gst_number?: string | null
  logo_url?: string | null
  description?: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to?: string | null
}) {
  await requirePermission(input.organization_id, 'crm:companies:create')
  const user = await getCurrentUser()

  const [data] = await db
    .insert(crmCompanies)
    .values({
      name: input.name,
      industry: input.industry ?? null,
      employeeCount: input.employee_count ?? null,
      revenue: input.revenue != null ? String(input.revenue) : null,
      addressLine1: input.address_line1 ?? null,
      addressLine2: input.address_line2 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      country: input.country ?? null,
      website: input.website ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      gstNumber: input.gst_number ?? null,
      logoUrl: input.logo_url ?? null,
      description: input.description ?? null,
      organizationId: input.organization_id,
      workspaceId: input.workspace_id,
      assignedTo: input.assigned_to ?? null,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning()

  await createTimelineEntry({
    action: 'company_created',
    description: `Company ${input.name} created`,
    entity_type: 'company',
    entity_id: data.id,
    company_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as unknown as CrmCompany
}

export async function updateCompany(id: string, input: Partial<CrmCompany>) {
  const orgId = await getCompanyOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:companies:update')
  const user = await getCurrentUser()

  const vals: Record<string, unknown> = { updatedBy: user.id }
  if (input.name !== undefined) vals.name = input.name
  if (input.industry !== undefined) vals.industry = input.industry
  if (input.employee_count !== undefined) vals.employeeCount = input.employee_count
  if (input.revenue !== undefined) vals.revenue = input.revenue
  if (input.address_line1 !== undefined) vals.addressLine1 = input.address_line1
  if (input.address_line2 !== undefined) vals.addressLine2 = input.address_line2
  if (input.city !== undefined) vals.city = input.city
  if (input.state !== undefined) vals.state = input.state
  if (input.zip !== undefined) vals.zip = input.zip
  if (input.country !== undefined) vals.country = input.country
  if (input.website !== undefined) vals.website = input.website
  if (input.phone !== undefined) vals.phone = input.phone
  if (input.email !== undefined) vals.email = input.email
  if (input.gst_number !== undefined) vals.gstNumber = input.gst_number
  if (input.logo_url !== undefined) vals.logoUrl = input.logo_url
  if (input.description !== undefined) vals.description = input.description
  if (input.workspace_id !== undefined) vals.workspaceId = input.workspace_id
  if (input.assigned_to !== undefined) vals.assignedTo = input.assigned_to

  const [data] = await db
    .update(crmCompanies)
    .set(vals)
    .where(eq(crmCompanies.id, id))
    .returning()

  return data as unknown as CrmCompany
}

export async function deleteCompany(id: string) {
  const orgId = await getCompanyOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:companies:delete')
  const user = await getCurrentUser()
  await db
    .update(crmCompanies)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(crmCompanies.id, id))
}
