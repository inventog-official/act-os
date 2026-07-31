'use server'

import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  inventoryPurchaseRequests,
  inventoryPurchaseRequestLines,
  inventoryPrApprovalSteps,
  inventoryPurchaseOrders,
  inventoryPurchaseOrderLines,
  inventoryGoodsReceipts,
  inventoryReceiptLines,
  inventoryPurchaseReturns,
  inventoryReturnLines,
  inventorySuppliers,
} from '@/db/schema/inventory'
import {
  inventoryPrSchema,
  inventoryPrLineSchema,
  inventoryPoSchema,
  inventoryPoLineSchema,
  inventoryGoodsReceiptSchema,
  inventoryReceiptLineSchema,
  inventoryReturnSchema,
  inventoryReturnLineSchema,
  type InventoryPrInput,
  type InventoryPrLineInput,
  type InventoryPoInput,
  type InventoryPoLineInput,
  type InventoryGoodsReceiptInput,
  type InventoryReceiptLineInput,
  type InventoryReturnInput,
  type InventoryReturnLineInput,
} from '@/lib/utils/validations'
import { getCurrentUser, guardInventoryPermission, logInventoryActivity } from './utils'
import { adjustStockAtomic } from './inventory'

const NOT_DELETED_PR = isNull(inventoryPurchaseRequests.deletedAt)
const NOT_DELETED_PO = isNull(inventoryPurchaseOrders.deletedAt)

export async function listPurchaseRequests(organizationId: string, opts?: { status?: string; search?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_request:create')
  const conditions: any[] = [eq(inventoryPurchaseRequests.organizationId, organizationId), NOT_DELETED_PR]
  if (opts?.status) conditions.push(eq(inventoryPurchaseRequests.status, opts.status))
  if (opts?.search) conditions.push(ilike(inventoryPurchaseRequests.requestNumber, `%${opts.search}%`))
  return db.select().from(inventoryPurchaseRequests).where(and(...conditions)).orderBy(desc(inventoryPurchaseRequests.createdAt))
}

export async function createPurchaseRequest(organizationId: string, input: InventoryPrInput, lines: Omit<InventoryPrLineInput, 'request_id'>[]) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_request:create')
  const user = await getCurrentUser()
  const data = inventoryPrSchema.parse(input)
  return await db.transaction(async (tx) => {
    const [pr] = await tx.insert(inventoryPurchaseRequests).values({
      requestNumber: data.request_number,
      title: data.title,
      description: data.description || null,
      departmentId: data.department_id ?? null,
      projectId: data.project_id ?? null,
      currency: data.currency,
      notes: data.notes || null,
      requestedBy: user.id,
      status: 'draft',
      totalAmount: '0',
      organizationId,
    } as any).returning()
    let total = 0
    for (const line of lines) {
      const parsed = inventoryPrLineSchema.parse({ ...line, request_id: pr.id })
      const lineTotal = Number(parsed.quantity) * Number(parsed.unit_price)
      total += lineTotal
      await tx.insert(inventoryPurchaseRequestLines).values({
        requestId: parsed.request_id,
        productId: parsed.product_id ?? null,
        description: parsed.description,
        quantity: parsed.quantity,
        unitId: parsed.unit_id ?? null,
        unitPrice: parsed.unit_price,
        preferredSupplierId: parsed.preferred_supplier_id ?? null,
        totalPrice: String(lineTotal),
      } as any)
    }
    await tx.update(inventoryPurchaseRequests).set({ totalAmount: String(total) }).where(eq(inventoryPurchaseRequests.id, pr.id))
    await logInventoryActivity({ organizationId, action: 'pr.create', resource: 'purchase_request', resourceId: pr.id, metadata: { total } })
    return { ...pr, lines }
  })
}

export async function submitPurchaseRequest(organizationId: string, prId: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_request:approve')
  const user = await getCurrentUser()
  await db.update(inventoryPurchaseRequests)
    .set({ status: 'submitted', requestedAt: new Date() })
    .where(and(eq(inventoryPurchaseRequests.id, prId), eq(inventoryPurchaseRequests.organizationId, organizationId)))
  await logInventoryActivity({ organizationId, action: 'pr.submit', resource: 'purchase_request', resourceId: prId, metadata: { by: user.id } })
  return { success: true }
}

