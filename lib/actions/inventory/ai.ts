'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInventoryTool } from '@/lib/ai/inventory-tools'
import { getDashboardMetrics, getInventoryValuation } from './dashboard'
import { listStockItems, listSuppliers, updateSupplier } from './inventory'
import { listStockMovements, getReorderSuggestions, createStockMovement, createTransfer, createAdjustment, reserveStock, releaseStock, listReservations, createReorderRule, getStockLevel, getAvailableStock } from './stock'
import { listPurchaseOrders, createPurchaseRequest, submitPurchaseRequest, approvePurchaseRequest, createPurchaseOrder, approvePurchaseOrder, sendPurchaseOrder, receiveGoods, createPurchaseReturn, listSuppliersForProduct, getSupplierById, getBackorderedOrders, getPurchaseRequestById, getSupplierPerformance, generateInventoryReport, cancelPurchaseOrder, updatePurchaseOrder, cancelPurchaseRequest, updatePurchaseRequest, approvePurchaseReturn, cancelPurchaseReturn, listPurchaseReturnLines } from './procurement'
import { assignAsset, getProjectMaterialRequirements, getProjectMaterialAvailability } from './assets'
import { createProduct as createFinanceProduct, updateProduct as updateFinanceProduct } from '@/lib/actions/finance/products'

