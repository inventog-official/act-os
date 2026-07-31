'use server'

import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { documentContracts } from '@/db/schema'
import { documentContractSchema, type DocumentContractInput } from '@/lib/utils/validations'
import { getCurrentUser, guardDocumentPermission, logDocumentActivity } from './utils'

export async function createContract(organizationId: string, input: DocumentContractInput) {
  await guardDocumentPermission(organizationId, 'documents:contracts:manage')
  const user = await getCurrentUser()
  const data = documentContractSchema.parse(input)

  const [contract] = await db
    .insert(documentContracts)
    .values({
      name: data.name,
      contractNumber: data.contract_number ?? null,
      customerId: data.customer_id ?? null,
      companyId: data.company_id ?? null,
      dealId: data.deal_id ?? null,
      projectId: data.project_id ?? null,
      startDate: data.start_date ?? null,
      endDate: data.end_date ?? null,
      renewalDate: data.renewal_date ?? null,
      value: data.value?.toString() ?? null,
      currency: data.currency ?? 'USD',
      status: data.status,
      ownerId: data.owner_id ?? null,
      documentId: data.document_id ?? null,
      notes: data.notes ?? null,
      organizationId,
      createdBy: user.id,
      updatedBy: user.id,
    } as any)
    .returning()

  await logDocumentActivity({
    organizationId,
    action: 'contract.create',
    resource: 'contract',
    resourceId: contract.id,
    documentId: data.document_id ?? null,
    metadata: { name: contract.name, status: contract.status },
  })
  return contract
}

export async function updateContract(organizationId: string, contractId: string, input: Partial<DocumentContractInput>) {
  await guardDocumentPermission(organizationId, 'documents:contracts:manage')
  const user = await getCurrentUser()
  const data = documentContractSchema.partial().parse(input)

  const [contract] = await db
    .update(documentContracts)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.contract_number !== undefined && { contractNumber: data.contract_number ?? null }),
      ...(data.customer_id !== undefined && { customerId: data.customer_id }),
      ...(data.company_id !== undefined && { companyId: data.company_id }),
      ...(data.deal_id !== undefined && { dealId: data.deal_id }),
      ...(data.project_id !== undefined && { projectId: data.project_id }),
      ...(data.start_date !== undefined && { startDate: data.start_date ?? null }),
      ...(data.end_date !== undefined && { endDate: data.end_date ?? null }),
      ...(data.renewal_date !== undefined && { renewalDate: data.renewal_date ?? null }),
      ...(data.value !== undefined && { value: data.value?.toString() ?? null }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.owner_id !== undefined && { ownerId: data.owner_id }),
      ...(data.document_id !== undefined && { documentId: data.document_id }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
      updatedBy: user.id,
    } as any)
    .where(and(eq(documentContracts.id, contractId), eq(documentContracts.organizationId, organizationId), isNull(documentContracts.deletedAt)))
    .returning()

  if (!contract) throw new Error('Contract not found')
  await logDocumentActivity({
    organizationId,
    action: 'contract.update',
    resource: 'contract',
    resourceId: contractId,
    metadata: { changes: Object.keys(data) },
  })
  return contract
}

export async function getContract(organizationId: string, contractId: string) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const [contract] = await db
    .select()
    .from(documentContracts)
    .where(and(eq(documentContracts.id, contractId), eq(documentContracts.organizationId, organizationId), isNull(documentContracts.deletedAt)))
    .limit(1)
  return contract ?? null
}

export async function getContracts(organizationId: string, opts?: { status?: string; search?: string }) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const conditions = [eq(documentContracts.organizationId, organizationId), isNull(documentContracts.deletedAt)]
  if (opts?.status) conditions.push(eq(documentContracts.status, opts.status))
  if (opts?.search) conditions.push(or(ilike(documentContracts.name, `%${opts.search}%`), ilike(documentContracts.contractNumber, `%${opts.search}%`)) as any)
  return db.select().from(documentContracts).where(and(...conditions)).orderBy(desc(documentContracts.updatedAt)).limit(100)
}

export async function getExpiringContracts(organizationId: string, days = 30) {
  await guardDocumentPermission(organizationId, 'documents:view')
  const window = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return db
    .select()
    .from(documentContracts)
    .where(and(
      eq(documentContracts.organizationId, organizationId),
      isNull(documentContracts.deletedAt),
      eq(documentContracts.status, 'active'),
      sql`${documentContracts.endDate} <= ${window}`,
    ))
    .orderBy(asc(documentContracts.endDate))
}

export async function deleteContract(organizationId: string, contractId: string) {
  await guardDocumentPermission(organizationId, 'documents:contracts:manage')
  const [contract] = await db
    .update(documentContracts)
    .set({ deletedAt: new Date() } as any)
    .where(and(eq(documentContracts.id, contractId), eq(documentContracts.organizationId, organizationId), isNull(documentContracts.deletedAt)))
    .returning()
  if (contract) {
    await logDocumentActivity({
      organizationId,
      action: 'contract.delete',
      resource: 'contract',
      resourceId: contractId,
      metadata: { name: contract.name },
    })
  }
  return contract
}