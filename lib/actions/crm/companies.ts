import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmCompany } from '@/lib/types/database'

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
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_companies')
    .insert({ ...input, created_by: user.id, updated_by: user.id })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: 'company_created',
    description: `Company ${input.name} created`,
    entity_type: 'company',
    entity_id: data.id,
    company_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmCompany
}

export async function updateCompany(id: string, input: Partial<CrmCompany>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_companies')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CrmCompany
}

export async function deleteCompany(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('crm_companies')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)
  if (error) throw error
}
