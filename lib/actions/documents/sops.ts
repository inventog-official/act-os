'use server'

import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { db } from '@/db'
import { documentSops } from '@/db/schema'
import { documentSopSchema, type DocumentSopInput } from '@/lib/utils/validations'
import { getCurrentUser, guardDocumentPermission, logDocumentActivity } from './utils'

export async function createSop(organizationId: string, input: DocumentSopInput) {
  await guardDocumentPermission(organizationId, 'documents:sops:manage')
  const user = await getCurrentUser()
  const data = documentSopSchema.parse(input)

  const [sop] = await db
    .insert(documentSops)
    .values({
      title: data.title,
      purpose: data.purpose ?? null,
      scope: data.scope ?? null,
      departmentId: data.department_id ?? null,
      ownerId: data.owner_id ?? null,
      steps: JSON.stringify(data.steps ?? []),
      requiredInputs: JSON.stringify(data.required_inputs ?? []),
      expectedOutputs: JSON.stringify(data.expected_outputs ?? []),
      relatedDocumentIds: data.related_document_ids ?? [],
      version: data.version ?? 1,
      approvalStatus: data.approval_status,
      organizationId,
      createdBy: user.id,
      updatedBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'sop.create',
    resource: 'sop',
    resourceId: sop.id,
    metadata: { title: sop.title, version: sop.version },
  })
  return sop
}

export async function updateSop(organizationId: string, sopId: string, input: Partial<DocumentSopInput>) {
  await guardDocumentPermission(organizationId, 'documents:sops:manage')
  const user = await getCurrentUser()
  const data = documentSopSchema.partial().parse(input)

  const [sop] = await db
    .update(documentSops)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.purpose !== undefined && { purpose: data.purpose ?? null }),
      ...(data.scope !== undefined && { scope: data.scope ?? null }),
      ...(data.department_id !== undefined && { departmentId: data.department_id }),
      ...(data.owner_id !== undefined && { ownerId: data.owner_id }),
      ...(data.steps !== undefined && { steps: JSON.stringify(data.steps) }),
      ...(data.required_inputs !== undefined && { requiredInputs: JSON.stringify(data.required_inputs) }),
      ...(data.expected_outputs !== undefined && { expectedOutputs: JSON.stringify(data.expected_outputs) }),
      ...(data.related_document_ids !== undefined && { relatedDocumentIds: data.related_document_ids }),
      ...(data.version !== undefined && { version: data.version }),
      ...(data.approval_status !== undefined && { approvalStatus: data.approval_status }),
      updatedBy: user.id,
    } as any)
    .where(and(eq(documentSops.id, sopId), eq(documentSops.organizationId, organizationId), isNull(documentSops.deletedAt)))
    .returning()

  if (!sop) throw new Error('SOP not found')
  await logDocumentActivity({
    organizationId,
    action: 'sop.update',
    resource: 'sop',
    resourceId: sopId,
    metadata: { changes: Object.keys(data) },
  })
  return sop
}

export async function getSop(organizationId: string, sopId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const [sop] = await db
    .select()
    .from(documentSops)
    .where(and(eq(documentSops.id, sopId), eq(documentSops.organizationId, organizationId), isNull(documentSops.deletedAt)))
    .limit(1)
  return sop ?? null
}

export async function getSops(organizationId: string, opts?: { departmentId?: string; search?: string }) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(documentSops.organizationId, organizationId), isNull(documentSops.deletedAt)]
  if (opts?.departmentId) conditions.push(eq(documentSops.departmentId, opts.departmentId))
  if (opts?.search) conditions.push(or(ilike(documentSops.title, `%${opts.search}%`), ilike(documentSops.purpose, `%${opts.search}%`)) as any)
  return db.select().from(documentSops).where(and(...conditions)).orderBy(desc(documentSops.updatedAt)).limit(100)
}

export async function deleteSop(organizationId: string, sopId: string) {
  await guardDocumentPermission(organizationId, 'documents:sops:manage')
  const [sop] = await db
    .update(documentSops)
    .set({ deletedAt: new Date() } as any)
    .where(and(eq(documentSops.id, sopId), eq(documentSops.organizationId, organizationId), isNull(documentSops.deletedAt)))
    .returning()
  if (sop) {
    await logDocumentActivity({
      organizationId,
      action: 'sop.delete',
      resource: 'sop',
      resourceId: sopId,
      metadata: { title: sop.title },
    })
  }
  return sop
}

export async function incrementSopVersion(organizationId: string, sopId: string) {
  const existing = await getSop(organizationId, sopId)
  if (!existing) throw new Error('SOP not found')
  const next = (existing.version ?? 1) + 1
  await db
    .update(documentSops)
    .set({ version: next, approvalStatus: 'draft', updatedBy: (await getCurrentUser()).id } as any)
    .where(and(eq(documentSops.id, sopId), eq(documentSops.organizationId, organizationId)))
  return next
}