export async function approvePurchaseRequest(organizationId: string, prId: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_request:approve')
  const user = await getCurrentUser()
  await db.update(inventoryPrApprovalSteps)
    .set({ status: 'approved', approvedBy: user.id, approvedAt: new Date() })
    .where(and(eq(inventoryPrApprovalSteps.requestId, prId), eq(inventoryPrApprovalSteps.status, 'pending')))
  await db.update(inventoryPurchaseRequests)
    .set({ status: 'approved', approvedBy: user.id, approvedAt: new Date() })
    .where(and(eq(inventoryPurchaseRequests.id, prId), eq(inventoryPurchaseRequests.organizationId, organizationId)))
  await logInventoryActivity({ organizationId, action: 'pr.approve', resource: 'purchase_request', resourceId: prId, metadata: { by: user.id } })
  return { success: true }
}

export async function listPurchaseOrders(organizationId: string, opts?: { status?: string; supplierId?: string; search?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_order:create')
  const conditions: any[] = [eq(inventoryPurchaseOrders.organizationId, organizationId), NOT_DELETED_PO]
  if (opts?.status) conditions.push(eq(inventoryPurchaseOrders.status, opts.status))
  if (opts?.supplierId) conditions.push(eq(inventoryPurchaseOrders.supplierId, opts.supplierId))
  if (opts?.search) conditions.push(ilike(inventoryPurchaseOrders.poNumber, `%${opts.search}%`))
  return db.select().from(inventoryPurchaseOrders).where(and(...conditions)).orderBy(desc(inventoryPurchaseOrders.createdAt))
}

export async function listPurchaseOrderLines(organizationId: string, poId?: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_order:create')
  if (!poId) return []
  return db.select().from(inventoryPurchaseOrderLines).where(eq(inventoryPurchaseOrderLines.purchaseOrderId, poId))
}

export async function createPurchaseOrder(organizationId: string, input: InventoryPoInput, lines: Omit<InventoryPoLineInput, 'purchase_order_id'>[]) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_order:create')
  const user = await getCurrentUser()
  const data = inventoryPoSchema.parse(input)
  return await db.transaction(async (tx) => {
    const [po] = await tx.insert(inventoryPurchaseOrders).values({
      poNumber: data.po_number,
      supplierId: data.supplier_id,
      projectId: data.project_id ?? null,
      departmentId: data.department_id ?? null,
      currency: data.currency,
      subtotal: String(data.subtotal),
      taxAmount: String(data.tax_amount),
      shippingCost: String(data.shipping_cost),
      discountAmount: String(data.discount_amount),
      expectedDelivery: data.expected_delivery || null,
      terms: data.terms || null,
      notes: data.notes || null,
      status: 'draft',
      createdBy: user.id,
      organizationId,
    } as any).returning()
    let subtotal = 0
    const taxTotal = 0
    for (const line of lines) {
      const parsed = inventoryPoLineSchema.parse({ ...line, purchase_order_id: po.id })
      const lineTotal = Number(parsed.quantity) * Number(parsed.unit_price ?? 0)
      subtotal += lineTotal
      await tx.insert(inventoryPurchaseOrderLines).values({
        purchaseOrderId: parsed.purchase_order_id,
        productId: parsed.product_id,
        description: parsed.description || null,
        quantity: parsed.quantity,
        unitPrice: parsed.unit_price,
        taxAmount: '0',
        lineTotal: String(lineTotal),
      } as any)
    }
    await tx.update(inventoryPurchaseOrders)
      .set({ subtotal: String(subtotal), taxAmount: String(taxTotal), totalAmount: String(subtotal + taxTotal) })
      .where(eq(inventoryPurchaseOrders.id, po.id))
    await logInventoryActivity({ organizationId, action: 'po.create', resource: 'purchase_order', resourceId: po.id, metadata: { subtotal } })
    return { ...po, lines }
  })
}

export async function approvePurchaseOrder(organizationId: string, poId: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_order:approve')
  const user = await getCurrentUser()
  await db.update(inventoryPurchaseOrders)
    .set({ status: 'approved', approvedBy: user.id, approvedAt: new Date() })
    .where(and(eq(inventoryPurchaseOrders.id, poId), eq(inventoryPurchaseOrders.organizationId, organizationId)))
  await logInventoryActivity({ organizationId, action: 'po.approve', resource: 'purchase_order', resourceId: poId, metadata: { by: user.id } })
  return { success: true }
}

