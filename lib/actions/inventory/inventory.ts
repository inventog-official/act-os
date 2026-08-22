'use server'

import { and, asc, eq, ilike, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  inventoryUnits,
  inventoryWarehouses,
  inventoryLocations,
  inventoryItems,
  inventorySuppliers,
  inventorySupplierProducts,
} from '@/db/schema/inventory'
import {
  inventoryUnitSchema,
  inventoryWarehouseSchema,
  inventoryLocationSchema,
  inventorySupplierSchema,
  inventorySupplierUpdateSchema,
  inventorySupplierProductSchema,
  type InventoryUnitInput,
  type InventoryWarehouseInput,
  type InventoryLocationInput,
  type InventorySupplierInput,
  type InventorySupplierProductInput,
} from '@/lib/utils/validations'
import { getCurrentUser, guardInventoryPermission, logInventoryActivity, getOrganizationId } from './utils'

const NOT_DELETED_WAREHOUSE = isNull(inventoryWarehouses.deletedAt)
const NOT_DELETED_SUPPLIER = isNull(inventorySuppliers.deletedAt)
const NOT_DELETED_ITEM = isNull(inventoryItems.deletedAt)

export async function listUnits(organizationId: string) {
  await guardInventoryPermission(organizationId, 'inventory:dashboard:view')
  return db.select().from(inventoryUnits).where(eq(inventoryUnits.organizationId, organizationId))
}

export async function createUnit(organizationId: string, input: InventoryUnitInput) {
  await guardInventoryPermission(organizationId, 'inventory:units:manage')
  const user = await getCurrentUser()
  const data = inventoryUnitSchema.parse(input)
  const [unit] = await db.insert(inventoryUnits).values({
    name: data.name,
    symbol: data.symbol,
    unitType: data.unit_type,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'unit.create', resource: 'unit', resourceId: unit.id, metadata: { name: unit.name } })
  return unit
}

export async function createWarehouse(organizationId: string, input: InventoryWarehouseInput) {
  await guardInventoryPermission(organizationId, 'inventory:warehouses:manage')
  const user = await getCurrentUser()
  const data = inventoryWarehouseSchema.parse(input)
  const [warehouse] = await db.insert(inventoryWarehouses).values({
    code: data.code,
    name: data.name,
    description: data.description || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    isActive: data.is_active ?? true,
    isDefault: data.is_default ?? false,
    workspaceId: data.workspace_id ?? null,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'warehouse.create', resource: 'warehouse', resourceId: warehouse.id, metadata: { code: warehouse.code } })
  return warehouse
}

export async function listWarehouses(organizationId: string, opts?: { search?: string; active?: boolean }) {
  await guardInventoryPermission(organizationId, 'inventory:warehouses:read')
  const conditions: any[] = [eq(inventoryWarehouses.organizationId, organizationId), NOT_DELETED_WAREHOUSE]
  if (opts?.active !== undefined) conditions.push(eq(inventoryWarehouses.isActive, opts.active))
  if (opts?.search) conditions.push(ilike(inventoryWarehouses.code, `%${opts.search}%`))
  return db.select().from(inventoryWarehouses).where(and(...conditions)).orderBy(asc(inventoryWarehouses.code))
}

export async function createLocation(organizationId: string, input: InventoryLocationInput) {
  await guardInventoryPermission(organizationId, 'inventory:warehouses:manage')
  const user = await getCurrentUser()
  const data = inventoryLocationSchema.parse(input)
  const [location] = await db.insert(inventoryLocations).values({
    code: data.code,
    name: data.name,
    description: data.description || null,
    warehouseId: data.warehouse_id,
    rowLocation: data.row_location || null,
    rack: data.rack || null,
    bin: data.bin || null,
    capacity: data.capacity ?? null,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'location.create', resource: 'location', resourceId: location.id, metadata: { code: location.code } })
  return location
}

export async function listLocations(organizationId: string, warehouseId?: string) {
  await guardInventoryPermission(organizationId, 'inventory:warehouses:read')
  const conditions: any[] = [eq(inventoryLocations.organizationId, organizationId)]
  if (warehouseId) conditions.push(eq(inventoryLocations.warehouseId, warehouseId))
  return db.select().from(inventoryLocations).where(and(...conditions)).orderBy(asc(inventoryLocations.code))
}

