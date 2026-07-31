import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { crmTags, crmEntityTags } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from './utils'
import { requirePermission } from '@/lib/auth/permissions'
import type { CrmTag } from '@/lib/types/database'

export async function getTags(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_tags')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data as CrmTag[]
}

export async function createTag(input: {
  name: string
  color?: string
  organization_id: string
  workspace_id: string | null
}) {
  await requirePermission(input.organization_id, 'crm:settings:manage')
  const user = await getCurrentUser()
  const [tag] = await db.insert(crmTags).values({
    name: input.name,
    color: input.color || '#6b7280',
    organizationId: input.organization_id,
    workspaceId: input.workspace_id,
    createdBy: user.id,
  } as any).returning()
  return tag as any as CrmTag
}

export async function updateTag(id: string, input: { name?: string; color?: string }) {
  const vals: Record<string, unknown> = {}
  if (input.name !== undefined) vals.name = input.name
  if (input.color !== undefined) vals.color = input.color
  const [tag] = await db.update(crmTags).set(vals as any).where(eq(crmTags.id, id)).returning()
  return tag as any as CrmTag
}

export async function deleteTag(id: string) {
  await db.update(crmTags).set({ deletedAt: new Date() }).where(eq(crmTags.id, id))
}

export async function getEntityTags(entityType: string, entityId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('crm_entity_tags')
    .select('tag_id, crm_tags!inner(id, name, color)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
  if (error) throw error
  return (data || []).map((item: any) => item.crm_tags) as CrmTag[]
}

export async function assignTag(params: {
  tag_id: string
  entity_type: 'lead' | 'company' | 'contact' | 'deal'
  entity_id: string
}) {
  await db.insert(crmEntityTags).values({
    tagId: params.tag_id,
    entityType: params.entity_type,
    entityId: params.entity_id,
  })
}

export async function unassignTag(params: {
  tag_id: string
  entity_type: string
  entity_id: string
}) {
  await db.delete(crmEntityTags).where(
    and(eq(crmEntityTags.tagId, params.tag_id), eq(crmEntityTags.entityType, params.entity_type), eq(crmEntityTags.entityId, params.entity_id))
  )
}
