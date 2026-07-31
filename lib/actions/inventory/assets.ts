'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  inventoryAssetAssignments,
  inventoryProjectAllocations,
} from '@/db/schema/inventory'
import {
  inventoryAssetAssignmentSchema,
  inventoryProjectAllocationSchema,
  type InventoryAssetAssignmentInput,
  type InventoryProjectAllocationInput,
} from '@/lib/utils/validations'
import { getCurrentUser, guardInventoryPermission, logInventoryActivity } from './utils'
import { adjustStockAtomic } from './inventory'

export async function listAssetAssignments(organizationId: string, opts?: { employeeId?: string; status?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:assets:manage')
  const conditions: any[] = [eq(inventoryAssetAssignments.organizationId, organizationId)]
  if (opts?.employeeId) conditions.push(eq(inventoryAssetAssignments.employeeId, opts.employeeId))
  if (opts?.status) conditions.push(eq(inventoryAssetAssignments.status, opts.status))
  return db.select().from(inventoryAssetAssignments).where(and(...conditions)).orderBy(desc(inventoryAssetAssignments.assignedDate))
}

export async function assignAsset(organizationId: string, input: InventoryAssetAssignmentInput) {
  await guardInventoryPermission(organizationId, 'inventory:assets:manage')
  const user = await getCurrentUser()
  const data = inventoryAssetAssignmentSchema.parse(input)
  const [assignment] = await db.insert(inventoryAssetAssignments).values({
    productId: data.product_id,
    employeeId: data.employee_id,
    serialNumber: data.serial_number || null,
    assignedDate: data.assigned_date,
    returnDate: data.return_date || null,
    notes: data.notes || null,
    status: 'assigned',
    assignedBy: user.id,
    organizationId,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'asset.assign', resource: 'asset_assignment', resourceId: assignment.id, metadata: { employeeId: data.employee_id, productId: data.product_id } })
  return assignment
}

export async function returnAsset(organizationId: string, assignmentId: string) {
  await guardInventoryPermission(organizationId, 'inventory:assets:manage')
  const user = await getCurrentUser()
  await db.update(inventoryAssetAssignments)
    .set({ status: 'returned', returnDate: new Date().toISOString().slice(0, 10) })
    .where(and(eq(inventoryAssetAssignments.id, assignmentId), eq(inventoryAssetAssignments.organizationId, organizationId)))
  await logInventoryActivity({ organizationId, action: 'asset.return', resource: 'asset_assignment', resourceId: assignmentId, metadata: { by: user.id } })
  return { success: true }
}

export async function listProjectAllocations(organizationId: string, projectId?: string) {
  await guardInventoryPermission(organizationId, 'inventory:projects:manage')
  const conditions: any[] = [eq(inventoryProjectAllocations.organizationId, organizationId)]
  if (projectId) conditions.push(eq(inventoryProjectAllocations.projectId, projectId))
  return db.select().from(inventoryProjectAllocations).where(and(...conditions)).orderBy(desc(inventoryProjectAllocations.createdAt))
}

export async function createProjectAllocation(organizationId: string, input: InventoryProjectAllocationInput) {
  await guardInventoryPermission(organizationId, 'inventory:projects:manage')
  const user = await getCurrentUser()
  const data = inventoryProjectAllocationSchema.parse(input)
  const [allocation] = await db.insert(inventoryProjectAllocations).values({
    projectId: data.project_id,
    productId: data.product_id,
    requiredQuantity: data.required_quantity,
    allocatedQuantity: String(data.allocated_quantity),
    consumedQuantity: String(data.consumed_quantity),
    status: 'pending',
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'project_allocation.create', resource: 'project_allocation', resourceId: allocation.id, metadata: { projectId: data.project_id, productId: data.product_id } })
  return allocation
}

async function defaultWarehouseId(organizationId: string) {
  const rows = await db.execute(sql`
    SELECT id FROM inventory_warehouses
    WHERE organization_id = ${organizationId} AND deleted_at IS NULL
    ORDER BY is_default DESC, is_active DESC, created_at ASC
    LIMIT 1
  `)
  return (rows as any[])[0]?.id ?? null
}

export async function allocateStockForProject(organizationId: string, allocationId: string, quantity: number) {
  await guardInventoryPermission(organizationId, 'inventory:stock:reserve')
  const [allocation] = await db.select().from(inventoryProjectAllocations)
    .where(and(eq(inventoryProjectAllocations.id, allocationId), eq(inventoryProjectAllocations.organizationId, organizationId)))
    .limit(1)
  if (!allocation) throw new Error('Allocation not found')
  const remaining = Number(allocation.requiredQuantity) - Number(allocation.allocatedQuantity)
  if (quantity > remaining) throw new Error(`Cannot allocate more than the remaining required quantity (${remaining})`)
  const warehouseId = await defaultWarehouseId(organizationId)
  if (!warehouseId) throw new Error('No warehouse available for allocation')
  const result = await adjustStockAtomic({
    organizationId,
    productId: allocation.productId,
    warehouseId,
    quantityChange: quantity,
    movementType: 'reservation',
    referenceType: 'project',
    referenceId: allocation.projectId,
    reason: 'project_material_reservation',
  })
  const newAllocated = Number(allocation.allocatedQuantity) + quantity
  await db.update(inventoryProjectAllocations)
    .set({ allocatedQuantity: String(newAllocated), status: newAllocated >= Number(allocation.requiredQuantity) ? 'fulfilled' : 'partial' })
    .where(eq(inventoryProjectAllocations.id, allocationId))
  await logInventoryActivity({ organizationId, action: 'project_allocation.reserve', resource: 'project_allocation', resourceId: allocationId, metadata: { quantity, warehouseId } })
  return { success: true, inventoryItemId: result?.id }
}

export async function releaseProjectAllocation(organizationId: string, allocationId: string, quantity: number) {
  await guardInventoryPermission(organizationId, 'inventory:stock:reserve')
  const [allocation] = await db.select().from(inventoryProjectAllocations)
    .where(and(eq(inventoryProjectAllocations.id, allocationId), eq(inventoryProjectAllocations.organizationId, organizationId)))
    .limit(1)
  if (!allocation) throw new Error('Allocation not found')
  const qty = Math.min(quantity, Number(allocation.allocatedQuantity))
  const warehouseId = await defaultWarehouseId(organizationId)
  if (!warehouseId) throw new Error('No warehouse available for release')
  await adjustStockAtomic({
    organizationId,
    productId: allocation.productId,
    warehouseId,
    quantityChange: qty,
    movementType: 'release',
    referenceType: 'project',
    referenceId: allocation.projectId,
    reason: 'project_material_release',
  })
  const newAllocated = Number(allocation.allocatedQuantity) - qty
  await db.update(inventoryProjectAllocations)
    .set({ allocatedQuantity: String(newAllocated), status: newAllocated <= 0 ? 'pending' : (newAllocated >= Number(allocation.requiredQuantity) ? 'fulfilled' : 'partial') })
    .where(eq(inventoryProjectAllocations.id, allocationId))
  await logInventoryActivity({ organizationId, action: 'project_allocation.release', resource: 'project_allocation', resourceId: allocationId, metadata: { quantity: qty } })
  return { success: true }
}

export async function getProjectMaterialRequirements(organizationId: string, projectId: string) {
  await guardInventoryPermission(organizationId, 'inventory:projects:view')
  return db.execute(sql`
    SELECT a.id, a.product_id, a.required_quantity, a.allocated_quantity, a.consumed_quantity, a.status,
           COALESCE(SUM(i.quantity_on_hand - i.reserved_quantity), 0)::numeric AS available_inventory,
           p.name AS product_name
    FROM inventory_project_allocations a
    LEFT JOIN finance_products p ON p.id = a.product_id
    LEFT JOIN inventory_items i ON i.product_id = a.product_id AND i.organization_id = a.organization_id AND i.deleted_at IS NULL
    WHERE a.organization_id = ${organizationId} AND a.project_id = ${projectId}
    GROUP BY a.id, a.product_id, a.required_quantity, a.allocated_quantity, a.consumed_quantity, a.status, p.name
  `)
}

export async function getProjectMaterialAvailability(organizationId: string, projectId: string) {
  await guardInventoryPermission(organizationId, 'inventory:projects:view')
  return db.execute(sql`
    SELECT a.id, a.product_id, a.required_quantity,
           COALESCE(SUM(i.quantity_on_hand - i.reserved_quantity), 0)::numeric AS available_inventory,
           (COALESCE(SUM(i.quantity_on_hand - i.reserved_quantity), 0) - COALESCE(a.required_quantity, 0))::numeric AS shortfall
    FROM inventory_project_allocations a
    LEFT JOIN inventory_items i ON i.product_id = a.product_id AND i.organization_id = a.organization_id AND i.deleted_at IS NULL
    WHERE a.organization_id = ${organizationId} AND a.project_id = ${projectId}
    GROUP BY a.id, a.product_id, a.required_quantity
  `)
}
