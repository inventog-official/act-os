-- Demo seed for Inventory & Procurement (org: Demo Corp)
-- Reuses finance_products, crm_companies, hr_departments, projects, hr_employees

-- Units of measure
INSERT INTO inventory_units (id, organization_id, name, symbol, unit_type, is_system, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'Each', 'ea', 'count', true, '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', 'Hours', 'hr', 'count', true, '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', 'Box', 'box', 'count', true, '00000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-00000000000a', 'Kilogram', 'kg', 'weight', true, '00000000-0000-0000-0000-00000000000a');

-- Warehouses
INSERT INTO inventory_warehouses (id, organization_id, code, name, description, city, is_active, is_default, created_by) VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'WH-MAIN', 'Main Warehouse', 'Primary distribution center', 'San Francisco', true, true, '00000000-0000-0000-0000-00000000000a'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', 'WH-EAST', 'East Coast Warehouse', 'Secondary fulfillment center', 'New York', true, false, '00000000-0000-0000-0000-00000000000a');

-- Locations
INSERT INTO inventory_locations (id, organization_id, warehouse_id, code, name, description, created_by) VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000001', 'A01', 'Reception', 'Dock receiving area', '00000000-0000-0000-0000-00000000000a'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000001', 'B02', 'Bulk Storage', 'High capacity bulk storage', '00000000-0000-0000-0000-00000000000a'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000002', 'A01', 'Reception', 'East coast dock', '00000000-0000-0000-0000-00000000000a');

-- Suppliers (reusing crm_companies)
INSERT INTO inventory_suppliers (id, organization_id, company_id, supplier_code, payment_terms, currency, lead_time_days, is_preferred, is_active, contact_name, contact_email, created_by) VALUES
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000030', 'SUP-ACME', 'Net 30', 'USD', 7, true, true, 'Alice Chen', 'alice@acme.example', '00000000-0000-0000-0000-00000000000a'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000031', 'SUP-GLOB', 'Net 45', 'USD', 14, true, true, 'Bob Rivera', 'bob@global.example', '00000000-0000-0000-0000-00000000000a'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000032', 'SUP-TECH', 'Net 15', 'USD', 3, false, true, 'Carol Smith', 'carol@tech.example', '00000000-0000-0000-0000-00000000000a');

-- Supplier products (map to existing finance_products)
INSERT INTO inventory_supplier_products (id, organization_id, supplier_id, product_id, supplier_sku, supplier_price, currency, minimum_order_quantity, lead_time_days, is_preferred, created_by) VALUES
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000192', 'ACME-DES', 10.00, 'USD', 1, 5, true, '00000000-0000-0000-0000-00000000000a'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000192', 'GLOB-DES', 9.50, 'USD', 1, 7, true, '00000000-0000-0000-0000-00000000000a'),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000193', 'ACME-STAR', 1200.00, 'USD', 1, 10, true, '00000000-0000-0000-0000-00000000000a'),
  ('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000193', 'GLOB-STAR', 1250.00, 'USD', 1, 14, true, '00000000-0000-0000-0000-00000000000a');

