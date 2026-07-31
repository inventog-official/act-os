-- ACT OS Phase 7 — Inventory & Procurement
-- Reuses existing entities:
--   crm_companies        -> suppliers (no duplicate company system)
--   finance_products     -> products (no duplicate product system)
--   finance_product_categories -> product categories
--   finance_purchase_orders -> purchase orders (no duplicate PO system)
--   projects             -> project integration
--   hr_employees         -> HR asset integration
--   documents            -> document integration (Phase 6)
--   finance_invoices / finance_expenses -> finance integration
-- Creates inventory-specific tables: warehouses, locations, stock levels,
-- stock movements, stock reservations, purchase requests, goods receiving,
-- purchase order receiving lines, returns, suppliers (link table to enrich
-- crm_companies with supplier metadata + supplier products), units,
-- inventory valuations, adjustment reasons, and audit activity.

-- ============================================================================
-- Helper: atomic stock quantity update (prevents race conditions)
--   Called by movements to adjust on_hand atomically.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.adjust_stock_atomic(p_inventory_id UUID, p_delta NUMERIC)
RETURNS TABLE (inventory_id UUID, new_quantity NUMERIC, new_reserved NUMERIC, new_available NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_delta = 0 THEN
    RETURN QUERY SELECT i.id, i.quantity_on_hand, i.reserved_quantity, i.available_quantity
                 FROM inventory_items i WHERE i.id = p_inventory_id;
    RETURN;
  END IF;
  RETURN QUERY
    UPDATE inventory_items
    SET quantity_on_hand = quantity_on_hand + p_delta,
        available_quantity = GREATEST(0, quantity_on_hand + p_delta - reserved_quantity)
    WHERE id = p_inventory_id
    RETURNING id, quantity_on_hand, reserved_quantity, available_quantity;
END;
$$;
GRANT EXECUTE ON FUNCTION public.adjust_stock_atomic(UUID, NUMERIC) TO anon, authenticated;

-- ============================================================================
-- 1. UNITS OF MEASURE
-- ============================================================================
CREATE TABLE inventory_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'custom' CHECK (unit_type IN ('length','weight','volume','count','custom')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_units_updated_at
  BEFORE UPDATE ON inventory_units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_units_org ON inventory_units(organization_id, deleted_at);

-- Standard units seeded later; allow reuse for finance_products unit column.

-- ============================================================================
-- 2. WAREHOUSES
-- ============================================================================
CREATE TABLE inventory_warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_warehouses_updated_at
  BEFORE UPDATE ON inventory_warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_warehouses_org ON inventory_warehouses(organization_id, deleted_at);
CREATE UNIQUE INDEX uq_inventory_warehouses_org_code ON inventory_warehouses(organization_id, code, deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. LOCATIONS (bin locations within a warehouse)
-- ============================================================================
CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  row_location TEXT,
  rack TEXT,
  bin TEXT,
  capacity NUMERIC(12,2),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_locations_updated_at
  BEFORE UPDATE ON inventory_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_locations_warehouse ON inventory_locations(warehouse_id, deleted_at);
CREATE INDEX idx_inventory_locations_org ON inventory_locations(organization_id, deleted_at);

-- ============================================================================
-- 4. INVENTORY ITEMS (live stock per product per warehouse/location)
-- ============================================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES finance_products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL,
  sku TEXT,
  quantity_on_hand NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reserved_quantity NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  damaged_quantity NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
  available_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  average_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  lot_number TEXT,
  expiry_date DATE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_items_org ON inventory_items(organization_id, deleted_at);
CREATE INDEX idx_inventory_items_product ON inventory_items(organization_id, product_id, deleted_at);
CREATE INDEX idx_inventory_items_warehouse ON inventory_items(organization_id, warehouse_id, deleted_at);
CREATE UNIQUE INDEX uq_inventory_items_org_product_wh ON inventory_items(organization_id, product_id, warehouse_id, location_id, lot_number) WHERE deleted_at IS NULL;

-- ============================================================================
-- 5. STOCK MOVEMENTS (audit trail — every qty change is a movement)
-- ============================================================================
CREATE TABLE inventory_stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase','sale','allocation','transfer','adjustment','return','damage','consumption','correction',
    'opening_balance','receipt','issue','reservation','release','production'
  )),
  product_id UUID NOT NULL REFERENCES finance_products(id),
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  location_id UUID REFERENCES inventory_locations(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity <> 0),
  unit_cost NUMERIC(14,4),
  from_warehouse_id UUID REFERENCES inventory_warehouses(id),
  to_warehouse_id UUID REFERENCES inventory_warehouses(id),
  reference_type TEXT CHECK (reference_type IN ('purchase_order','purchase_request','invoice','project','sale','manual')),
  reference_id UUID,
  reason TEXT,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_movements_org ON inventory_stock_movements(organization_id, created_at DESC);
CREATE INDEX idx_inventory_movements_product ON inventory_stock_movements(organization_id, product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_type ON inventory_stock_movements(organization_id, movement_type, created_at);
CREATE INDEX idx_inventory_movements_created_by ON inventory_stock_movements(organization_id, user_id, created_at DESC);

-- ============================================================================
-- 6. STOCK RESERVATIONS (reserve stock for projects/orders/customers/etc.)
-- ============================================================================
CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('project','order','customer','department','internal')),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','cancelled')),
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('project','order','customer','department')),
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_reservations_org ON inventory_reservations(organization_id, status, created_at DESC);
CREATE INDEX idx_inventory_reservations_item ON inventory_reservations(inventory_item_id);
CREATE INDEX idx_inventory_reservations_ref ON inventory_reservations(reference_type, reference_id) WHERE status='active';

