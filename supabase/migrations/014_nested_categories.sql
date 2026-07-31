-- Phase 7 addendum: nested product categories
-- Adds parent_id to finance_product_categories for nested category support (Electronics > Laptops)

ALTER TABLE finance_product_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES finance_product_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_product_categories_parent
  ON finance_product_categories (parent_id);
