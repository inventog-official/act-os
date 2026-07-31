'use server'

import { and, asc, desc, eq, isNull, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  inventoryItems,
  inventoryStockMovements,
  inventoryReservations,
  inventoryTransfers,
  inventoryStockAdjustments,
  inventoryReorderRules,
} from '@/db/schema/inventory'
import {
  inventoryStockMovementSchema,
  inventoryTransferSchema,
  inventoryStockAdjustmentSchema,
  inventoryReorderRuleSchema,
  inventoryReservationSchema,
  type InventoryStockMovementInput,
  type InventoryTransferInput,
  type InventoryStockAdjustmentInput,
  type InventoryReorderRuleInput,
  type InventoryReservationInput,
} from '@/lib/utils/validations'
import { getCurrentUser, guardInventoryPermission, logInventoryActivity } from './utils'
import { adjustStockAtomic } from './inventory'

export async function listStockMovements(organizationId: string, opts?: { productId?: string; warehouseId?: string; type?: string; limit?: number }) {
  await guardInventoryPermission(organizationId, 'inventory:stock:read')
  const conditions: any[] = [eq(inventoryStockMovements.organizationId, organizationId)]
  if (opts?.productId) conditions.push(eq(inventoryStockMovements.productId, opts.productId))
  if (opts?.warehouseId) conditions.push(eq(inventoryStockMovements.warehouseId, opts.warehouseId))
  if (opts?.type) conditions.push(eq(inventoryStockMovements.movementType, opts.type))
  return db.select()
    .from(inventoryStockMovements)
    .where(and(...conditions))
    .orderBy(desc(inventoryStockMovements.createdAt))
    .limit(opts?.limit ?? 100)
}

export async function createStockMovement(organizationId: string, input: InventoryStockMovementInput) {
  await guardInventoryPermission(organizationId, 'inventory:stock:adjust')
  const data = inventoryStockMovementSchema.parse(input)
  const result = await adjustStockAtomic({
    organizationId,
    productId: data.product_id,
    warehouseId: data.warehouse_id,
    quantityChange: data.quantity,
    movementType: data.movement_type,
    locationId: data.location_id ?? null,
    referenceType: data.reference_type ?? null,
    referenceId: data.reference_id ?? null,
    reason: data.reason ?? null,
    notes: data.notes ?? null,
  })
  await logInventoryActivity({
    organizationId,
    action: `movement.${data.movement_type}`,
    resource: 'movement',
    resourceId: result?.id ?? null,
    metadata: { productId: data.product_id, quantity: data.quantity },
  })
  return result
}