export async function inventoryAIAction(name: string, organizationId: string, args?: Record<string, unknown>) {
  const tool = getInventoryTool(name)
  if (!tool) throw new Error(`Unknown inventory tool: ${name}`)
  if (!organizationId) throw new Error('Organization is required')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const safeArgs = args ?? {}
  if (tool.inputSchema) {
    const parsed = tool.inputSchema.safeParse(safeArgs)
    if (!parsed.success) {
      throw new Error(`Invalid arguments for ${name}: ${parsed.error.issues.map(i => i.message).join('; ')}`)
    }
  }

  const results: Record<string, unknown> = {}

  if (name === 'get_inventory_dashboard') results.data = await getDashboardMetrics(organizationId)
  else if (name === 'get_low_stock_items') results.data = await listStockItems(organizationId, { lowStock: true })
  else if (name === 'get_stock_level') {
    results.data = await getStockLevel(organizationId, String(safeArgs.productId), safeArgs.warehouseId ? String(safeArgs.warehouseId) : undefined)
  }
  else if (name === 'get_available_stock') {
    results.data = await getAvailableStock(organizationId, safeArgs.productId ? String(safeArgs.productId) : undefined)
  }
  else if (name === 'get_stock_movements') {
    results.data = await listStockMovements(organizationId, {
      productId: safeArgs.productId ? String(safeArgs.productId) : undefined,
      warehouseId: safeArgs.warehouseId ? String(safeArgs.warehouseId) : undefined,
      type: safeArgs.type ? String(safeArgs.type) : undefined,
      limit: safeArgs.limit ? Number(safeArgs.limit) : 50,
    })
  }
  else if (name === 'get_reservations') {
    results.data = await listReservations(organizationId, safeArgs.productId ? String(safeArgs.productId) : undefined)
  }
  else if (name === 'get_backordered_orders') {
    results.data = await getBackorderedOrders(organizationId)
  }
  else if (name === 'get_recent_suppliers') {
    const suppliers = await listSuppliers(organizationId)
    results.data = suppliers.slice(0, 15)
  }
  else if (name === 'search_inventory') {
    const opts: any = {}
    if (safeArgs.warehouseId) opts.warehouseId = String(safeArgs.warehouseId)
    if (safeArgs.lowStock) opts.lowStock = true
    if (safeArgs.query) opts.search = String(safeArgs.query)
    results.data = await listStockItems(organizationId, opts)
  }
  else if (name === 'get_reorder_suggestions') results.data = await getReorderSuggestions(organizationId)
  else if (name === 'get_inventory_valuation') results.data = await getInventoryValuation(organizationId)
  else if (name === 'get_purchase_request') {
    const prId = String(safeArgs.id ?? safeArgs.requestId)
    results.data = prId ? await getPurchaseRequestById(organizationId, prId) : null
  }
  else if (name === 'create_purchase_request') results.data = await createPurchaseRequest(organizationId, (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'submit_purchase_request') results.data = await submitPurchaseRequest(organizationId, String(safeArgs?.id ?? safeArgs?.requestId))
  else if (name === 'approve_purchase_request') results.data = await approvePurchaseRequest(organizationId, String(safeArgs?.id ?? safeArgs?.requestId))
  else if (name === 'cancel_purchase_request') results.data = await cancelPurchaseRequest(organizationId, String(safeArgs?.id ?? safeArgs?.requestId))
  else if (name === 'update_purchase_request') results.data = await updatePurchaseRequest(organizationId, String(safeArgs?.id ?? safeArgs?.requestId), (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'create_stock_movement') results.data = await createStockMovement(organizationId, (safeArgs as any)?.input)
  else if (name === 'reserve_stock') results.data = await reserveStock(organizationId, (safeArgs as any)?.input)
  else if (name === 'release_stock') results.data = await releaseStock(organizationId, (safeArgs as any)?.input)
  else if (name === 'adjust_stock') results.data = await createAdjustment(organizationId, (safeArgs as any)?.input)
  else if (name === 'create_transfer' || name === 'transfer_stock') results.data = await createTransfer(organizationId, (safeArgs as any)?.input)
  else if (name === 'create_reorder_rule') results.data = await createReorderRule(organizationId, (safeArgs as any)?.input)
  else if (name === 'create_purchase_order') results.data = await createPurchaseOrder(organizationId, (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'update_purchase_order') results.data = await updatePurchaseOrder(organizationId, String(safeArgs?.id ?? safeArgs?.poId), (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'approve_purchase_order') results.data = await approvePurchaseOrder(organizationId, String(safeArgs?.id ?? safeArgs?.poId))
  else if (name === 'send_purchase_order') results.data = await sendPurchaseOrder(organizationId, String(safeArgs?.id ?? safeArgs?.poId))
  else if (name === 'cancel_purchase_order') results.data = await cancelPurchaseOrder(organizationId, String(safeArgs?.id ?? safeArgs?.poId))
  else if (name === 'receive_goods') results.data = await receiveGoods(organizationId, (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'create_purchase_return') results.data = await createPurchaseReturn(organizationId, (safeArgs as any)?.input, (safeArgs as any)?.lines)
  else if (name === 'approve_purchase_return') results.data = await approvePurchaseReturn(organizationId, String(safeArgs?.id ?? safeArgs?.returnId))
  else if (name === 'cancel_purchase_return') results.data = await cancelPurchaseReturn(organizationId, String(safeArgs?.id ?? safeArgs?.returnId))
  else if (name === 'get_purchase_return_lines') results.data = await listPurchaseReturnLines(organizationId, String(safeArgs?.id ?? safeArgs?.returnId))
  else if (name === 'create_asset_assignment') results.data = await assignAsset(organizationId, (safeArgs as any)?.input)
  else if (name === 'get_supplier') results.data = await getSupplierById(organizationId, String(safeArgs?.id ?? safeArgs?.supplierId))
  else if (name === 'update_supplier') results.data = await updateSupplier(organizationId, String(safeArgs?.id ?? safeArgs?.supplierId), (safeArgs as any)?.input)
  else if (name === 'find_suppliers_for_product' || name === 'get_supplier_pricing') {
    results.data = await listSuppliersForProduct(organizationId, String(safeArgs?.productId))
  }
  else if (name === 'get_supplier_performance') {
    results.data = await getSupplierPerformance(organizationId, String(safeArgs?.supplierId))
  }
  else if (name === 'get_project_material_requirements') {
    results.data = await getProjectMaterialRequirements(organizationId, String(safeArgs?.projectId))
  }
  else if (name === 'get_project_material_availability') {
    results.data = await getProjectMaterialAvailability(organizationId, String(safeArgs?.projectId))
  }
  else if (name === 'generate_inventory_report') {
    results.data = await generateInventoryReport(organizationId)
  }
  else if (name === 'create_product') {
    results.data = await createFinanceProduct({ ...(safeArgs.input as any), organizationId })
  }
  else if (name === 'update_product') {
    const input = safeArgs.input as any
    await updateFinanceProduct(String(input.id), input)
    results.data = { success: true }
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