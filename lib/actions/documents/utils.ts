'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { documentActivities, documentShares, documents } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { requirePermission } from '@/lib/auth/permissions'
import type { Permission } from '@/lib/auth/permissions'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function logDocumentActivity(input: {
  organizationId: string
  action: string
  resource: string
  resourceId?: string | null
  documentId?: string | null
  metadata?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  await db.insert(documentActivities).values({
    organizationId: input.organizationId,
    userId: user.id,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    documentId: input.documentId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : '{}',
  } as any).returning()
}

export async function guardDocumentPermission(organizationId: string, permission: Permission) {
  await requirePermission(organizationId, permission)
}

export async function ensureOrganizationScope(organizationId?: string) {
  if (!organizationId) throw new Error('Organization is required')
  return organizationId
}

export async function getDocumentAccessLevel(documentId: string, organizationId: string) {
  const user = await getCurrentUser()
  const rows = await db
    .select({ shareId: documentShares.id, permission: documentShares.permission, ownerId: documents.ownerId, createdBy: documents.createdBy })
    .from(documentShares)
    .innerJoin(documents, eq(documentShares.documentId, documents.id))
    .where(and(
      eq(documentShares.documentId, documentId),
      eq(documents.organizationId, organizationId),
      isNull(documents.deletedAt),
      eq(documentShares.shareType, 'user'),
      eq(documentShares.sharedWithUserId, user.id),
    ))
    .limit(1)

  const doc = await db
    .select({ ownerId: documents.ownerId, createdBy: documents.createdBy })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, organizationId), isNull(documents.deletedAt)))
    .limit(1)

  if (doc[0] && (doc[0].ownerId === user.id || doc[0].createdBy === user.id)) return 'manage'
  if (rows[0]?.permission) return rows[0].permission
  return undefined
}