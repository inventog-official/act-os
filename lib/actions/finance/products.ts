'use server'

import { db } from '@/db'
import { financeProductCategories, financeProducts } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from './utils'

export async function getProductCategories(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('finance_product_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}

export async function createProductCategory(input: {
  name: string
  description?: string | null
  organizationId: string
  workspaceId?: string | null
  parentId?: string | null
}) {
  const user = await getCurrentUser()

  const [data] = await db
    .insert(financeProductCategories)
    .values({
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      createdBy: user.id,
    })
    .returning()

  return data
}

export async function updateProductCategory(id: string, input: {
  name?: string
  description?: string | null
  parentId?: string | null
}) {
  const user = await getCurrentUser()

  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) values.name = input.name
  if (input.description !== undefined) values.description = input.description ?? null
  if (input.parentId !== undefined) values.parentId = input.parentId ?? null

  await db
    .update(financeProductCategories)
    .set(values)
    .where(and(eq(financeProductCategories.id, id), isNull(financeProductCategories.deletedAt)))

  return { success: true, updatedBy: user.id }
}

export async function deleteProductCategory(id: string) {
  await db
    .update(financeProductCategories)
    .set({ deletedAt: new Date() })
    .where(eq(financeProductCategories.id, id))
  return { success: true }
}

export async function getProducts(
  organizationId: string,
  workspaceId?: string,
) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('finance_products')
    .select('*, category:category_id(*)')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')

  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProductById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('finance_products')
    .select('*, category:category_id(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProduct(input: {
  name: string
  sku?: string | null
  categoryId?: string | null
  description?: string | null
  unitPrice: number
  unit?: string
  taxRateId?: string | null
  type?: string
  status?: string
  organizationId: string
  workspaceId?: string | null
}) {
  const user = await getCurrentUser()

  const [data] = await db
    .insert(financeProducts)
    .values({
      name: input.name,
      sku: input.sku ?? null,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      unitPrice: String(input.unitPrice),
      unit: input.unit ?? 'piece',
      taxRateId: input.taxRateId ?? null,
      type: input.type ?? 'product',
      status: input.status ?? 'active',
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      createdBy: user.id,
    })
    .returning()

  return data
}

export async function updateProduct(
  id: string,
  input: {
    name?: string
    sku?: string | null
    categoryId?: string | null
    description?: string | null
    unitPrice?: number
    unit?: string
    taxRateId?: string | null
    type?: string
    status?: string
  },
) {
  const user = await getCurrentUser()

  const values: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: user.id,
  }
  if (input.name !== undefined) values.name = input.name
  if (input.sku !== undefined) values.sku = input.sku ?? null
  if (input.categoryId !== undefined)
    values.categoryId = input.categoryId ?? null
  if (input.description !== undefined)
    values.description = input.description ?? null
  if (input.unitPrice !== undefined) values.unitPrice = String(input.unitPrice)
  if (input.unit !== undefined) values.unit = input.unit
  if (input.taxRateId !== undefined)
    values.taxRateId = input.taxRateId ?? null
  if (input.type !== undefined) values.type = input.type
  if (input.status !== undefined) values.status = input.status

  await db
    .update(financeProducts)
    .set(values)
    .where(eq(financeProducts.id, id))
}

export async function deleteProduct(id: string) {
  await db
    .update(financeProducts)
    .set({ deletedAt: new Date() })
    .where(eq(financeProducts.id, id))
}
