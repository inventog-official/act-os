import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmContact } from '@/lib/types/database'

export async function getContacts(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_contacts')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmContact[]
}

export async function getContactById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as CrmContact
}

export async function createContact(input: {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  department?: string | null
  company_id?: string | null
  organization_id: string
  workspace_id: string | null
  assigned_to?: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({ ...input, created_by: user.id, updated_by: user.id })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: 'contact_created',
    description: `Contact ${input.first_name} ${input.last_name} created`,
    entity_type: 'contact',
    entity_id: data.id,
    contact_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmContact
}

export async function updateContact(id: string, input: Partial<CrmContact>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_contacts')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CrmContact
}

export async function deleteContact(id: string) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('crm_contacts')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', id)
  if (error) throw error
}
