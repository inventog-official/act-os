'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInventoryTool } from '@/lib/ai/inventory-tools'
import { getDashboardMetrics, getInventoryValuation } from './dashboard'
import { listStockItems, listSuppliers } from './inventory'
import { listStockMovements, getReorderSuggestions, createStockMovement, createTransfer, createAdjustment, reserveStock, releaseStock, listReservations, createReorderRule } from './stock'
import { listPurchaseOrders, listPurchaseRequests, createPurchaseRequest, submitPurchaseRequest, approvePurchaseRequest, createPurchaseOrder, approvePurchaseOrder, sendPurchaseOrder, receiveGoods, createPurchaseReturn, listSuppliersForProduct, getSupplierById } from './procurement'
import { assignAsset, getProjectMaterialRequirements, getProjectMaterialAvailability } from './assets'

export async function inventoryAIAction(name: string, organizationId: string, args?: Record<string, unknown>) {
  const tool = getInventoryTool(name)
  if (!tool) throw new Error(`Unknown inventory tool: ${name}`)
  if (!organizationId) throw new Error('Organization is required')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (tool.requiresApproval && tool.risk !== 'low') {
    return {
      requiresApproval: true,
      tool: name,
      risk: tool.risk,
      message: 'This action requires approval before execution.',
    }
  }

  const results: Record<string, unknown> = {}

  if (name === 'get_inventory_dashboard') results.data = await getDashboardMetrics(organizationId)
  else if (name === 'get_low_stock_items') results.data = await listStockItems(organizationId, { lowStock: true })
  else if (name === 'get_stock_level') {
    const items = await listStockItems(organizationId, { warehouseId: args?.warehouseId ? String(args.warehouseId) : undefined })
    const productId = args?.productId ? String(args.productId) : undefined
    results.data = productId
      ? items.filter((i: any) => String(i.productId ?? i.product_id) === productId)
      : items
  }
  else if (name === 'get_available_stock') {
    const items = await listStockItems(organizationId)
    const productId = args?.productId ? String(args.productId) : undefined
    const rows = productId ? items.filter((i: any) => String(i.productId ?? i.product_id) === productId) : items
    results.data = rows.map((i: any) => ({
      product_id: i.productId ?? i.product_id,
      warehouse_id: i.warehouseId ?? i.warehouse_id,
      quantity_on_hand: i.quantityOnHand ?? i.quantity_on_hand,
      reserved_quantity: i.reservedQuantity ?? i.reserved_quantity,
      available_quantity: i.availableQuantity ?? i.available_quantity,
    }))
  }
  else if (name === 'get_stock_movements') {
    results.data = await listStockMovements(organizationId, {
      productId: args?.productId ? String(args.productId) : undefined,
      warehouseId: args?.warehouseId ? String(args.warehouseId) : undefined,
      type: args?.type ? String(args.type) : undefined,
      limit: args?.limit ? Number(args.limit) : 50,
    })
  }
  else if (name === 'get_reservations') {
    results.data = await listReservations(organizationId, args?.productId ? String(args.productId) : undefined)
  }
  else if (name === 'get_backordered_orders') {
    const po = await listPurchaseOrders(organizationId, { status: 'sent' })
    results.data = po.map((p: any) => ({ id: p.id, po_number: p.poNumber, status: p.status, supplier_id: p.supplierId, total_amount: p.totalAmount }))
  }
  else if (name === 'get_recent_suppliers') {
    const suppliers = await listSuppliers(organizationId)
    results.data = suppliers.slice(0, 15)
  }
  else if (name === 'search_inventory') {
    const opts: any = {}
    if (args?.warehouseId) opts.warehouseId = String(args.warehouseId)
    if (args?.lowStock) opts.lowStock = true
    results.data = await listStockItems(organizationId, opts)
  }
  else if (name === 'get_reorder_suggestions') results.data = await getReorderSuggestions(organizationId)
  else if (name === 'get_inventory_valuation') results.data = await getInventoryValuation(organizationId)
  else if (name === 'get_purchase_request') {
    const prs = await listPurchaseRequests(organizationId)
    if (args?.id) results.data = prs.find((p: any) => p.id === args.id) ?? null
    else results.data = prs[0] ?? null
  }
  else if (name === 'create_purchase_request') results.data = await createPurchaseRequest(organizationId, (args as any)?.input, (args as any)?.lines)
  else if (name === 'submit_purchase_request') results.data = await submitPurchaseRequest(organizationId, String(args?.id ?? args?.requestId))
  else if (name === 'approve_purchase_request') results.data = await approvePurchaseRequest(organizationId, String(args?.id ?? args?.requestId))
  else if (name === 'create_stock_movement') results.data = await createStockMovement(organizationId, (args as any)?.input)
  else if (name === 'reserve_stock') results.data = await reserveStock(organizationId, (args as any)?.input)
  else if (name === 'release_stock') results.data = await releaseStock(organizationId, (args as any)?.input)
  else if (name === 'adjust_stock') results.data = await createAdjustment(organizationId, (args as any)?.input)
  else if (name === 'create_transfer' || name === 'transfer_stock') results.data = await createTransfer(organizationId, (args as any)?.input)
  else if (name === 'create_reorder_rule') results.data = await createReorderRule(organizationId, (args as any)?.input)
  else if (name === 'create_purchase_order') results.data = await createPurchaseOrder(organizationId, (args as any)?.input, (args as any)?.lines)
  else if (name === 'approve_purchase_order') results.data = await approvePurchaseOrder(organizationId, String(args?.id ?? args?.poId))
  else if (name === 'send_purchase_order') results.data = await sendPurchaseOrder(organizationId, String(args?.id ?? args?.poId))
  else if (name === 'receive_goods') results.data = await receiveGoods(organizationId, (args as any)?.input, (args as any)?.lines)
  else if (name === 'create_purchase_return') results.data = await createPurchaseReturn(organizationId, (args as any)?.input, (args as any)?.lines)
  else if (name === 'create_asset_assignment') results.data = await assignAsset(organizationId, (args as any)?.input)
  else if (name === 'get_supplier') results.data = await getSupplierById(organizationId, String(args?.id ?? args?.supplierId))
  else if (name === 'find_suppliers_for_product' || name === 'get_supplier_pricing') {
    results.data = await listSuppliersForProduct(organizationId, String(args?.productId))
  }
  else if (name === 'get_project_material_requirements') {
    results.data = await getProjectMaterialRequirements(organizationId, String(args?.projectId))
  }
  else if (name === 'get_project_material_availability') {
    results.data = await getProjectMaterialAvailability(organizationId, String(args?.projectId))
  }
  else if (name === 'generate_inventory_report') {
    const [dashboard, valuation, lowStock, movements] = await Promise.all([
      getDashboardMetrics(organizationId),
      getInventoryValuation(organizationId),
      listStockItems(organizationId, { lowStock: true }),
      listStockMovements(organizationId, { limit: 20 }),
    ])
    results.data = { metrics: dashboard.metrics, valuation, lowStock, recentMovements: movements }
  }
  else if (name === 'get_supplier_performance') {
    const suppliers = await listSuppliers(organizationId)
    results.data = suppliers.map((s: any) => ({ id: s.id, supplierCode: s.supplierCode, rating: s.rating, ratingCount: s.ratingCount, leadTimeDays: s.leadTimeDays, isPreferred: s.isPreferred }))
  }
  else throw new Error(`Unsupported inventory tool: ${name}`)

  return { ...results, tool: name, audited: tool.audited, reversible: tool.reversible }
}