export async function searchProducts(organizationId: string, opts?: { search?: string; supplierId?: string }) {
  await guardInventoryPermission(organizationId, 'inventory:products:read')
  const supabase = await (await import('@/lib/supabase/server')).createServerSupabaseClient()
  const { data: products, error } = await supabase
    .from('finance_products')
    .select('*')
    .eq('organization_id', organizationId)
  if (error || !products) return []
  const rows = products
  if (opts?.search) {
    const term = opts.search.toLowerCase()
    return rows.filter((p: any) => (p.name?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term)))
  }
  return rows
}

export async function createSupplier(organizationId: string, input: InventorySupplierInput) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:manage')
  const user = await getCurrentUser()
  const data = inventorySupplierSchema.parse(input)
  const [supplier] = await db.insert(inventorySuppliers).values({
    companyId: data.company_id,
    supplierCode: data.supplier_code || null,
    taxNumber: data.tax_number || null,
    paymentTerms: data.payment_terms || null,
    currency: data.currency,
    leadTimeDays: data.lead_time_days,
    contactName: data.contact_name || null,
    contactEmail: data.contact_email || null,
    contactPhone: data.contact_phone || null,
    notes: data.notes || null,
    isPreferred: data.is_preferred ?? false,
    isActive: data.is_active ?? true,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'supplier.create', resource: 'supplier', resourceId: supplier.id, metadata: { companyId: supplier.companyId } })
  return supplier
}

export async function updateSupplier(organizationId: string, supplierId: string, input: Partial<InventorySupplierInput>) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:manage')
  const user = await getCurrentUser()
  const data = inventorySupplierUpdateSchema.parse(input)
  const values: Record<string, unknown> = { updatedAt: new Date() }
  if (data.company_id !== undefined) values.companyId = data.company_id
  if (data.supplier_code !== undefined) values.supplierCode = data.supplier_code || null
  if (data.tax_number !== undefined) values.taxNumber = data.tax_number || null
  if (data.payment_terms !== undefined) values.paymentTerms = data.payment_terms || null
  if (data.currency !== undefined) values.currency = data.currency
  if (data.lead_time_days !== undefined) values.leadTimeDays = data.lead_time_days
  if (data.contact_name !== undefined) values.contactName = data.contact_name || null
  if (data.contact_email !== undefined) values.contactEmail = data.contact_email || null
  if (data.contact_phone !== undefined) values.contactPhone = data.contact_phone || null
  if (data.notes !== undefined) values.notes = data.notes || null
  if (data.is_preferred !== undefined) values.isPreferred = data.is_preferred
  if (data.is_active !== undefined) values.isActive = data.is_active
  const [supplier] = await db.update(inventorySuppliers)
    .set(values)
    .where(and(eq(inventorySuppliers.id, supplierId), eq(inventorySuppliers.organizationId, organizationId)))
    .returning()
  if (!supplier) throw new Error('Supplier not found')
  await logInventoryActivity({ organizationId, action: 'supplier.update', resource: 'supplier', resourceId: supplier.id, metadata: { by: user.id, fields: Object.keys(values) } })
  return supplier
}

export async function listSuppliers(organizationId: string, opts?: { search?: string; preferred?: boolean; active?: boolean }) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:read')
  const conditions: any[] = [eq(inventorySuppliers.organizationId, organizationId), NOT_DELETED_SUPPLIER]
  if (opts?.preferred !== undefined) conditions.push(eq(inventorySuppliers.isPreferred, opts.preferred))
  if (opts?.active !== undefined) conditions.push(eq(inventorySuppliers.isActive, opts.active))
  const rows = await db.select().from(inventorySuppliers).where(and(...conditions)).orderBy(asc(inventorySuppliers.supplierCode))
  if (opts?.search) {
    const term = (opts.search).toLowerCase()
    return rows.filter((s: any) => (s.supplierCode?.toLowerCase().includes(term)) || (s.contactName?.toLowerCase().includes(term)))
  }
  return rows
}

export async function createSupplierProduct(organizationId: string, input: InventorySupplierProductInput) {
  await guardInventoryPermission(organizationId, 'inventory:suppliers:manage')
  const user = await getCurrentUser()
  const data = inventorySupplierProductSchema.parse(input)
  const [sp] = await db.insert(inventorySupplierProducts).values({
    supplierId: data.supplier_id,
    productId: data.product_id,
    supplierSku: data.supplier_sku || null,
    supplierPrice: data.supplier_price,
    currency: data.currency,
    minimumOrderQuantity: data.minimum_order_quantity,
    leadTimeDays: data.lead_time_days,
    isPreferred: data.is_preferred ?? false,
    organizationId,
    createdBy: user.id,
  } as any).returning()
  await logInventoryActivity({ organizationId, action: 'supplier_product.create', resource: 'supplier_product', resourceId: sp.id })
  return sp
}

