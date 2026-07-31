-- ACT OS Phase 4 — Finance & Billing Module

-- ============================================
-- PRODUCTS & SERVICES
-- ============================================
CREATE TABLE finance_product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_product_categories_updated_at
  BEFORE UPDATE ON finance_product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE finance_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT,
  category_id UUID REFERENCES finance_product_categories(id) ON DELETE SET NULL,
  description TEXT,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  tax_rate_id UUID REFERENCES finance_tax_rates(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_products_updated_at
  BEFORE UPDATE ON finance_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_products_org ON finance_products(organization_id, deleted_at);
CREATE INDEX idx_finance_products_category ON finance_products(category_id);

-- ============================================
-- TAX RATES
-- ============================================
CREATE TABLE finance_tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'sales_tax' CHECK (type IN ('gst', 'vat', 'sales_tax', 'custom')),
  is_default BOOLEAN DEFAULT FALSE,
  is_compound BOOLEAN DEFAULT FALSE,
  applies_to TEXT[] DEFAULT '{}',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_tax_rates_updated_at
  BEFORE UPDATE ON finance_tax_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- QUOTATIONS
-- ============================================
CREATE TABLE finance_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')),
  type TEXT NOT NULL DEFAULT 'quote' CHECK (type IN ('quote', 'estimate')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_quotations_updated_at
  BEFORE UPDATE ON finance_quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_quotations_org ON finance_quotations(organization_id, deleted_at);
CREATE INDEX idx_finance_quotations_status ON finance_quotations(organization_id, status);
CREATE INDEX idx_finance_quotations_company ON finance_quotations(company_id);
CREATE INDEX idx_finance_quotations_project ON finance_quotations(project_id);
CREATE INDEX idx_finance_quotations_deal ON finance_quotations(deal_id);

-- ============================================
-- QUOTATION LINE ITEMS
-- ============================================
CREATE TABLE finance_quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES finance_quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES finance_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_rate_id UUID REFERENCES finance_tax_rates(id) ON DELETE SET NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE finance_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES finance_quotations(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15,2) DEFAULT 0,
  balance_due NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_next_date DATE,
  recurring_end_date DATE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_invoices_updated_at
  BEFORE UPDATE ON finance_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_invoices_org ON finance_invoices(organization_id, deleted_at);
CREATE INDEX idx_finance_invoices_status ON finance_invoices(organization_id, status);
CREATE INDEX idx_finance_invoices_company ON finance_invoices(company_id);
CREATE INDEX idx_finance_invoices_project ON finance_invoices(project_id);
CREATE INDEX idx_finance_invoices_due ON finance_invoices(due_date);
CREATE INDEX idx_finance_invoices_recurring ON finance_invoices(is_recurring, recurring_next_date);

-- ============================================
-- INVOICE LINE ITEMS
-- ============================================
CREATE TABLE finance_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES finance_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES finance_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_rate_id UUID REFERENCES finance_tax_rates(id) ON DELETE SET NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE finance_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finance_payment_methods (name, code, description) VALUES
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer / wire'),
  ('Credit Card', 'credit_card', 'Credit or debit card payment'),
  ('Cash', 'cash', 'Cash payment'),
  ('Cheque', 'cheque', 'Cheque payment'),
  ('UPI', 'upi', 'UPI payment'),
  ('PayPal', 'paypal', 'PayPal online payment'),
  ('Stripe', 'stripe', 'Stripe payment gateway'),
  ('Other', 'other', 'Other payment method')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE finance_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES finance_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method_id UUID REFERENCES finance_payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT,
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_payments_updated_at
  BEFORE UPDATE ON finance_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_payments_org ON finance_payments(organization_id, deleted_at);
CREATE INDEX idx_finance_payments_invoice ON finance_payments(invoice_id);
CREATE INDEX idx_finance_payments_date ON finance_payments(payment_date DESC);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE finance_expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_expense_categories_updated_at
  BEFORE UPDATE ON finance_expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE finance_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES finance_expense_categories(id) ON DELETE SET NULL,
  vendor TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tax_amount NUMERIC(15,2) DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  billable BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_expenses_updated_at
  BEFORE UPDATE ON finance_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_expenses_org ON finance_expenses(organization_id, deleted_at);
CREATE INDEX idx_finance_expenses_category ON finance_expenses(category_id);
CREATE INDEX idx_finance_expenses_project ON finance_expenses(project_id);
CREATE INDEX idx_finance_expenses_date ON finance_expenses(expense_date DESC);

-- ============================================
-- PURCHASE ORDERS
-- ============================================
CREATE TABLE finance_purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  vendor_phone TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_finance_purchase_orders_updated_at
  BEFORE UPDATE ON finance_purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_finance_purchase_orders_org ON finance_purchase_orders(organization_id, deleted_at);
CREATE INDEX idx_finance_purchase_orders_status ON finance_purchase_orders(status);

CREATE TABLE finance_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES finance_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES finance_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate_id UUID REFERENCES finance_tax_rates(id) ON DELETE SET NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE finance_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies — org-scoped access
CREATE POLICY "Members can view finance products" ON finance_products FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can insert finance products" ON finance_products FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can update finance products" ON finance_products FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can delete finance products" ON finance_products FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view tax rates" ON finance_tax_rates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage tax rates" ON finance_tax_rates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view quotations" ON finance_quotations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage quotations" ON finance_quotations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view quotation items" ON finance_quotation_items FOR SELECT
  USING (quotation_id IN (SELECT id FROM finance_quotations WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Members can manage quotation items" ON finance_quotation_items FOR ALL
  USING (quotation_id IN (SELECT id FROM finance_quotations WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Members can view invoices" ON finance_invoices FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage invoices" ON finance_invoices FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view invoice items" ON finance_invoice_items FOR SELECT
  USING (invoice_id IN (SELECT id FROM finance_invoices WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Members can manage invoice items" ON finance_invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM finance_invoices WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Anyone can view payment methods" ON finance_payment_methods FOR SELECT
  USING (true);

CREATE POLICY "Members can view payments" ON finance_payments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage payments" ON finance_payments FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view expense categories" ON finance_expense_categories FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage expense categories" ON finance_expense_categories FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view expenses" ON finance_expenses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage expenses" ON finance_expenses FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view purchase orders" ON finance_purchase_orders FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage purchase orders" ON finance_purchase_orders FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view purchase order items" ON finance_purchase_order_items FOR SELECT
  USING (purchase_order_id IN (SELECT id FROM finance_purchase_orders WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Members can manage purchase order items" ON finance_purchase_order_items FOR ALL
  USING (purchase_order_id IN (SELECT id FROM finance_purchase_orders WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Insert finance permissions
INSERT INTO permissions (name, slug, description, resource, action) VALUES
  ('View Finance Dashboard', 'finance_dashboard_view', 'View finance dashboard', 'finance_dashboard', 'view'),
  ('View Quotations', 'finance_quotation_view', 'View quotations and estimates', 'finance_quotation', 'view'),
  ('Create Quotations', 'finance_quotation_create', 'Create quotations and estimates', 'finance_quotation', 'create'),
  ('Update Quotations', 'finance_quotation_update', 'Edit quotations and estimates', 'finance_quotation', 'update'),
  ('Delete Quotations', 'finance_quotation_delete', 'Delete quotations and estimates', 'finance_quotation', 'delete'),
  ('View Invoices', 'finance_invoice_view', 'View invoices', 'finance_invoice', 'view'),
  ('Create Invoices', 'finance_invoice_create', 'Create invoices', 'finance_invoice', 'create'),
  ('Update Invoices', 'finance_invoice_update', 'Edit invoices', 'finance_invoice', 'update'),
  ('Delete Invoices', 'finance_invoice_delete', 'Delete invoices', 'finance_invoice', 'delete'),
  ('Record Payments', 'finance_payment_create', 'Record payments', 'finance_payment', 'create'),
  ('View Payments', 'finance_payment_view', 'View payments', 'finance_payment', 'view'),
  ('Manage Expenses', 'finance_expense_manage', 'Manage expenses', 'finance_expense', 'manage'),
  ('View Expenses', 'finance_expense_view', 'View expenses', 'finance_expense', 'view'),
  ('View Reports', 'finance_report_view', 'View financial reports', 'finance_report', 'view'),
  ('Export Reports', 'finance_report_export', 'Export financial reports', 'finance_report', 'export'),
  ('Manage Products', 'finance_product_manage', 'Manage products and services', 'finance_product', 'manage'),
  ('Manage Purchase Orders', 'finance_po_manage', 'Manage purchase orders', 'finance_po', 'manage'),
  ('Approve Purchase Orders', 'finance_po_approve', 'Approve purchase orders', 'finance_po', 'approve'),
  ('Manage Tax Rates', 'finance_tax_manage', 'Manage tax rates', 'finance_tax', 'manage'),
  ('View AI Finance', 'finance_ai_view', 'View AI finance features', 'finance_ai', 'view')
ON CONFLICT (slug) DO NOTHING;