export async function inventoryAssistantAnswer(question: string, organizationId: string) {
  const q = question.toLowerCase()
  const dashboard = await getDashboardMetrics(organizationId)
  const metrics = (dashboard.metrics as any) ?? {}
  const totalValue = Number(metrics.total_value ?? 0)
  const lowStockCount = Number(metrics.low_stock_count ?? 0)
  const outOfStock = Number(metrics.out_of_stock_count ?? 0)

  if (q.includes('low stock') || q.includes('reorder') || q.includes('running low')) {
    const suggestions = await getReorderSuggestions(organizationId)
    return {
      answer: `You have ${suggestions.length} items below their reorder point requiring replenishment.`,
      data: { lowStockCount, suggestions },
    }
  }

  if (q.includes('value') || q.includes('worth') || q.includes('valuation')) {
    return {
      answer: `Your total inventory is valued at ${totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`,
      data: { totalValue },
    }
  }

  if (q.includes('out of stock') || q.includes('stockout')) {
    return {
      answer: `${outOfStock} products are currently out of stock.`,
      data: { outOfStock },
    }
  }

  if (q.includes('purchase order') || q.includes('po')) {
    const po = await listPurchaseOrders(organizationId)
    return {
      answer: `You have ${po.length} purchase orders in total.`,
      data: { purchaseOrders: po.length },
    }
  }

  return {
    answer: `Your inventory dashboard shows ${metrics.tracked_products ?? 0} tracked products, valued at ${totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}, with ${lowStockCount} low-stock and ${outOfStock} out-of-stock items.`,
    data: metrics,
  }
}