-- Stock items (with opening balances via stock movement)
INSERT INTO inventory_items (id, organization_id, product_id, warehouse_id, location_id, sku, quantity_on_hand, reserved_quantity, damaged_quantity, available_quantity, unit_cost, average_cost, lot_number, created_by) VALUES
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'DES-BOX', 500, 0, 0, 500, 10.00, 10.00, 'LOT-2024-001', '00000000-0000-0000-0000-00000000000a'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000193', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'STAR-DEV-HR', 120, 0, 0, 120, 1200.00, 1200.00, 'LOT-2024-002', '00000000-0000-0000-0000-00000000000a'),
  ('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 'DES-EA', 45, 5, 0, 40, 9.50, 9.50, 'LOT-2024-003', '00000000-0000-0000-0000-00000000000a');

-- Opening balance movements (table uses user_id)
INSERT INTO inventory_stock_movements (organization_id, movement_type, product_id, warehouse_id, location_id, quantity, unit_cost, reference_type, reason, notes, user_id) VALUES
  ('10000000-0000-0000-0000-00000000000a', 'opening_balance', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 500, 10.00, null, 'opening_balance', 'Initial stock count', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-00000000000a', 'opening_balance', '10000000-0000-0000-0000-000000000193', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 120, 1200.00, null, 'opening_balance', 'Initial stock count', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-00000000000a', 'opening_balance', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 45, 9.50, null, 'opening_balance', 'Initial stock count', '00000000-0000-0000-0000-00000000000a');

-- Reorder rules
INSERT INTO inventory_reorder_rules (organization_id, product_id, warehouse_id, reorder_point, reorder_quantity, maximum_stock, is_active, created_by) VALUES
  ('10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000001', 100, 250, 1000, true, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000193', '40000000-0000-0000-0000-000000000001', 50, 60, 200, true, '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000192', '40000000-0000-0000-0000-000000000002', 30, 100, 500, true, '00000000-0000-0000-0000-00000000000a');

-- Purchase request (Engineering dept wants Starter Licenses for Q1)
INSERT INTO inventory_purchase_requests (id, organization_id, request_number, title, department_id, project_id, requested_by, status, total_amount, currency, notes) VALUES
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'PR-2024-001', 'Q1 License Renewal for Engineering', '20000000-0000-0000-0000-000000000001', null, '00000000-0000-0000-0000-00000000000a', 'approved', 6000, 'USD', 'Annual renewal of Starter Licenses');

INSERT INTO inventory_purchase_request_lines (request_id, product_id, description, quantity, unit_id, unit_price, total_price, preferred_supplier_id) VALUES
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000193', 'Starter Licenses for Engineering team', 5, '30000000-0000-0000-0000-000000000001', 1200.00, 6000, '60000000-0000-0000-0000-000000000001');

-- Purchase order (convert from PR; sent to ACME)
INSERT INTO inventory_purchase_orders (id, organization_id, po_number, supplier_id, status, currency, subtotal, tax_amount, total_amount, expected_delivery, notes, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'PO-2024-0001', '60000000-0000-0000-0000-000000000001', 'sent', 'USD', 6000, 0, 6000, '2024-01-20', 'Linked to PR-2024-001', '00000000-0000-0000-0000-00000000000a');

INSERT INTO inventory_purchase_order_lines (purchase_order_id, product_id, description, quantity, unit_id, unit_price, tax_amount, line_total) VALUES
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000193', 'Starter Licenses for Engineering team', 5, '30000000-0000-0000-0000-000000000001', 1200.00, 0, 6000);

-- Goods receipt (partial: 3 of 5 received)
INSERT INTO inventory_goods_receipts (id, organization_id, po_id, receipt_number, warehouse_id, location_id, supplier_id, status, received_date, currency, total_amount, notes, received_by) VALUES
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001', 'GRN-2024-001', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'completed', '2024-01-18', 'USD', 3600, 'Partial delivery of 5', '00000000-0000-0000-0000-00000000000a');

INSERT INTO inventory_receipt_lines (receipt_id, po_line_id, product_id, quantity, unit_price, received_quantity, line_total, notes) VALUES
  ('b0000000-0000-0000-0000-000000000001', (SELECT id FROM inventory_purchase_order_lines WHERE purchase_order_id='a0000000-0000-0000-0000-000000000001' LIMIT 1), '10000000-0000-0000-0000-000000000193', 5, 1200.00, 3, 3600, 'Partial delivery');

-- Stock adjustment (damaged licenses: -1)
INSERT INTO inventory_stock_adjustments (organization_id, adjustment_number, product_id, warehouse_id, location_id, quantity_before, quantity_change, quantity_after, reason, notes, status, created_by) VALUES
  ('10000000-0000-0000-0000-00000000000a', 'ADJ-2024-001', '10000000-0000-0000-0000-000000000193', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 120, -1, 119, 'damaged', '1 defective license key', 'approved', '00000000-0000-0000-0000-00000000000a');

-- Stock transfer (move 5 Starter Licenses from Main to East)
INSERT INTO inventory_transfers (organization_id, transfer_number, product_id, warehouse_id, source_location_id, destination_warehouse_id, destination_location_id, quantity, notes, requested_by, status) VALUES
  ('10000000-0000-0000-0000-00000000000a', 'TRF-2024-001', '10000000-0000-0000-0000-000000000193', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 5, 'Relocate licenses to East coast', '00000000-0000-0000-0000-00000000000a', 'pending');

-- Project allocation for a demo project
INSERT INTO inventory_project_allocations (organization_id, project_id, product_id, required_quantity, allocated_quantity, consumed_quantity, status, created_by)
SELECT '10000000-0000-0000-0000-00000000000a', id, '10000000-0000-0000-0000-000000000192', 100, 50, 0, 'pending', '00000000-0000-0000-0000-00000000000a'
FROM projects WHERE organization_id = '10000000-0000-0000-0000-00000000000a' AND deleted_at IS NULL LIMIT 1;

-- Asset assignment (Starter License assigned to demo employee)
INSERT INTO inventory_asset_assignments (organization_id, product_id, employee_id, serial_number, status, assigned_date, assigned_by, notes)
SELECT '10000000-0000-0000-0000-00000000000a', p.id, e.id, 'STAR-2024-00501', 'assigned', '2024-01-15', '00000000-0000-0000-0000-00000000000a', 'Demo Starter License asset'
FROM finance_products p CROSS JOIN hr_employees e
WHERE p.organization_id = '10000000-0000-0000-0000-00000000000a' AND e.organization_id = '10000000-0000-0000-0000-00000000000a' AND p.name = 'Starter License' LIMIT 1;