-- ============================================================================
-- 7. STOCK TRANSFERS
-- ============================================================================
CREATE TABLE inventory_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number TEXT,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  source_location_id UUID REFERENCES inventory_locations(id),
  destination_warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id) ON DELETE RESTRICT,
  destination_location_id UUID REFERENCES inventory_locations(id),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  shipped_quantity NUMERIC(12,3) DEFAULT 0,
  received_quantity NUMERIC(12,3) DEFAULT 0,
  unit_cost NUMERIC(14,4),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','shipped','received','cancelled','closed')),
  notes TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_transfers_updated_at
  BEFORE UPDATE ON inventory_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_transfers_org ON inventory_transfers(organization_id, created_at DESC);
CREATE INDEX idx_inventory_transfers_status ON inventory_transfers(organization_id, status);

-- ============================================================================
-- 8. SUPPLIERS (metadata enrichment over crm_companies — no duplicate company system)
-- ============================================================================
CREATE TABLE inventory_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  supplier_code TEXT,
  tax_number TEXT,
  payment_terms TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  lead_time_days INTEGER DEFAULT 0,
  rating NUMERIC(3,2),
  rating_count INTEGER DEFAULT 0,
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_suppliers_updated_at
  BEFORE UPDATE ON inventory_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_suppliers_org ON inventory_suppliers(organization_id, deleted_at);
CREATE INDEX idx_inventory_suppliers_company ON inventory_suppliers(company_id);
CREATE INDEX idx_inventory_suppliers_preferred ON inventory_suppliers(organization_id, is_preferred, lead_time_days);