export async function sendPurchaseOrder(organizationId: string, poId: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:purchase_order:send')
  const user = await getCurrentUser()
  await db.update(inventoryPurchaseOrders)
    .set({ status: 'sent', sentAt: new Date() })
    .where(and(eq(inventoryPurchaseOrders.id, poId), eq(inventoryPurchaseOrders.organizationId, organizationId)))
  await logInventoryActivity({ organizationId, action: 'po.send', resource: 'purchase_order', resourceId: poId, metadata: { by: user.id } })
  return { success: true }
}

export async function receiveGoods(organizationId: string, input: InventoryGoodsReceiptInput, lines: Omit<InventoryReceiptLineInput, 'receipt_id'>[]) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:receiving')
  const user = await getCurrentUser()
  const data = inventoryGoodsReceiptSchema.parse(input)
  return await db.transaction(async (tx) => {
    const [receipt] = await tx.insert(inventoryGoodsReceipts).values({
      receiptNumber: data.receipt_number,
      poId: data.po_id,
      warehouseId: data.warehouse_id,
      locationId: data.location_id ?? null,
      supplierId: data.supplier_id,
      receivedDate: data.received_date,
      currency: data.currency,
      notes: data.notes || null,
      receivedBy: user.id,
      status: 'draft',
      organizationId,
    } as any).returning()
    let total = 0
    for (const line of lines) {
      const parsed = inventoryReceiptLineSchema.parse({ ...line, receipt_id: receipt.id })
      const received = Number(parsed.received_quantity)
      const damaged = Number(parsed.damaged_quantity)
      const missing = Number(parsed.missing_quantity)
      const rejected = Number(parsed.rejected_quantity)
      if (received <= 0 && damaged <= 0 && missing <= 0 && rejected <= 0) continue
      // receipt_lines requires received_quantity > 0; when only damage/reject is
      // reported treat that as the physically received count.
      const effectiveReceived = received > 0 ? received : (damaged > 0 ? damaged : 1)
      const usable = Math.max(0, effectiveReceived - damaged - rejected)
      const lineTotal = usable * Number(parsed.unit_price ?? 0)
      total += lineTotal
      await tx.insert(inventoryReceiptLines).values({
        receiptId: parsed.receipt_id,
        poLineId: parsed.po_line_id ?? null,
        productId: parsed.product_id,
        quantity: parsed.quantity,
        unitPrice: parsed.unit_price,
        receivedQuantity: effectiveReceived,
        damagedQuantity: damaged,
        missingQuantity: missing,
        rejectedQuantity: rejected,
        lineTotal: String(lineTotal),
        notes: parsed.notes || null,
      } as any)
      if (usable > 0) {
        await adjustStockAtomic({
          organizationId,
          productId: parsed.product_id,
          warehouseId: data.warehouse_id,
          quantityChange: usable,
          movementType: 'receipt',
          locationId: data.location_id ?? null,
          referenceType: 'receipt',
          referenceId: receipt.id,
          reason: 'goods_received',
          unitCost: Number(parsed.unit_price ?? 0),
        })
      }
      if (damaged > 0) {
        await adjustStockAtomic({
          organizationId,
          productId: parsed.product_id,
          warehouseId: data.warehouse_id,
          quantityChange: damaged,
          movementType: 'damage',
          locationId: data.location_id ?? null,
          referenceType: 'receipt',
          referenceId: receipt.id,
          reason: 'goods_damaged',
        })
      }
      if (parsed.po_line_id) {
        await tx.update(inventoryPurchaseOrderLines)
          .set({ receivedQuantity: sql`${inventoryPurchaseOrderLines.receivedQuantity} + ${usable}` })
          .where(eq(inventoryPurchaseOrderLines.id, parsed.po_line_id))
      }
    }
    await tx.update(inventoryGoodsReceipts).set({ status: 'completed', receivedAt: new Date(), totalAmount: String(total) }).where(eq(inventoryGoodsReceipts.id, receipt.id))
    const poLines = await tx.select().from(inventoryPurchaseOrderLines).where(eq(inventoryPurchaseOrderLines.purchaseOrderId, data.po_id))
    const allReceived = poLines.length > 0 && poLines.every((l: any) => Number(l.receivedQuantity) >= Number(l.quantity))
    await tx.update(inventoryPurchaseOrders)
      .set({ status: allReceived ? 'received' : 'partially_received', receivedAt: allReceived ? new Date() : undefined })
      .where(eq(inventoryPurchaseOrders.id, data.po_id))
    await logInventoryActivity({ organizationId, action: 'receipt.create', resource: 'goods_receipt', resourceId: receipt.id, metadata: { total } })
    return { ...receipt, lines }
  })
}

