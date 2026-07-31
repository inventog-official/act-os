'use server'

import { db } from '@/db'
import { financePurchaseOrders, financePurchaseOrderItems } from '@/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { getCurrentUser, generateNumber } from './utils'

type PurchaseOrderItemInput = {
  description: string
  quantity: number
  unitPrice: number
  productId?: string
  taxRateId?: string
  taxAmount?: number
  total?: number
  sortOrder?: number
}

type CreatePurchaseOrderInput = {
  vendorName: string
  vendorEmail?: string
  vendorPhone?: string
  projectId?: string
  issueDate: string
  deliveryDate?: string
  currency?: string
  notes?: string
  terms?: string
  organizationId: string
  workspaceId?: string
  items: PurchaseOrderItemInput[]
}

export async function getPurchaseOrders(organizationId: string, workspaceId?: string) {
  const conditions = [eq(financePurchaseOrders.organizationId, organizationId), isNull(financePurchaseOrders.deletedAt)]
  if (workspaceId) conditions.push(eq(financePurchaseOrders.workspaceId, workspaceId))

  const orders = await db.select().from(financePurchaseOrders).where(and(...conditions))
    .orderBy(financePurchaseOrders.createdAt)

  if (orders.length === 0) return []

  const items = await db.select().from(financePurchaseOrderItems)
    .where(inArray(financePurchaseOrderItems.purchaseOrderId, orders.map(o => o.id)))

  return orders.map(order => ({
    ...order,
    items: items.filter(i => i.purchaseOrderId === order.id),
  }))
}

export async function getPurchaseOrderById(id: string) {
  const [order] = await db.select().from(financePurchaseOrders)
    .where(and(eq(financePurchaseOrders.id, id), isNull(financePurchaseOrders.deletedAt)))
    .limit(1)

  if (!order) return null

  const items = await db.select().from(financePurchaseOrderItems)
    .where(eq(financePurchaseOrderItems.purchaseOrderId, id))

  return { ...order, items }
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const user = await getCurrentUser()
  const poNumber = await generateNumber(financePurchaseOrders, 'PO', input.organizationId)

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxAmount = input.items.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0)
  const total = subtotal + taxAmount

  const [order] = await db.insert(financePurchaseOrders).values({
    poNumber,
    vendorName: input.vendorName,
    vendorEmail: input.vendorEmail ?? null,
    vendorPhone: input.vendorPhone ?? null,
    projectId: input.projectId ?? null,
    issueDate: input.issueDate as unknown as Date,
    deliveryDate: input.deliveryDate as unknown as Date,
    currency: input.currency ?? 'USD',
    subtotal: String(subtotal),
    taxAmount: String(taxAmount),
    total: String(total),
    notes: input.notes ?? null,
    terms: input.terms ?? null,
    status: 'draft',
    organizationId: input.organizationId,
    workspaceId: input.workspaceId ?? null,
    createdBy: user.id,
  }).returning()

  if (input.items.length > 0) {
    await db.insert(financePurchaseOrderItems).values(
      input.items.map((item, idx) => ({
        purchaseOrderId: order.id,
        productId: item.productId ?? null,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        taxRateId: item.taxRateId ?? null,
        taxAmount: item.taxAmount ? String(item.taxAmount) : '0',
        total: item.total ? String(item.total) : String(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
        sortOrder: item.sortOrder ?? idx,
      }))
    )
  }

  const items = await db.select().from(financePurchaseOrderItems)
    .where(eq(financePurchaseOrderItems.purchaseOrderId, order.id))

  return { ...order, items }
}

export async function updatePurchaseOrder(id: string, input: Partial<CreatePurchaseOrderInput> & { items?: PurchaseOrderItemInput[] }) {
  const user = await getCurrentUser()

  const updateData: Record<string, unknown> = {
    vendorName: input.vendorName,
    vendorEmail: input.vendorEmail ?? null,
    vendorPhone: input.vendorPhone ?? null,
    projectId: input.projectId ?? null,
    issueDate: input.issueDate as unknown as Date,
    deliveryDate: input.deliveryDate as unknown as Date,
    currency: input.currency,
    notes: input.notes ?? null,
    terms: input.terms ?? null,
    updatedBy: user.id,
    updatedAt: new Date(),
  }

  Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k])

  if (input.items) {
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const taxAmount = input.items.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0)
    updateData.subtotal = String(subtotal)
    updateData.taxAmount = String(taxAmount)
    updateData.total = String(subtotal + taxAmount)
  }

  await db.update(financePurchaseOrders)
    .set(updateData)
    .where(eq(financePurchaseOrders.id, id))

  if (input.items) {
    await db.delete(financePurchaseOrderItems).where(eq(financePurchaseOrderItems.purchaseOrderId, id))

    await db.insert(financePurchaseOrderItems).values(
      input.items.map((item, idx) => ({
        purchaseOrderId: id,
        productId: item.productId ?? null,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        taxRateId: item.taxRateId ?? null,
        taxAmount: item.taxAmount ? String(item.taxAmount) : '0',
        total: item.total ? String(item.total) : String(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
        sortOrder: item.sortOrder ?? idx,
      }))
    )
  }

  return getPurchaseOrderById(id)
}

export async function deletePurchaseOrder(id: string) {
  const user = await getCurrentUser()
  await db.update(financePurchaseOrders)
    .set({ deletedAt: new Date(), updatedBy: user.id })
    .where(eq(financePurchaseOrders.id, id))
}

export async function approvePurchaseOrder(id: string) {
  const user = await getCurrentUser()
  await db.update(financePurchaseOrders)
    .set({ status: 'approved', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id })
    .where(eq(financePurchaseOrders.id, id))
  return getPurchaseOrderById(id)
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const user = await getCurrentUser()
  await db.update(financePurchaseOrders)
    .set({ status, updatedBy: user.id })
    .where(eq(financePurchaseOrders.id, id))
  return getPurchaseOrderById(id)
}