-- ============================================================================
-- 9. SUPPLIER PRODUCTS (supplier <-> finance_products pricing, MOQ, lead time)
-- ============================================================================
CREATE TABLE inventory_supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES finance_products(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  supplier_price NUMERIC(14,4),
  currency TEXT NOT NULL DEFAULT 'USD',
  minimum_order_quantity NUMERIC(12,3) DEFAULT 1,
  lead_time_days INTEGER DEFAULT 0,
  is_preferred BOOLEAN DEFAULT FALSE,
  last_purchase_price NUMERIC(14,4),
  last_purchase_date DATE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_supplier_products_updated_at
  BEFORE UPDATE ON inventory_supplier_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_supplier_products_supplier ON inventory_supplier_products(supplier_id, deleted_at);
CREATE INDEX idx_inventory_supplier_products_product ON inventory_supplier_products(product_id, deleted_at);
CREATE UNIQUE INDEX uq_supplier_product ON inventory_supplier_products(supplier_id, product_id, deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 10. PURCHASE REQUESTS
-- ============================================================================
CREATE TABLE inventory_purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','manager_approved','procurement_approved','approved','rejected','cancelled','converted')),
  total_amount NUMERIC(14,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_purchase_requests_updated_at
  BEFORE UPDATE ON inventory_purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_pr_org ON inventory_purchase_requests(organization_id, status, created_at DESC);
CREATE UNIQUE INDEX uq_inventory_pr_number ON inventory_purchase_requests(organization_id, request_number);

-- ============================================================================
-- 11. PURCHASE REQUEST LINES
-- ============================================================================
CREATE TABLE inventory_purchase_request_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES inventory_purchase_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES finance_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_id UUID REFERENCES inventory_units(id),
  unit_price NUMERIC(14,4) DEFAULT 0,
  total_price NUMERIC(14,2) DEFAULT 0,
  tax_rate_id UUID REFERENCES finance_tax_rates(id),
  tax_amount NUMERIC(14,2) DEFAULT 0,
  preferred_supplier_id UUID REFERENCES inventory_suppliers(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_prl_request ON inventory_purchase_request_lines(request_id);

-- ============================================================================
-- 12. PURCHASE REQUEST APPROVAL STEPS (configurable workflow chain)
-- ============================================================================
CREATE TABLE inventory_pr_approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES inventory_purchase_requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  role_required TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','skipped')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX idx_inventory_pr_approval_step_req ON inventory_pr_approval_steps(request_id, step_order);

-- ============================================================================
-- 13. PURCHASE ORDERS (inventory PO — reuses finance_purchase_orders for finance)
--     inventory_purchase_orders links to a finance_purchase_orders row for the
--     financial transaction, and stores inventory-specific state.
-- ============================================================================
CREATE TABLE inventory_purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finance_purchase_order_id UUID REFERENCES finance_purchase_orders(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  department_id UUID REFERENCES hr_departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','sent','partially_received','received','cancelled','closed')),
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(14,2) DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  shipping_cost NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  expected_delivery DATE,
  issued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  terms TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_purchase_orders_updated_at
  BEFORE UPDATE ON inventory_purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_po_org ON inventory_purchase_orders(organization_id, status, created_at DESC);
CREATE UNIQUE INDEX uq_inventory_po_number ON inventory_purchase_orders(organization_id, po_number);

-- ============================================================================
-- 14. PURCHASE ORDER LINES
-- ============================================================================
CREATE TABLE inventory_purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES inventory_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  description TEXT,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  received_quantity NUMERIC(12,3) DEFAULT 0 CHECK (received_quantity >= 0),
  unit_id UUID REFERENCES inventory_units(id),
  unit_price NUMERIC(14,4) DEFAULT 0,
  tax_rate_id UUID REFERENCES finance_tax_rates(id),
  tax_amount NUMERIC(14,2) DEFAULT 0,
  line_total NUMERIC(14,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_pol_po ON inventory_purchase_order_lines(purchase_order_id);
CREATE INDEX idx_inventory_pol_product ON inventory_purchase_order_lines(product_id);

-- ============================================================================
-- 15. GOODS RECEIVING
-- ============================================================================
CREATE TABLE inventory_goods_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES inventory_purchase_orders(id),
  receipt_number TEXT NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  location_id UUID REFERENCES inventory_locations(id),
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  received_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  total_amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  received_by UUID NOT NULL REFERENCES auth.users(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_gr_org ON inventory_goods_receipts(organization_id, received_date DESC);
CREATE UNIQUE INDEX uq_inventory_gr_number ON inventory_goods_receipts(organization_id, receipt_number);

CREATE TABLE inventory_receipt_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES inventory_goods_receipts(id) ON DELETE CASCADE,
  po_line_id UUID REFERENCES inventory_purchase_order_lines(id),
  product_id UUID NOT NULL REFERENCES finance_products(id),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,4) DEFAULT 0,
  received_quantity NUMERIC(12,3) NOT NULL CHECK (received_quantity > 0),
  damaged_quantity NUMERIC(12,3) DEFAULT 0,
  missing_quantity NUMERIC(12,3) DEFAULT 0,
  rejected_quantity NUMERIC(12,3) DEFAULT 0,
  line_total NUMERIC(14,2) DEFAULT 0,
  notes TEXT
);
CREATE INDEX idx_inventory_receipt_lines_receipt ON inventory_receipt_lines(receipt_id);

-- ============================================================================
-- 16. PURCHASE RETURNS
-- ============================================================================
CREATE TABLE inventory_purchase_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT NOT NULL,
  po_id UUID REFERENCES inventory_purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id),
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','sent','received','cancelled')),
  total_amount NUMERIC(14,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_returns_org ON inventory_purchase_returns(organization_id, status, created_at DESC);
CREATE UNIQUE INDEX uq_inventory_return_number ON inventory_purchase_returns(organization_id, return_number);

CREATE TABLE inventory_return_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES inventory_purchase_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,4) DEFAULT 0,
  reason TEXT,
  line_total NUMERIC(14,2) DEFAULT 0
);
CREATE INDEX idx_inventory_return_lines_return ON inventory_return_lines(return_id);

-- ============================================================================
-- 17. STOCK ADJUSTMENTS + reasons
-- ============================================================================
CREATE TABLE inventory_adjustment_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_direction TEXT NOT NULL DEFAULT 'adjust' CHECK (default_direction IN ('increase','decrease','adjust')),
  requires_approval BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_adj_reasons_org ON inventory_adjustment_reasons(organization_id);

CREATE TABLE inventory_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  location_id UUID REFERENCES inventory_locations(id),
  quantity_before NUMERIC(12,3) NOT NULL,
  quantity_change NUMERIC(12,3) NOT NULL,
  quantity_after NUMERIC(12,3) NOT NULL,
  reason_id UUID REFERENCES inventory_adjustment_reasons(id),
  reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_adj_org ON inventory_stock_adjustments(organization_id, status, created_at DESC);
CREATE UNIQUE INDEX uq_inventory_adj_number ON inventory_stock_adjustments(organization_id, adjustment_number);

-- ============================================================================
-- 18. REORDER RULES + LOW STOCK ALERTS
-- ============================================================================
CREATE TABLE inventory_reorder_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES finance_products(id),
  warehouse_id UUID NOT NULL REFERENCES inventory_warehouses(id),
  reorder_point NUMERIC(12,3) NOT NULL,
  reorder_quantity NUMERIC(12,3) NOT NULL,
  maximum_stock NUMERIC(12,3),
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_inventory_reorder_rules_updated_at
  BEFORE UPDATE ON inventory_reorder_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_inventory_reorder_org ON inventory_reorder_rules(organization_id, deleted_at);
CREATE INDEX idx_inventory_reorder_product ON inventory_reorder_rules(organization_id, product_id, deleted_at);

-- ============================================================================
-- 19. PROJECT ALLOCATION / MATERIAL REQUIREMENTS
-- ============================================================================
CREATE TABLE inventory_project_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES finance_products(id),
  required_quantity NUMERIC(12,3) NOT NULL,
  allocated_quantity NUMERIC(12,3) DEFAULT 0,
  consumed_quantity NUMERIC(12,3) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','allocated','partial','fulfilled','cancelled')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_projalloc_project ON inventory_project_allocations(project_id);
CREATE INDEX idx_inventory_projalloc_product ON inventory_project_allocations(product_id);
CREATE INDEX idx_inventory_projalloc_status ON inventory_project_allocations(organization_id, status);

-- ============================================================================
-- 20. HR ASSET ASSIGNMENTS
-- ============================================================================
CREATE TABLE inventory_asset_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES finance_products(id),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE RESTRICT,
  serial_number TEXT,
  assigned_date DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','returned','damaged','lost')),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_assets_org ON inventory_asset_assignments(organization_id);
CREATE INDEX idx_inventory_assets_employee ON inventory_asset_assignments(employee_id, status);

-- ============================================================================
-- 21. DOCUMENT INTEGRATION (reuse Phase 6 documents table via relationship)
--     inventory_document_links stores which inventory entity a document relates to.
--     Also links to the documents table (Phase 6) for the actual document.
-- ============================================================================
CREATE TABLE inventory_document_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product','supplier','purchase_order','receipt','return','transfer','adjustment')),
  entity_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_doc_links_doc ON inventory_document_links(document_id);
CREATE INDEX idx_inventory_doc_links_entity ON inventory_document_links(entity_type, entity_id);

-- ============================================================================
-- 22. VALUATION SNAPSHOTS (inventory value over time)
-- ============================================================================
CREATE TABLE inventory_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_date DATE NOT NULL,
  method TEXT NOT NULL DEFAULT 'average' CHECK (method IN ('average','fifo')),
  total_value NUMERIC(14,2) NOT NULL,
  total_cost NUMERIC(14,2),
  total_resale_value NUMERIC(14,2),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_valuations_org ON inventory_valuations(organization_id, valuation_date DESC);
CREATE UNIQUE INDEX uq_inventory_valuations_org_date ON inventory_valuations(organization_id, valuation_date, method);

-- ============================================================================
-- 23. INVENTORY ACTIVITY (audit timeline)
-- ============================================================================
CREATE TABLE inventory_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_activities_org ON inventory_activities(organization_id, created_at DESC);
CREATE INDEX idx_inventory_activities_resource ON inventory_activities(organization_id, resource, created_at DESC);

-- ============================================================================
-- 24. RLS POLICIES
-- ============================================================================
ALTER TABLE inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_request_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_pr_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustment_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reorder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_project_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_activities ENABLE ROW LEVEL SECURITY;

-- Organization isolation: org members can read/write their own org data.
CREATE POLICY "Org members can view inventory_units" ON inventory_units FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage inventory_units" ON inventory_units FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view warehouses" ON inventory_warehouses FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage warehouses" ON inventory_warehouses FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view locations" ON inventory_locations FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage locations" ON inventory_locations FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view inventory_items" ON inventory_items FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage inventory_items" ON inventory_items FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view stock_movements" ON inventory_stock_movements FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can create stock_movements" ON inventory_stock_movements FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view reservations" ON inventory_reservations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage reservations" ON inventory_reservations FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view transfers" ON inventory_transfers FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage transfers" ON inventory_transfers FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view suppliers" ON inventory_suppliers FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage suppliers" ON inventory_suppliers FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view supplier_products" ON inventory_supplier_products FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage supplier_products" ON inventory_supplier_products FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view purchase_requests" ON inventory_purchase_requests FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage purchase_requests" ON inventory_purchase_requests FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view purchase_request_lines" ON inventory_purchase_request_lines FOR SELECT USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_purchase_request_lines.request_id))
);
CREATE POLICY "Org members can manage purchase_request_lines" ON inventory_purchase_request_lines FOR ALL USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_purchase_request_lines.request_id))
) WITH CHECK (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_purchase_request_lines.request_id))
);

