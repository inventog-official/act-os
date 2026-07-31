import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, createTimelineEntry } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import { db } from '@/db'
import { crmContacts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CrmContact } from '@/lib/types/database'
import type { Permission } from '@/lib/auth/permissions'

async function getContactOrgId(id: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('crm_contacts')
    .select('organization_id')
    .eq('id', id)
    .single()
  return data?.organization_id || ''
}

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
  await requirePermission(input.organization_id, 'crm:contacts:create')
  const user = await getCurrentUser()

  const [data] = await db.insert(crmContacts).values({
    firstName: input.first_name,
    lastName: input.last_name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    jobTitle: input.job_title ?? null,
    department: input.department ?? null,
    companyId: input.company_id ?? null,
    organizationId: input.organization_id,
    workspaceId: input.workspace_id ?? null,
    assignedTo: input.assigned_to ?? null,
    createdBy: user.id,
    updatedBy: user.id,
  }).returning()

  await createTimelineEntry({
    action: 'contact_created',
    description: `Contact ${input.first_name} ${input.last_name} created`,
    entity_type: 'contact',
    entity_id: data.id,
    contact_id: data.id,
    organization_id: input.organization_id,
    workspace_id: input.workspace_id,
  })

  return data as unknown as CrmContact
}

export async function updateContact(id: string, input: Partial<CrmContact>) {
  const orgId = await getContactOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:contacts:update')
  const user = await getCurrentUser()

  const vals: Record<string, unknown> = { updatedBy: user.id }
  if (input.first_name !== undefined) vals.firstName = input.first_name
  if (input.last_name !== undefined) vals.lastName = input.last_name
  if (input.email !== undefined) vals.email = input.email
  if (input.phone !== undefined) vals.phone = input.phone
  if (input.job_title !== undefined) vals.jobTitle = input.job_title
  if (input.department !== undefined) vals.department = input.department
  if (input.company_id !== undefined) vals.companyId = input.company_id
  if (input.organization_id !== undefined) vals.organizationId = input.organization_id
  if (input.workspace_id !== undefined) vals.workspaceId = input.workspace_id
  if (input.assigned_to !== undefined) vals.assignedTo = input.assigned_to

  const [data] = await db.update(crmContacts).set(vals).where(eq(crmContacts.id, id)).returning()

  return data as unknown as CrmContact
}

export async function deleteContact(id: string) {
  const orgId = await getContactOrgId(id)
  if (orgId) await requirePermission(orgId, 'crm:contacts:delete')
  const user = await getCurrentUser()

  await db.update(crmContacts).set({ deletedAt: new Date(), updatedBy: user.id }).where(eq(crmContacts.id, id))
}
