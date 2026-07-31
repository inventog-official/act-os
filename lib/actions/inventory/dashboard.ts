'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { inventoryItems } from '@/db/schema/inventory'
import { guardInventoryPermission } from './utils'

export async function getDashboardMetrics(organizationId: string) {
  await guardInventoryPermission(organizationId, 'inventory:dashboard:view')
  const metrics = await db.execute(sql`
    SELECT
      COALESCE(SUM(i.quantity_on_hand), 0)::numeric as total_quantity,
      COALESCE(SUM(i.quantity_on_hand * i.unit_cost), 0)::numeric as total_value,
      COUNT(*) FILTER (WHERE i.available_quantity <= COALESCE(r.reorder_point, 0)) as low_stock_count,
      COUNT(*) FILTER (WHERE i.quantity_on_hand::numeric <= 0) as out_of_stock_count,
      COUNT(DISTINCT i.product_id) as tracked_products
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
    WHERE i.organization_id = ${organizationId} AND i.deleted_at IS NULL
  `)
  const lowStock = await db.execute(sql`
    SELECT i.product_id, i.available_quantity::numeric as available, r.reorder_point::numeric as reorder_point
    FROM inventory_items i
    LEFT JOIN (
      SELECT DISTINCT ON (product_id) product_id, reorder_point
      FROM inventory_reorder_rules
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY product_id, created_at DESC
    ) r ON r.product_id = i.product_id
    WHERE i.organization_id = ${organizationId} AND i.deleted_at IS NULL
      AND i.available_quantity <= COALESCE(r.reorder_point, 0)
    ORDER BY i.available_quantity ASC
    LIMIT 10
  `)
  const recentActivity = await db.execute(sql`
    SELECT action, resource, resource_id, created_at
    FROM inventory_activities
    WHERE organization_id = ${organizationId}
    ORDER BY created_at DESC
    LIMIT 15
  `)
  return { metrics: (metrics as any[])[0] ?? {}, lowStock: lowStock ?? [], recentActivity: recentActivity ?? [] }
}

export async function getInventoryValuation(organizationId: string) {
  await guardInventoryPermission(organizationId, 'inventory:valuation:manage')
  const rows = await db.execute(sql`
    SELECT
      SUM(quantity_on_hand * unit_cost)::numeric as total_value,
      SUM(quantity_on_hand * average_cost)::numeric as total_value_avg,
      COUNT(*) as item_count
    FROM inventory_items
    WHERE organization_id = ${organizationId} AND deleted_at IS NULL
  `)
  const row = (rows as any[])[0] ?? {}
  return { totalValue: row.total_value ?? 0, totalValueAvg: row.total_value_avg ?? 0, itemCount: Number(row.item_count ?? 0) }
}