export async function listStockItems(organizationId: string, opts?: { warehouseId?: string; productId?: string; lowStock?: boolean; search?: string; limit?: number; offset?: number }) {
  await guardInventoryPermission(organizationId, 'inventory:stock:read')
  const conditions: any[] = [sql`i.organization_id = ${organizationId}`, sql`i.deleted_at IS NULL`]
  if (opts?.warehouseId) conditions.push(sql`i.warehouse_id = ${opts.warehouseId}`)
  if (opts?.productId) conditions.push(sql`i.product_id = ${opts.productId}`)
  if (opts?.lowStock) conditions.push(sql`i.available_quantity <= COALESCE(r.reorder_point, 0)`)
  if (opts?.search) conditions.push(sql`(p.name ILIKE ${'%' + opts.search + '%'} OR i.sku ILIKE ${'%' + opts.search + '%'})`)
  const where = sql.join(conditions, sql` AND `)
  const limitClause = opts?.limit ? sql` LIMIT ${opts.limit}` : sql``
  const offsetClause = opts?.offset ? sql` OFFSET ${opts.offset}` : sql``
  const rows = await db.execute(sql`
    SELECT i.*, COALESCE(r.reorder_point, 0)::numeric AS reorder_point, p.name AS product_name
    FROM inventory_items i
    LEFT JOIN LATERAL (
      SELECT rr.reorder_point
      FROM inventory_reorder_rules rr
      WHERE rr.product_id = i.product_id
        AND rr.warehouse_id = i.warehouse_id
        AND rr.is_active = true
        AND rr.deleted_at IS NULL
      ORDER BY rr.created_at DESC
      LIMIT 1
    ) r ON true
    LEFT JOIN finance_products p ON p.id = i.product_id
    WHERE ${where}
    ORDER BY i.product_id ASC${limitClause}${offsetClause}
  `)
  return rows as any[]
}

export async function getStockSummary(organizationId: string) {
  await guardInventoryPermission(organizationId, 'inventory:stock:read')
  const [totals] = await db
    .select({
      totalItems: sql<number>`count(*)`,
      totalValue: sql<number>`COALESCE(sum(${inventoryItems.quantityOnHand} * ${inventoryItems.unitCost}),0)`,
    })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.organizationId, organizationId), NOT_DELETED_ITEM))
  return totals
}

export async function adjustStockAtomic(params: {
  organizationId: string
  productId: string
  warehouseId: string
  quantityChange: number
  movementType: 'receipt' | 'issue' | 'adjustment' | 'return' | 'reservation' | 'release' | 'production' | 'opening_balance' | 'transfer' | 'damage' | 'sale' | 'consumption' | 'correction' | 'allocation'
  locationId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  reason?: string | null
  notes?: string | null
  unitCost?: number | null
}) {
  await guardInventoryPermission(params.organizationId, 'inventory:stock:adjust')
  const user = await getCurrentUser()
  return await db.transaction(async (tx) => {
    const [result] = await tx.execute(sql`
      SELECT * FROM adjust_stock_atomic(
        ${params.productId}::uuid,
        ${params.warehouseId}::uuid,
        ${params.quantityChange},
        ${params.movementType}::text,
        ${params.locationId ?? null}::uuid,
        ${params.referenceType ?? null}::text,
        ${params.referenceId ?? null}::uuid,
        ${params.reason ?? null}::text,
        ${params.notes ?? null}::text,
        ${params.unitCost ?? null}::numeric,
        ${params.organizationId}::uuid,
        ${user.id}::uuid
      )
    `)
    const row = Array.isArray(result) ? result[0] : result
    return {
      id: row?.out_id ?? null,
      productId: row?.out_product_id ?? null,
      warehouseId: row?.out_warehouse_id ?? null,
      quantityOnHand: row?.out_on_hand ?? null,
      reservedQuantity: row?.out_reserved ?? null,
      damagedQuantity: row?.out_damaged ?? null,
      availableQuantity: row?.out_available ?? null,
      unitCost: row?.out_unit_cost ?? null,
      averageCost: row?.out_average_cost ?? null,
      movementId: row?.out_movement_id ?? null,
    }
  })
}

export async function ensureDefaultOrg() {
  return getOrganizationId()
}