export async function listTransfers(organizationId: string, opts?: { status?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:stock:transfer')
  const conditions: any[] = [eq(inventoryTransfers.organizationId, organizationId)]
  if (opts?.status) conditions.push(eq(inventoryTransfers.status, opts.status))
  return db.select().from(inventoryTransfers).where(and(...conditions)).orderBy(desc(inventoryTransfers.createdAt))
}

export async function createTransfer(organizationId: string, input: InventoryTransferInput) {
  await guardInventoryPermission(organizationId, 'inventory:stock:transfer')
  const data = inventoryTransferSchema.parse(input)
  const user = await getCurrentUser()

  return await db.transaction(async (tx) => {
    const transferNumber = data.transfer_number
    const [transfer] = await tx.insert(inventoryTransfers).values({
      transferNumber,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      sourceLocationId: data.source_location_id ?? null,
      destinationWarehouseId: data.destination_warehouse_id,
      destinationLocationId: data.destination_location_id ?? null,
      quantity: data.quantity,
      notes: data.notes ?? null,
      requestedBy: user.id,
      status: 'pending',
      organizationId,
    } as any).returning()

    await adjustStockAtomic({
      organizationId,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      quantityChange: -data.quantity,
      movementType: 'transfer',
      locationId: data.source_location_id ?? null,
      referenceType: 'transfer',
      referenceId: transfer.id,
      reason: 'stock_transfer_out',
    })

    await logInventoryActivity({
      organizationId,
      action: 'transfer.create',
      resource: 'transfer',
      resourceId: transfer.id,
      metadata: { productId: data.product_id, quantity: data.quantity, destination: data.destination_warehouse_id },
    })
    return transfer
  })
}

export async function receiveTransfer(organizationId: string, transferId: string) {
  await guardInventoryPermission(organizationId, 'inventory:stock:transfer')
  const transfer = (await db.select().from(inventoryTransfers)
    .where(and(eq(inventoryTransfers.id, transferId), eq(inventoryTransfers.organizationId, organizationId)))
    .limit(1))[0]
  if (!transfer) throw new Error('Transfer not found')
  if (transfer.status === 'received') throw new Error('Transfer already received')
  await db.update(inventoryTransfers)
    .set({ receivedQuantity: transfer.quantity, status: 'received', receivedBy: (await getCurrentUser()).id, receivedAt: new Date() })
    .where(eq(inventoryTransfers.id, transferId))
  await adjustStockAtomic({
    organizationId,
    productId: transfer.productId,
    warehouseId: transfer.destinationWarehouseId,
    quantityChange: Number(transfer.quantity),
    movementType: 'transfer',
    locationId: transfer.destinationLocationId ?? null,
    referenceType: 'transfer',
    referenceId: transfer.id,
    reason: 'stock_transfer_in',
  })
  await logInventoryActivity({ organizationId, action: 'transfer.receive', resource: 'transfer', resourceId: transferId, metadata: { quantity: transfer.quantity } })
  return { success: true }
}

export async function listReservations(organizationId: string, productId?: string) {
  await guardInventoryPermission(organizationId, 'inventory:stock:reserve')
  const conditions: any[] = [eq(inventoryReservations.organizationId, organizationId), ne(inventoryReservations.status, 'cancelled')]
  if (productId) conditions.push(eq(inventoryReservations.productId, productId))
  return db.select().from(inventoryReservations).where(and(...conditions)).orderBy(desc(inventoryReservations.createdAt))
}

export async function reserveStock(organizationId: string, input: InventoryReservationInput) {
  await guardInventoryPermission(organizationId, 'inventory:stock:reserve')
  const user = await getCurrentUser()
  const data = inventoryReservationSchema.parse(input)
  return await db.transaction(async (tx) => {
    const result = await adjustStockAtomic({
      organizationId,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      quantityChange: data.quantity,
      movementType: 'reservation',
      locationId: null,
      referenceType: data.reference_type || 'manual',
      referenceId: data.reference_id ?? null,
      reason: 'stock_reservation',
      notes: data.notes ?? null,
    })
    const [reservation] = await tx.insert(inventoryReservations).values({
      reservationType: data.reservation_type,
      inventoryItemId: result?.id,
      productId: data.product_id,
      quantity: data.quantity,
      status: 'active',
      referenceType: data.reference_type || null,
      referenceId: data.reference_id ?? null,
      notes: data.notes ?? null,
      organizationId,
      createdBy: user.id,
    } as any).returning()
    await logInventoryActivity({
      organizationId, action: 'reservation.create', resource: 'reservation', resourceId: reservation.id,
      metadata: { productId: data.product_id, quantity: data.quantity },
    })
    return reservation
  })
}

export async function releaseStock(organizationId: string, input: InventoryReservationInput) {
  await guardInventoryPermission(organizationId, 'inventory:stock:reserve')
  const user = await getCurrentUser()
  const data = inventoryReservationSchema.parse(input)
  return await db.transaction(async (tx) => {
    const result = await adjustStockAtomic({
      organizationId,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      quantityChange: data.quantity,
      movementType: 'release',
      locationId: null,
      referenceType: data.reference_type || 'manual',
      referenceId: data.reference_id ?? null,
      reason: 'stock_release',
      notes: data.notes ?? null,
    })
    const [reservation] = await tx.insert(inventoryReservations).values({
      reservationType: data.reservation_type,
      inventoryItemId: result?.id,
      productId: data.product_id,
      quantity: data.quantity,
      status: 'cancelled',
      cancelledAt: new Date(),
      referenceType: data.reference_type || null,
      referenceId: data.reference_id ?? null,
      notes: data.notes ?? null,
      organizationId,
      createdBy: user.id,
    } as any).returning()
    await logInventoryActivity({
      organizationId, action: 'reservation.release', resource: 'reservation', resourceId: reservation.id,
      metadata: { productId: data.product_id, quantity: data.quantity },
    })
    return reservation
  })
}

export async function createAdjustment(organizationId: string, input: InventoryStockAdjustmentInput) {
  await guardInventoryPermission(organizationId, 'inventory:stock:adjust')
  const data = inventoryStockAdjustmentSchema.parse(input)
  return await db.transaction(async (tx) => {
    const [item] = await tx.select().from(inventoryItems)
      .where(and(
        eq(inventoryItems.productId, data.product_id),
        eq(inventoryItems.warehouseId, data.warehouse_id),
        eq(inventoryItems.organizationId, organizationId),
      ))
      .limit(1)
    if (!item) throw new Error('Stock item not found')
    const quantityBefore = Number(item.quantityOnHand)
    const quantityAfter = quantityBefore + data.quantity_change
    const [reason] = await tx.insert(inventoryStockAdjustments).values({
      adjustmentNumber: data.adjustment_number,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      locationId: data.location_id ?? null,
      quantityBefore,
      quantityChange: data.quantity_change,
      quantityAfter,
      reason: data.reason,
      notes: data.notes ?? null,
      createdBy: (await getCurrentUser()).id,
      status: 'pending',
      organizationId,
    } as any).returning()
    await adjustStockAtomic({
      organizationId,
      productId: data.product_id,
      warehouseId: data.warehouse_id,
      quantityChange: data.quantity_change,
      movementType: 'adjustment',
      locationId: data.location_id ?? null,
      referenceType: 'adjustment',
      referenceId: reason.id,
      reason: data.reason,
      notes: data.notes ?? null,
    })
    await tx.update(inventoryStockAdjustments).set({ status: 'approved' }).where(eq(inventoryStockAdjustments.id, reason.id))
    await logInventoryActivity({ organizationId, action: 'adjustment.create', resource: 'adjustment', resourceId: reason.id, metadata: { change: data.quantity_change, reason: data.reason } })
    return reason
  })
}

export async function listReorderRules(organizationId: string, opts?: { activeOnly?: boolean; belowPoint?: boolean }) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:reorder:manage')
  const conditions: any[] = [eq(inventoryReorderRules.organizationId, organizationId), isNull(inventoryReorderRules.deletedAt)]
  if (opts?.activeOnly !== false) conditions.push(eq(inventoryReorderRules.isActive, true))
  const rows = await db.select().from(inventoryReorderRules).where(and(...conditions)).orderBy(asc(inventoryReorderRules.productId))
  if (opts?.belowPoint) {
    return rows.filter((r: any) => Number(r.reorderPoint) > 0)
  }
  return rows
}