CREATE POLICY "Org members can view pr_approval_steps" ON inventory_pr_approval_steps FOR SELECT USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_pr_approval_steps.request_id))
);
CREATE POLICY "Org members can manage pr_approval_steps" ON inventory_pr_approval_steps FOR ALL USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_pr_approval_steps.request_id))
) WITH CHECK (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_requests r WHERE r.id = inventory_pr_approval_steps.request_id))
);

CREATE POLICY "Org members can view purchase_orders" ON inventory_purchase_orders FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage purchase_orders" ON inventory_purchase_orders FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view purchase_order_lines" ON inventory_purchase_order_lines FOR SELECT USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_orders o WHERE o.id = inventory_purchase_order_lines.purchase_order_id))
);

CREATE POLICY "Org members can view goods_receipts" ON inventory_goods_receipts FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage goods_receipts" ON inventory_goods_receipts FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view receipt_lines" ON inventory_receipt_lines FOR SELECT USING (
  public.is_org_member((SELECT organization_id FROM inventory_goods_receipts r WHERE r.id = inventory_receipt_lines.receipt_id))
);

CREATE POLICY "Org members can view purchase_returns" ON inventory_purchase_returns FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage purchase_returns" ON inventory_purchase_returns FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view return_lines" ON inventory_return_lines FOR SELECT USING (
  public.is_org_member((SELECT organization_id FROM inventory_purchase_returns r WHERE r.id = inventory_return_lines.return_id))
);

