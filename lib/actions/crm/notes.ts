import { db } from '@/db'
import { crmNotes } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmNote } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getNoteOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_notes')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

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
  await requirePermission(input.organization_id, 'crm:notes:create')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmNotes).values({
    title: input.title ?? null,
    content: input.content ?? null,
    isPinned: input.is_pinned ?? false,
    isPrivate: input.is_private ?? false,
    leadId: input.lead_id ?? null,
    companyId: input.company_id ?? null,
    contactId: input.contact_id ?? null,
    dealId: input.deal_id ?? null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    createdBy: user.id,
    updatedBy: user.id,
  }).returning()

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

  return data as unknown as CrmNote
}

export async function updateNote(id: string, input: Partial<CrmNote>) {
  const orgId = await getNoteOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:notes:update')
  const user = await getCurrentUser()

  const vals: Record<string, unknown> = { updatedBy: user.id }
  if (input.title !== undefined) vals.title = input.title
  if (input.content !== undefined) vals.content = input.content
  if (input.is_pinned !== undefined) vals.isPinned = input.is_pinned
  if (input.is_private !== undefined) vals.isPrivate = input.is_private
  if (input.lead_id !== undefined) vals.leadId = input.lead_id
  if (input.company_id !== undefined) vals.companyId = input.company_id
  if (input.contact_id !== undefined) vals.contactId = input.contact_id
  if (input.deal_id !== undefined) vals.dealId = input.deal_id
  if (input.organization_id !== undefined) vals.organizationId = input.organization_id
  if (input.workspace_id !== undefined) vals.workspaceId = input.workspace_id

  const [data] = await db.update(crmNotes).set(vals).where(eq(crmNotes.id, id)).returning()

  return data as unknown as CrmNote
}

export async function deleteNote(id: string) {
  const orgId = await getNoteOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:notes:delete')
  const user = await getCurrentUser()
  await db.update(crmNotes).set({ deletedAt: new Date(), updatedBy: user.id }).where(eq(crmNotes.id, id))
}
