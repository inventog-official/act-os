import { describe, it, expect } from 'vitest'
import {
  inventoryUnitSchema,
  inventoryWarehouseSchema,
  inventoryLocationSchema,
  inventorySupplierSchema,
  inventorySupplierUpdateSchema,
  inventorySupplierProductSchema,
  inventoryStockMovementSchema,
  inventoryTransferSchema,
  inventoryStockAdjustmentSchema,
  inventoryReservationSchema,
  inventoryReorderRuleSchema,
  inventoryPrSchema,
  inventoryPrLineSchema,
  inventoryPoSchema,
  inventoryPoLineSchema,
  inventoryGoodsReceiptSchema,
  inventoryReceiptLineSchema,
  inventoryReturnSchema,
  inventoryReturnLineSchema,
  inventoryProjectAllocationSchema,
  inventoryAssetAssignmentSchema,
} from '@/lib/utils/validations'
import { emptyArgs, productIdArgs, optionalProductArgs, singleIdArgs, writeArgs, writeWithLinesArgs, searchArgs, movementsArgs } from '@/lib/ai/inventory-tools'
import { INVENTORY_TOOLS, getInventoryTool } from '@/lib/ai/inventory-tools'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('inventory unit schema', () => {
  it('accepts a valid unit', () => {
    const r = inventoryUnitSchema.parse({ name: 'Kilogram', symbol: 'kg', unit_type: 'weight' })
    expect(r.name).toBe('Kilogram')
    expect(r.unit_type).toBe('weight')
  })

  it('rejects an empty name', () => {
    expect(() => inventoryUnitSchema.parse({ name: '', symbol: 'kg' })).toThrow()
  })

  it('rejects an invalid unit_type', () => {
    expect(() => inventoryUnitSchema.parse({ name: 'Box', symbol: 'bx', unit_type: 'invalid' })).toThrow()
  })
})

describe('inventory warehouse schema', () => {
  it('accepts a valid warehouse', () => {
    const r = inventoryWarehouseSchema.parse({ code: 'WH-1', name: 'Main Warehouse', is_default: true })
    expect(r.is_default).toBe(true)
  })

  it('rejects missing code', () => {
    expect(() => inventoryWarehouseSchema.parse({ name: 'Main Warehouse' })).toThrow()
  })
})

describe('inventory location schema', () => {
  it('requires a warehouse_id', () => {
    expect(() => inventoryLocationSchema.parse({ code: 'A-01', name: 'Row A' })).toThrow()
    expect(() => inventoryLocationSchema.parse({ code: 'A-01', name: 'Row A', warehouse_id: UUID })).not.toThrow()
  })

  it('rejects a non-positive capacity', () => {
    expect(() => inventoryLocationSchema.parse({ code: 'A-01', name: 'Row A', warehouse_id: UUID, capacity: -5 })).toThrow()
  })
})

describe('inventory supplier schema', () => {
  it('requires a company_id and defaults currency', () => {
    const r = inventorySupplierSchema.parse({ company_id: UUID })
    expect(r.currency).toBe('USD')
  })

  it('rejects an invalid email', () => {
    expect(() => inventorySupplierSchema.parse({ company_id: UUID, contact_email: 'nope' })).toThrow()
  })
})

describe('inventory stock movement schema', () => {
  it('requires positive quantity', () => {
    expect(() => inventoryStockMovementSchema.parse({
      movement_type: 'receipt', product_id: UUID, warehouse_id: UUID, quantity: 0,
    })).toThrow()
    expect(() => inventoryStockMovementSchema.parse({
      movement_type: 'receipt', product_id: UUID, warehouse_id: UUID, quantity: 5,
    })).not.toThrow()
  })

  it('rejects an invalid movement_type', () => {
    expect(() => inventoryStockMovementSchema.parse({
      movement_type: 'teleport', product_id: UUID, warehouse_id: UUID, quantity: 1,
    })).toThrow()
  })
})

describe('inventory transfer schema', () => {
  it('requires distinct warehouses and positive quantity', () => {
    expect(() => inventoryTransferSchema.parse({
      transfer_number: 'TR-1', product_id: UUID, warehouse_id: UUID,
      destination_warehouse_id: UUID, quantity: 0,
    })).toThrow()
    expect(() => inventoryTransferSchema.parse({
      transfer_number: 'TR-1', product_id: UUID, warehouse_id: UUID,
      destination_warehouse_id: UUID, quantity: 10,
    })).not.toThrow()
  })

  it('rejects missing transfer_number', () => {
    expect(() => inventoryTransferSchema.parse({
      product_id: UUID, warehouse_id: UUID, destination_warehouse_id: UUID, quantity: 1,
    })).toThrow()
  })
})