CREATE POLICY "Org members can view adjustment_reasons" ON inventory_adjustment_reasons FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage adjustment_reasons" ON inventory_adjustment_reasons FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view stock_adjustments" ON inventory_stock_adjustments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage stock_adjustments" ON inventory_stock_adjustments FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view reorder_rules" ON inventory_reorder_rules FOR SELECT USING (public.is_org_member(organization_id) AND deleted_at IS NULL);
CREATE POLICY "Org members can manage reorder_rules" ON inventory_reorder_rules FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view project_allocations" ON inventory_project_allocations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage project_allocations" ON inventory_project_allocations FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view asset_assignments" ON inventory_asset_assignments FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage asset_assignments" ON inventory_asset_assignments FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view document_links" ON inventory_document_links FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage document_links" ON inventory_document_links FOR ALL USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Org members can view inventory_valuations" ON inventory_valuations FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "Org members can view inventory_activities" ON inventory_activities FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can create inventory_activities" ON inventory_activities FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- ============================================================================
-- PERMISSIONS (slug convention: inventory_<resource>_<action>)
-- ============================================================================
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View Inventory Dashboard', 'inventory:dashboard:view', 'View inventory overview and analytics', 'inventory_dashboard', 'view'),
  ('View Products', 'inventory:products:read', 'View product catalog', 'product', 'read'),
  ('Manage Products', 'inventory:products:manage', 'Create/update/archive products', 'product', 'manage'),
  ('Manage Categories', 'inventory:categories:manage', 'Manage product categories', 'category', 'manage'),
  ('Manage Units', 'inventory:units:manage', 'Manage units of measure', 'unit', 'manage'),
  ('Manage Warehouses', 'inventory:warehouses:manage', 'Create/edit warehouses and locations', 'warehouse', 'manage'),
  ('View Warehouses', 'inventory:warehouses:read', 'View warehouses and locations', 'warehouse', 'read'),
  ('View Stock', 'inventory:stock:read', 'View stock levels', 'stock', 'read'),
  ('Adjust Stock', 'inventory:stock:adjust', 'Adjust stock quantities', 'stock', 'adjust'),
  ('Transfer Stock', 'inventory:stock:transfer', 'Transfer stock between warehouses', 'stock', 'transfer'),
  ('Reserve Stock', 'inventory:stock:reserve', 'Reserve stock for projects or orders', 'stock', 'reserve'),
  ('Receive Stock', 'inventory:stock:receive', 'Receive goods into inventory', 'stock', 'receive'),
  ('Manage Suppliers', 'inventory:suppliers:manage', 'Create and manage suppliers', 'supplier', 'manage'),
  ('View Suppliers', 'inventory:suppliers:read', 'View suppliers', 'supplier', 'read'),
  ('Create Purchase Request', 'inventory:procurement:purchase_request:create', 'Create purchase requests', 'purchase_request', 'create'),
  ('Approve Purchase Request', 'inventory:procurement:purchase_request:approve', 'Approve purchase requests', 'purchase_request', 'approve'),
  ('Create Purchase Order', 'inventory:procurement:purchase_order:create', 'Create purchase orders', 'purchase_order', 'create'),
  ('Approve Purchase Order', 'inventory:procurement:purchase_order:approve', 'Approve purchase orders', 'purchase_order', 'approve'),
  ('Send Purchase Order', 'inventory:procurement:purchase_order:send', 'Send purchase orders to suppliers', 'purchase_order', 'send'),
  ('Receive Goods', 'inventory:procurement:receiving', 'Receive goods from purchase orders', 'goods_receipt', 'manage'),
  ('Return Purchases', 'inventory:procurement:return', 'Process purchase returns', 'purchase_return', 'manage'),
  ('Manage Reorder Rules', 'inventory:procurement:reorder:manage', 'Manage reorder rules and alerts', 'reorder_rule', 'manage'),
  ('View Inventory Reports', 'inventory:reports:view', 'View inventory analytics and reports', 'report', 'view'),
  ('Manage Inventory Valuation', 'inventory:valuation:manage', 'Manage inventory valuation methods', 'valuation', 'manage'),
  ('View Asset Assignments', 'inventory:assets:view', 'View employee asset assignments', 'asset_assignment', 'view'),
  ('Manage Asset Assignments', 'inventory:assets:manage', 'Assign and return assets to employees', 'asset_assignment', 'manage'),
  ('View Project Allocations', 'inventory:projects:view', 'View project material allocations', 'project_allocation', 'view'),
  ('Manage Project Allocations', 'inventory:projects:manage', 'Manage project material allocations', 'project_allocation', 'manage'),
  ('View Inventory Activity', 'inventory:activity:view', 'View inventory audit activity', 'inventory_activity', 'view')
ON CONFLICT (slug) DO NOTHING;
