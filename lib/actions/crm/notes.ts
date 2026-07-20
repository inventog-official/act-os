import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import type { CrmNote } from '@/lib/types/database'

export async function getNotes(organizationId: string, workspaceId: string | null) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('crm_notes')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data as CrmNote[]
}

export async function getNotesForEntity(
  entityType: 'lead_id' | 'company_id' | 'contact_id' | 'deal_id',
  entityId: string,
) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_notes')
    .select('*')
    .eq(entityType, entityId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CrmNote[]
}

export async function createNote(input: {
  title?: string | null
  content?: string | null
  is_pinned?: boolean
  is_private?: boolean
  lead_id?: string | null
  company_id?: string | null
  contact_id?: string | null
  deal_id?: string | null
  organization_id: string
  workspace_id: string | null
}) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('crm_notes')
    .insert({
      ...input,
      is_pinned: input.is_pinned || false,
      is_private: input.is_private || false,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  await createTimelineEntry({
    action: 'note_created',
    description: input.title || 'Note added',
    entity_type: 'note',
    entity_id: data.id,
    lead_id: input.lead_id,
    company_id: input.company_id,
    contact_id: input.contact_id,
    deal_id: input.deal_id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as CrmNote
}

export async function updateNote(id: string, input: Partial<CrmNote>) {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_notes')
    .update({ ...input, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CrmNote
}

export async function deleteNote(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('crm_notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
