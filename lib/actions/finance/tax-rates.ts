'use server'

import { db } from '@/db'
import { financeTaxRates } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getCurrentUser } from './utils'

export async function getTaxRates(organizationId: string) {
  return db.select().from(financeTaxRates)
    .where(and(eq(financeTaxRates.organizationId, organizationId), isNull(financeTaxRates.deletedAt)))
    .orderBy(financeTaxRates.name)
}

type CreateTaxRateInput = {
  name: string
  rate: number
  type?: string
  isDefault?: boolean
  isCompound?: boolean
  appliesTo?: string[]
  workspaceId?: string
  organizationId: string
}

export async function createTaxRate(input: CreateTaxRateInput) {
  const user = await getCurrentUser()

  if (input.isDefault) {
    await db.update(financeTaxRates)
      .set({ isDefault: false })
      .where(and(eq(financeTaxRates.organizationId, input.organizationId), isNull(financeTaxRates.deletedAt)))
  }

  const [taxRate] = await db.insert(financeTaxRates).values({
    name: input.name,
    rate: String(input.rate),
    type: input.type ?? 'sales_tax',
    isDefault: input.isDefault ?? false,
    isCompound: input.isCompound ?? false,
    appliesTo: input.appliesTo ?? [],
    organizationId: input.organizationId,
    workspaceId: input.workspaceId ?? null,
    createdBy: user.id,
  }).returning()

  return taxRate
}

type UpdateTaxRateInput = Partial<CreateTaxRateInput>

export async function updateTaxRate(id: string, input: UpdateTaxRateInput) {
  const user = await getCurrentUser()

  if (input.isDefault) {
    const current = await db.select({ organizationId: financeTaxRates.organizationId }).from(financeTaxRates)
      .where(eq(financeTaxRates.id, id)).limit(1).then(r => r[0])

    if (current) {
      await db.update(financeTaxRates)
        .set({ isDefault: false })
        .where(and(eq(financeTaxRates.organizationId, current.organizationId), isNull(financeTaxRates.deletedAt)))
    }
  }

  const updateData: Record<string, unknown> = {
    name: input.name,
    rate: input.rate !== undefined ? String(input.rate) : undefined,
    type: input.type,
    isDefault: input.isDefault,
    isCompound: input.isCompound,
    appliesTo: input.appliesTo,
    workspaceId: input.workspaceId,
    updatedAt: new Date(),
  }

  Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k])

  await db.update(financeTaxRates)
    .set(updateData)
    .where(eq(financeTaxRates.id, id))

  const [updated] = await db.select().from(financeTaxRates).where(eq(financeTaxRates.id, id)).limit(1)
  return updated
}

export async function deleteTaxRate(id: string) {
  await db.update(financeTaxRates)
    .set({ deletedAt: new Date() })
    .where(eq(financeTaxRates.id, id))
}