describe('inventory stock adjustment schema', () => {
  it('rejects a zero quantity change', () => {
    expect(() => inventoryStockAdjustmentSchema.parse({
      adjustment_number: 'ADJ-1', product_id: UUID, warehouse_id: UUID, quantity_change: 0, reason: 'Count',
    })).toThrow()
  })

  it('accepts positive changes', () => {
    expect(() => inventoryStockAdjustmentSchema.parse({
      adjustment_number: 'ADJ-1', product_id: UUID, warehouse_id: UUID, quantity_change: 5, reason: 'Count',
    })).not.toThrow()
  })

  it('accepts negative changes (stock reduction)', () => {
    const r = inventoryStockAdjustmentSchema.parse({
      adjustment_number: 'ADJ-2', product_id: UUID, warehouse_id: UUID, quantity_change: -3, reason: 'Damaged stock write-off',
    })
    expect(r.quantity_change).toBe(-3)
  })

  it('rejects missing reason', () => {
    expect(() => inventoryStockAdjustmentSchema.parse({
      adjustment_number: 'ADJ-1', product_id: UUID, warehouse_id: UUID, quantity_change: 1,
    })).toThrow()
  })
})

describe('inventory reorder rule schema', () => {
  it('rejects zero reorder quantity', () => {
    expect(() => inventoryReorderRuleSchema.parse({
      product_id: UUID, warehouse_id: UUID, reorder_point: 5, reorder_quantity: 0,
    })).toThrow()
  })

  it('accepts a valid rule', () => {
    expect(() => inventoryReorderRuleSchema.parse({
      product_id: UUID, warehouse_id: UUID, reorder_point: 5, reorder_quantity: 20, maximum_stock: 100,
    })).not.toThrow()
  })
})

describe('inventory purchase request schemas', () => {
  it('rejects a PR without title or number', () => {
    expect(() => inventoryPrSchema.parse({})).toThrow()
  })

  it('rejects a PR line with zero quantity', () => {
    expect(() => inventoryPrLineSchema.parse({
      request_id: UUID, description: 'Widgets', quantity: 0,
    })).toThrow()
    expect(() => inventoryPrLineSchema.parse({
      request_id: UUID, description: 'Widgets', quantity: 3, unit_price: 10,
    })).not.toThrow()
  })

  it('rejects a PR line without description', () => {
    expect(() => inventoryPrLineSchema.parse({ request_id: UUID, quantity: 1 })).toThrow()
  })
})

describe('inventory purchase order schemas', () => {
  it('rejects a PO without supplier', () => {
    expect(() => inventoryPoSchema.parse({ po_number: 'PO-1' })).toThrow()
  })

  it('defaults financial fields to zero', () => {
    const r = inventoryPoSchema.parse({ po_number: 'PO-1', supplier_id: UUID })
    expect(r.subtotal).toBe(0)
    expect(r.tax_amount).toBe(0)
    expect(r.shipping_cost).toBe(0)
    expect(r.discount_amount).toBe(0)
    expect(r.currency).toBe('USD')
  })

  it('rejects a PO line with zero quantity', () => {
    expect(() => inventoryPoLineSchema.parse({
      purchase_order_id: UUID, product_id: UUID, quantity: 0,
    })).toThrow()
  })
})

describe('inventory goods receipt schemas', () => {
  it('rejects a receipt without required fields', () => {
    expect(() => inventoryGoodsReceiptSchema.parse({})).toThrow()
  })

  it('accepts a complete receipt', () => {
    expect(() => inventoryGoodsReceiptSchema.parse({
      receipt_number: 'GRN-1', po_id: UUID, warehouse_id: UUID, supplier_id: UUID, received_date: '2026-08-01',
    })).not.toThrow()
  })

  it('rejects a receipt line with negative received quantity', () => {
    expect(() => inventoryReceiptLineSchema.parse({
      receipt_id: UUID, product_id: UUID, quantity: 5, received_quantity: -1,
    })).toThrow()
  })
})

describe('inventory return schemas', () => {
  it('rejects a return without reason', () => {
    expect(() => inventoryReturnSchema.parse({
      return_number: 'RET-1', supplier_id: UUID, warehouse_id: UUID,
    })).toThrow()
  })

  it('rejects a return line with zero quantity', () => {
    expect(() => inventoryReturnLineSchema.parse({
      return_id: UUID, product_id: UUID, quantity: 0,
    })).toThrow()
  })
})

describe('inventory project allocation schema', () => {
  it('requires positive required quantity', () => {
    expect(() => inventoryProjectAllocationSchema.parse({
      project_id: UUID, product_id: UUID, required_quantity: 0,
    })).toThrow()
  })
})

describe('inventory reservation schema', () => {
  it('requires product, warehouse and positive quantity', () => {
    expect(() => inventoryReservationSchema.parse({ product_id: UUID, warehouse_id: UUID, quantity: 0 })).toThrow()
    expect(() => inventoryReservationSchema.parse({ product_id: UUID, warehouse_id: UUID, quantity: 5 })).not.toThrow()
  })

  it('defaults reservation_type to internal', () => {
    const r = inventoryReservationSchema.parse({ product_id: UUID, warehouse_id: UUID, quantity: 3 })
    expect(r.reservation_type).toBe('internal')
  })

  it('rejects an invalid reservation_type', () => {
    expect(() => inventoryReservationSchema.parse({
      product_id: UUID, warehouse_id: UUID, quantity: 1, reservation_type: 'bogus',
    })).toThrow()
  })
})