export async function createReorderRule(organizationId: string, input: InventoryReorderRuleInput) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:reorder:manage')
  const user = await getCurrentUser()
  const data = inventoryReorderRuleSchema.parse(input)
  const [rule] = await db.insert(inventoryReorderRules).values({
    productId: data.product_id,
    warehouseId: data.warehouse_id,
    reorderPoint: data.reorder_point,
    reorderQuantity: data.reorder_quantity,
    maximumStock: data.maximum_stock ?? null,
    isActive: data.is_active ?? true,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'reorder_rule.create', resource: 'reorder_rule', resourceId: rule.id, metadata: { productId: rule.productId, reorderPoint: rule.reorderPoint } })
  return rule
}

export async function getReorderSuggestions(organizationId: string) {
  await guardInventoryPermission(organizationId, 'inventory:procurement:reorder:manage')
  return db.execute(sql`
    WITH current_stock AS (
      SELECT product_id, warehouse_id, SUM(available_quantity) as total_available
      FROM inventory_items
      WHERE organization_id = ${organizationId} AND deleted_at IS NULL
      GROUP BY product_id, warehouse_id
    )
    SELECT r.id, r.product_id, r.warehouse_id, r.reorder_point, r.reorder_quantity,
           COALESCE(c.total_available, 0)::numeric as on_hand
    FROM inventory_reorder_rules r
    LEFT JOIN current_stock c
      ON c.product_id = r.product_id AND c.warehouse_id = r.warehouse_id
    WHERE r.is_active = true AND r.deleted_at IS NULL
      AND (COALESCE(c.total_available, 0) <= r.reorder_point)
  `)
}
