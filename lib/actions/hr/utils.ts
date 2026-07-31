'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { hrActivities } from '@/db/schema'
import { requirePermission } from '@/lib/auth/permissions'
import type { Permission } from '@/lib/auth/permissions'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function logHrActivity(input: {
  organizationId: string
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  await db.insert(hrActivities).values({
    organizationId: input.organizationId,
    userId: user.id,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : '{}',
  } as any).returning()
}

export async function guardHrPermission(organizationId: string, permission: Permission) {
  await requirePermission(organizationId, permission)
}

export async function ensureOrgScope(organizationId?: string) {
  if (!organizationId) throw new Error('Organization is required')
  return organizationId
}