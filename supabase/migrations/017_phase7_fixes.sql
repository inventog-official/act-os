-- ACT OS Phase 7 — Completion fixes
-- 1) Replace the broken 2-arg adjust_stock_atomic with the 12-arg signature the
--    server actions actually call. The new function is org-scoped, records stock
--    movements, handles reservations/releases/damage, prevents negative stock,
--    updates weighted-average cost, and is concurrency-safe.
-- 2) Widen purchase request status CHECK to include the 'pending_review' status
--    used by submitPurchaseRequest.

-- ============================================================================
-- 1. Atomic stock adjustment (fix)
-- ============================================================================
DROP FUNCTION IF EXISTS public.adjust_stock_atomic(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.adjust_stock_atomic(UUID, UUID, NUMERIC, TEXT, UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, UUID, UUID);

CREATE OR REPLACE FUNCTION public.adjust_stock_atomic(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity_change NUMERIC,
  p_movement_type TEXT,
  p_location_id UUID,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_reason TEXT,
  p_notes TEXT,
  p_unit_cost NUMERIC,
  p_org_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  out_id UUID,
  out_product_id UUID,
  out_warehouse_id UUID,
  out_on_hand NUMERIC,
  out_reserved NUMERIC,
  out_damaged NUMERIC,
  out_available NUMERIC,
  out_unit_cost NUMERIC,
  out_average_cost NUMERIC,
  out_movement_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item inventory_items%ROWTYPE;
  v_abs NUMERIC;
  v_delta NUMERIC := 0;
  v_reserved_delta NUMERIC := 0;
  v_damaged_delta NUMERIC := 0;
  v_movement_qty NUMERIC;
  v_new_avg NUMERIC;
  v_cost_in NUMERIC;
BEGIN
  -- Security: the caller (auth.uid()) must be a member of the target org.
  IF NOT public.is_org_member(p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;
  -- The acting user recorded on the movement must also belong to the org,
  -- preventing impersonation through p_user_id.
  IF p_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this organization';
  END IF;

  IF p_quantity_change IS NULL OR p_quantity_change = 0 THEN
    RAISE EXCEPTION 'Quantity change cannot be zero';
  END IF;

  v_abs := ABS(p_quantity_change);

  -- Resolve direction per movement type.
  IF p_movement_type IN ('receipt', 'opening_balance', 'production') THEN
    v_delta := v_abs;
  ELSIF p_movement_type IN ('issue', 'transfer', 'return', 'sale', 'allocation', 'consumption') THEN
    v_delta := -v_abs;
  ELSIF p_movement_type IN ('adjustment', 'correction') THEN
    v_delta := p_quantity_change;
  ELSIF p_movement_type = 'damage' THEN
    v_damaged_delta := v_abs;
  ELSIF p_movement_type = 'reservation' THEN
    v_reserved_delta := v_abs;
  ELSIF p_movement_type = 'release' THEN
    v_reserved_delta := -v_abs;
  ELSE
    RAISE EXCEPTION 'Unsupported movement type: %', p_movement_type;
  END IF;

  -- Locate the stock item (or create a zero-balance row so receiving/opening
  -- balances work for products that never had stock before).
  SELECT * INTO v_item FROM inventory_items
  WHERE organization_id = p_org_id
    AND product_id = p_product_id
    AND warehouse_id = p_warehouse_id
    AND deleted_at IS NULL
  LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO inventory_items (
      product_id, warehouse_id, location_id,
      quantity_on_hand, reserved_quantity, damaged_quantity, available_quantity,
      organization_id, created_by
    )
    VALUES (
      p_product_id, p_warehouse_id, p_location_id,
      0, 0, 0, 0,
      p_org_id, p_user_id
    )
    RETURNING * INTO v_item;
  END IF;

  -- Pre-flight validation for friendly errors.
  IF v_delta < 0 AND (v_item.quantity_on_hand + v_delta) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock on hand';
  END IF;
  IF v_reserved_delta > 0 AND (v_item.reserved_quantity + v_reserved_delta) > v_item.quantity_on_hand THEN
    RAISE EXCEPTION 'Insufficient available stock for reservation';
  END IF;
  IF v_reserved_delta < 0 AND (v_item.reserved_quantity + v_reserved_delta) < 0 THEN
    RAISE EXCEPTION 'Cannot release more than the reserved quantity';
  END IF;

  -- Signed quantity recorded on the movement (must be non-zero).
  IF p_movement_type IN ('adjustment', 'correction') THEN
    v_movement_qty := p_quantity_change;
  ELSE
    v_movement_qty := v_delta + v_reserved_delta + v_damaged_delta;
  END IF;

  -- Weighted average cost on stock-in movements with a unit cost.
  v_cost_in := COALESCE(p_unit_cost, 0);
  IF p_movement_type IN ('receipt', 'opening_balance', 'production') AND v_delta > 0 THEN
    IF (COALESCE(v_item.quantity_on_hand, 0) + v_delta) > 0 THEN
      v_new_avg := (
        (COALESCE(v_item.average_cost, 0) * COALESCE(v_item.quantity_on_hand, 0))
        + (v_cost_in * v_delta)
      ) / (COALESCE(v_item.quantity_on_hand, 0) + v_delta);
    ELSE
      v_new_avg := v_cost_in;
    END IF;
  ELSE
    v_new_avg := COALESCE(v_item.average_cost, 0);
  END IF;

  -- Atomic update with guards against negative stock / over-reservation.
  UPDATE inventory_items
  SET quantity_on_hand = quantity_on_hand + v_delta,
      reserved_quantity = reserved_quantity + v_reserved_delta,
      damaged_quantity = damaged_quantity + v_damaged_delta,
      available_quantity = GREATEST(0, (quantity_on_hand + v_delta) - (reserved_quantity + v_reserved_delta)),
      unit_cost = CASE WHEN p_unit_cost IS NOT NULL AND p_unit_cost > 0 THEN p_unit_cost ELSE unit_cost END,
      average_cost = v_new_avg,
      updated_at = NOW()
  WHERE id = v_item.id
    AND quantity_on_hand + v_delta >= 0
    AND reserved_quantity + v_reserved_delta >= 0
    AND (v_reserved_delta <= 0 OR (reserved_quantity + v_reserved_delta) <= quantity_on_hand)
  RETURNING
    inventory_items.id, inventory_items.product_id, inventory_items.warehouse_id,
    inventory_items.quantity_on_hand, inventory_items.reserved_quantity, inventory_items.damaged_quantity, inventory_items.available_quantity,
    inventory_items.unit_cost, inventory_items.average_cost
  INTO out_id, out_product_id, out_warehouse_id,
       out_on_hand, out_reserved, out_damaged, out_available,
       out_unit_cost, out_average_cost;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock to complete this movement';
  END IF;

  -- Record the stock movement (audit trail).
  INSERT INTO inventory_stock_movements (
    movement_type, product_id, warehouse_id, location_id, inventory_item_id,
    quantity, unit_cost, reference_type, reference_id, reason, notes,
    organization_id, user_id
  )
  VALUES (
    p_movement_type, p_product_id, p_warehouse_id, p_location_id, out_id,
    v_movement_qty, COALESCE(p_unit_cost, v_new_avg),
    p_reference_type, p_reference_id, p_reason, p_notes,
    p_org_id, p_user_id
  )
  RETURNING id INTO out_movement_id;

  RETURN QUERY SELECT
    out_id AS id, out_product_id AS product_id, out_warehouse_id AS warehouse_id,
    out_on_hand AS quantity_on_hand, out_reserved AS reserved_quantity, out_damaged AS damaged_quantity, out_available AS available_quantity,
    out_unit_cost AS unit_cost, out_average_cost AS average_cost, out_movement_id AS movement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_stock_atomic(
  UUID, UUID, NUMERIC, TEXT, UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, UUID, UUID
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.adjust_stock_atomic(
  UUID, UUID, NUMERIC, TEXT, UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, UUID, UUID
) TO authenticated;

-- ============================================================================
-- 2. Purchase request status: allow 'pending_review' (used by submitPurchaseRequest)
-- ============================================================================
ALTER TABLE public.inventory_purchase_requests DROP CONSTRAINT IF EXISTS inventory_purchase_requests_status_check;
ALTER TABLE public.inventory_purchase_requests
  ADD CONSTRAINT inventory_purchase_requests_status_check
  CHECK (status IN ('draft','submitted','pending_review','manager_approved','procurement_approved','approved','rejected','cancelled','converted'));

-- ============================================================================
-- 3. Widen reference_type CHECK constraints to the values the server actions
--    and adjust_stock_atomic actually record.
-- ============================================================================
ALTER TABLE public.inventory_stock_movements DROP CONSTRAINT IF EXISTS inventory_stock_movements_reference_type_check;
ALTER TABLE public.inventory_stock_movements
  ADD CONSTRAINT inventory_stock_movements_reference_type_check
  CHECK (reference_type IN ('purchase_order','purchase_request','invoice','project','sale','manual','receipt','transfer','adjustment','return','reservation','release','production','opening_balance','goods_receipt','purchase_return','damage'));

ALTER TABLE public.inventory_reservations DROP CONSTRAINT IF EXISTS inventory_reservations_reference_type_check;
ALTER TABLE public.inventory_reservations
  ADD CONSTRAINT inventory_reservations_reference_type_check
  CHECK (reference_type IN ('project','order','customer','department','manual','purchase_order','sale'));