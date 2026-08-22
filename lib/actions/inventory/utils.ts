'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { inventoryActivities } from '@/db/schema/inventory'
import { requirePermission, type Permission } from '@/lib/auth/permissions'

import { organizations, organizationMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

  // 1. Check membership
  const member = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (member[0]?.organizationId) {
    return member[0].organizationId
  }

  // 2. Check ownership
  const owned = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.ownerId, user.id))
    .limit(1)

  if (owned[0]?.id) {
    return owned[0].id
  }

  throw new Error('Not a member of any organization')
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
