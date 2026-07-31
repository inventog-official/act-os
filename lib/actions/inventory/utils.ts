'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { inventoryActivities } from '@/db/schema/inventory'
import { requirePermission, type Permission } from '@/lib/auth/permissions'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function getOrganizationId() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (error || !member) throw new Error('Not a member of any organization')
  return member.organization_id as string
}

export async function guardInventoryPermission(organizationId: string, permission: Permission) {
  await requirePermission(organizationId, permission)
}

export async function logInventoryActivity(input: {
  organizationId: string
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  await db.insert(inventoryActivities).values({
    organizationId: input.organizationId,
    userId: user.id,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: JSON.stringify(input.metadata ?? {}),
  } as any).returning()
}
