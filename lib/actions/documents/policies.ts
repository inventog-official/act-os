'use server'

import { and, asc, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { db } from '@/db'
import { documentPolicies } from '@/db/schema'
import { documentPolicySchema, type DocumentPolicyInput } from '@/lib/utils/validations'
import { getCurrentUser, guardDocumentPermission, logDocumentActivity } from './utils'

export async function createPolicy(organizationId: string, input: DocumentPolicyInput) {
  await guardDocumentPermission(organizationId, 'documents:policies:manage')
  const user = await getCurrentUser()
  const data = documentPolicySchema.parse(input)

  const [policy] = await db
    .insert(documentPolicies)
    .values({
      title: data.title,
      policyType: data.policy_type,
      summary: data.summary ?? null,
      content: data.content ? (data.content as any) : undefined,
      contentText: data.content_text ?? null,
      departmentId: data.department_id ?? null,
      ownerId: data.owner_id ?? null,
      version: data.version ?? 1,
      effectiveDate: data.effective_date ?? null,
      expirationDate: data.expiration_date ?? null,
      approvalStatus: data.approval_status,
      organizationId,
      createdBy: user.id,
      updatedBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'policy.create',
    resource: 'policy',
    resourceId: policy.id,
    metadata: { title: policy.title, type: policy.policyType },
  })
  return policy
}

export async function updatePolicy(organizationId: string, policyId: string, input: Partial<DocumentPolicyInput>) {
  await guardDocumentPermission(organizationId, 'documents:policies:manage')
  const user = await getCurrentUser()
  const data = documentPolicySchema.partial().parse(input)

  const [policy] = await db
    .update(documentPolicies)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.policy_type !== undefined && { policyType: data.policy_type }),
      ...(data.summary !== undefined && { summary: data.summary ?? null }),
      ...(data.content !== undefined && { content: data.content as any }),
      ...(data.content_text !== undefined && { contentText: data.content_text ?? null }),
      ...(data.department_id !== undefined && { departmentId: data.department_id }),
      ...(data.owner_id !== undefined && { ownerId: data.owner_id }),
      ...(data.version !== undefined && { version: data.version }),
      ...(data.effective_date !== undefined && { effectiveDate: data.effective_date ?? null }),
      ...(data.expiration_date !== undefined && { expirationDate: data.expiration_date ?? null }),
      ...(data.approval_status !== undefined && { approvalStatus: data.approval_status }),
      updatedBy: user.id,
    } as any)
    .where(and(eq(documentPolicies.id, policyId), eq(documentPolicies.organizationId, organizationId), isNull(documentPolicies.deletedAt)))
    .returning()

  if (!policy) throw new Error('Policy not found')
  await logDocumentActivity({
    organizationId,
    action: 'policy.update',
    resource: 'policy',
    resourceId: policyId,
    metadata: { changes: Object.keys(data) },
  })
  return policy
}

export async function getPolicy(organizationId: string, policyId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const [policy] = await db
    .select()
    .from(documentPolicies)
    .where(and(eq(documentPolicies.id, policyId), eq(documentPolicies.organizationId, organizationId), isNull(documentPolicies.deletedAt)))
    .limit(1)
  return policy ?? null
}

export async function getPolicies(organizationId: string, opts?: { policyType?: string; search?: string }) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(documentPolicies.organizationId, organizationId), isNull(documentPolicies.deletedAt)]
  if (opts?.policyType) conditions.push(eq(documentPolicies.policyType, opts.policyType))
  if (opts?.search) conditions.push(or(ilike(documentPolicies.title, `%${opts.search}%`), ilike(documentPolicies.summary, `%${opts.search}%`)) as any)
  return db.select().from(documentPolicies).where(and(...conditions)).orderBy(desc(documentPolicies.updatedAt)).limit(100)
}

export async function deletePolicy(organizationId: string, policyId: string) {
  await guardDocumentPermission(organizationId, 'documents:policies:manage')
  const [policy] = await db
    .update(documentPolicies)
    .set({ deletedAt: new Date() } as any)
    .where(and(eq(documentPolicies.id, policyId), eq(documentPolicies.organizationId, organizationId), isNull(documentPolicies.deletedAt)))
    .returning()
  if (policy) {
    await logDocumentActivity({
      organizationId,
      action: 'policy.delete',
      resource: 'policy',
      resourceId: policyId,
      metadata: { title: policy.title },
    })
  }
  return policy
}