export async function createPurchaseReturn(organizationId: string, input: InventoryReturnInput, lines: Omit<InventoryReturnLineInput, 'return_id'>[]) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:return')
  const user = await getCurrentUser()
  const data = inventoryReturnSchema.parse(input)
  return await db.transaction(async (tx) => {
    const [ret] = await tx.insert(inventoryPurchaseReturns).values({
      returnNumber: data.return_number,
      poId: data.po_id ?? null,
      supplierId: data.supplier_id,
      warehouseId: data.warehouse_id,
      reason: data.reason,
      currency: data.currency,
      notes: data.notes || null,
      createdBy: user.id,
      status: 'draft',
      organizationId,
    } as any).returning()
    let total = 0
    for (const line of lines) {
      const parsed = inventoryReturnLineSchema.parse({ ...line, return_id: ret.id })
      const lineTotal = Number(parsed.quantity) * Number(parsed.unit_price ?? 0)
      total += lineTotal
      await tx.insert(inventoryReturnLines).values({
        returnId: parsed.return_id,
        productId: parsed.product_id,
        quantity: parsed.quantity,
        unitPrice: parsed.unit_price,
        reason: parsed.reason || null,
        lineTotal: String(lineTotal),
      } as any)
      await adjustStockAtomic({
        organizationId,
        productId: parsed.product_id,
        warehouseId: data.warehouse_id,
        quantityChange: -Number(parsed.quantity),
        movementType: 'return',
        referenceType: 'return',
        referenceId: ret.id,
        reason: 'return_to_supplier',
      })
    }
    await tx.update(inventoryPurchaseReturns).set({ totalAmount: String(total) }).where(eq(inventoryPurchaseReturns.id, ret.id))
    await logInventoryActivity({ organizationId, action: 'return.create', resource: 'purchase_return', resourceId: ret.id, metadata: { total } })
    return { ...ret, lines }
  })
}

export async function listGoodsReceipts(organizationId: string, opts?: { status?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:receiving')
  const conditions: any[] = [eq(inventoryGoodsReceipts.organizationId, organizationId)]
  if (opts?.status) conditions.push(eq(inventoryGoodsReceipts.status, opts.status))
  return db.select().from(inventoryGoodsReceipts).where(and(...conditions)).orderBy(desc(inventoryGoodsReceipts.createdAt))
}

export async function listPurchaseReturns(organizationId: string, opts?: { status?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:return')
  const conditions: any[] = [eq(inventoryPurchaseReturns.organizationId, organizationId)]
  if (opts?.status) conditions.push(eq(inventoryPurchaseReturns.status, opts.status))
  return db.select().from(inventoryPurchaseReturns).where(and(...conditions)).orderBy(desc(inventoryPurchaseReturns.createdAt))
}

export async function listSuppliersForProduct(organizationId: string, productId: string) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:read')
  return db.execute(sql`
    SELECT sp.supplier_id, sp.supplier_sku, sp.supplier_price, sp.currency,
           sp.minimum_order_quantity, sp.lead_time_days, sp.is_preferred,
           s.supplier_code, s.contact_name, s.rating
    FROM inventory_supplier_products sp
    LEFT JOIN inventory_suppliers s ON s.id = sp.supplier_id
    WHERE sp.organization_id = ${organizationId}
      AND sp.product_id = ${productId}
      AND s.deleted_at IS NULL
    ORDER BY sp.is_preferred DESC, sp.supplier_price ASC
  `)
}

export async function getSupplierById(organizationId: string, supplierId: string) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:read')
  const [supplier] = await db.select().from(inventorySuppliers)
    .where(and(eq(inventorySuppliers.id, supplierId), eq(inventorySuppliers.organizationId, organizationId)))
    .limit(1)
  return supplier ?? null
}