describe('inventory stock movement schema', () => {
  it('accepts damage and sale movement types', () => {
    expect(() => inventoryStockMovementSchema.parse({
      movement_type: 'damage', product_id: UUID, warehouse_id: UUID, quantity: 2,
    })).not.toThrow()
    expect(() => inventoryStockMovementSchema.parse({
      movement_type: 'sale', product_id: UUID, warehouse_id: UUID, quantity: 2,
    })).not.toThrow()
  })
})

describe('inventory asset assignment schema', () => {
  it('rejects assignment without employee or product', () => {
    expect(() => inventoryAssetAssignmentSchema.parse({ assigned_date: '2026-08-01' })).toThrow()
  })

  it('accepts a valid assignment', () => {
    expect(() => inventoryAssetAssignmentSchema.parse({
      product_id: UUID, employee_id: UUID, assigned_date: '2026-08-01', serial_number: 'SN-123',
    })).not.toThrow()
  })
})

describe('inventory supplier update schema', () => {
  it('accepts a partial update', () => {
    const r = inventorySupplierUpdateSchema.parse({ contact_email: 'new@acme.com', lead_time_days: 5 })
    expect(r.contact_email).toBe('new@acme.com')
    expect(r.lead_time_days).toBe(5)
  })

  it('accepts an empty object (no-op update)', () => {
    expect(() => inventorySupplierUpdateSchema.parse({})).not.toThrow()
  })

  it('rejects an invalid email in partial update', () => {
    expect(() => inventorySupplierUpdateSchema.parse({ contact_email: 'not-an-email' })).toThrow()
  })
})

describe('inventory AI tool registry', () => {
  it('exposes every tool via getInventoryTool', () => {
    for (const t of INVENTORY_TOOLS) {
      expect(getInventoryTool(t.name)?.name).toBe(t.name)
    }
  })

  it('defines an input schema for every tool', () => {
    for (const t of INVENTORY_TOOLS) {
      expect(t.inputSchema, `${t.name} must define an inputSchema`).toBeDefined()
    }
  })

  it('does not gate approval actions behind approval', () => {
    for (const t of INVENTORY_TOOLS) {
      if (['approve_purchase_request', 'approve_purchase_order', 'send_purchase_order', 'submit_purchase_request'].includes(t.name)) {
        expect(t.requiresApproval, `${t.name} is itself an approval action`).toBe(false)
      }
    }
  })

  it('includes product management tools', () => {
    expect(getInventoryTool('create_product')).toBeDefined()
    expect(getInventoryTool('update_product')).toBeDefined()
    expect(getInventoryTool('update_supplier')).toBeDefined()
    expect(getInventoryTool('cancel_purchase_order')).toBeDefined()
    expect(getInventoryTool('approve_purchase_return')).toBeDefined()
  })
})

describe('inventory AI tool input schemas', () => {
  it('emptyArgs rejects unexpected keys', () => {
    expect(() => emptyArgs.parse({ productId: 'x' })).toThrow()
    expect(() => emptyArgs.parse({})).not.toThrow()
  })

  it('productIdArgs requires a productId', () => {
    expect(() => productIdArgs.parse({})).toThrow()
    expect(() => productIdArgs.parse({ productId: UUID })).not.toThrow()
  })

  it('optionalProductArgs allows empty or product-only', () => {
    expect(() => optionalProductArgs.parse({})).not.toThrow()
    expect(() => optionalProductArgs.parse({ productId: UUID })).not.toThrow()
  })

  it('singleIdArgs accepts an id in any supported alias', () => {
    expect(() => singleIdArgs.parse({ id: UUID })).not.toThrow()
    expect(() => singleIdArgs.parse({ poId: UUID, supplierId: UUID })).not.toThrow()
    expect(() => singleIdArgs.parse({ requestId: UUID })).not.toThrow()
  })

  it('writeArgs requires an object input', () => {
    expect(() => writeArgs.parse({})).toThrow()
    expect(() => writeArgs.parse({ input: { product_id: UUID, quantity: 5 } })).not.toThrow()
    expect(() => writeArgs.parse({ input: 'not-an-object' })).toThrow()
  })

  it('writeWithLinesArgs requires input and optional lines array', () => {
    expect(() => writeWithLinesArgs.parse({ input: {} })).not.toThrow()
    expect(() => writeWithLinesArgs.parse({ input: {}, lines: [{ product_id: UUID }] })).not.toThrow()
    expect(() => writeWithLinesArgs.parse({ input: {}, lines: 'nope' })).toThrow()
  })

  it('searchArgs accepts query and filters', () => {
    expect(() => searchArgs.parse({ query: 'wrench', lowStock: true, warehouseId: UUID })).not.toThrow()
    expect(() => searchArgs.parse({ lowStock: 'yes' })).toThrow()
  })

  it('movementsArgs constrains limit', () => {
    expect(() => movementsArgs.parse({ limit: 500 })).toThrow()
    expect(() => movementsArgs.parse({ limit: 50, type: 'receipt' })).not.toThrow()
  })
})