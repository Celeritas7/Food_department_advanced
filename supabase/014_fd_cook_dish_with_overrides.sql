-- ============================================
-- Migration: fd_cook_dish_with_overrides RPC (Phase E1)
--
-- Variant of fd_cook_dish that accepts caller-supplied per-row quantities.
-- Solves the "recipe says 200g but I actually used 400g" mismatch at the
-- source — the user adjusts in the Cook dialog and stock is deducted by
-- the real amount, leaving nothing phantom to clean up later.
--
-- The original fd_cook_dish stays intact for backward compat / rollback.
-- The two functions share the same transactional posture: SELECT … FOR
-- UPDATE serializes concurrent cooks of the same dish; RAISE EXCEPTION
-- rolls back every mutation; the CHECK (stock_qty >= 0) on stock columns
-- is the final safety net.
--
-- Caveat (called out in the Phase E1 spec, intentionally not fixed here):
-- fd_revert_dish currently restores stock based on the *recipe* qty in
-- food_department_dish_ingredients, NOT the override used at cook time.
-- A future phase should log the overrides if revert needs to be exact.
-- ============================================

CREATE OR REPLACE FUNCTION fd_cook_dish_with_overrides(
  p_dish_id                UUID,
  p_ingredient_overrides   JSONB,
  p_intermediate_overrides JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_dish                   food_department_dishes%ROWTYPE;
  v_row                    JSONB;
  v_ovr                    JSONB;
  v_id                     UUID;
  v_qty                    NUMERIC;
  v_name                   TEXT;
  v_stock                  NUMERIC;
  v_deducted_ingredients   JSONB := '[]'::jsonb;
  v_deducted_intermediates JSONB := '[]'::jsonb;
BEGIN
  -- Lock the dish row first so a concurrent forward/revert can't race us.
  SELECT * INTO v_dish
  FROM food_department_dishes
  WHERE id = p_dish_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dish not found: %', p_dish_id;
  END IF;

  IF v_dish.status NOT IN ('Planned', 'In Progress') THEN
    RAISE EXCEPTION 'Cannot cook from status % (must be Planned or In Progress)', v_dish.status;
  END IF;

  -- ─── Ingredient overrides ─────────────────────────────────────────────
  -- Validate everything FIRST so a bad row at the end doesn't leave
  -- partially-mutated stock behind (the transaction would roll back, but
  -- doing validation up-front gives clearer error messages and avoids
  -- pointless work).
  IF p_ingredient_overrides IS NOT NULL AND jsonb_typeof(p_ingredient_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) LOOP
      v_id  := (v_ovr->>'ingredient_id')::uuid;
      v_qty := (v_ovr->>'qty')::numeric;

      IF v_id IS NULL OR v_qty IS NULL THEN
        RAISE EXCEPTION 'Malformed ingredient override: %', v_ovr;
      END IF;
      IF v_qty <= 0 THEN
        RAISE EXCEPTION 'Ingredient qty must be > 0 (got % for %)', v_qty, v_id;
      END IF;

      -- Lock + validate stock.
      SELECT name, stock_qty INTO v_name, v_stock
      FROM food_department_ingredients
      WHERE id = v_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Ingredient not found: %', v_id;
      END IF;
      IF v_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient %: need %, have %', v_name, v_qty, v_stock;
      END IF;
    END LOOP;

    -- Second pass: deduct.
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) LOOP
      v_id  := (v_ovr->>'ingredient_id')::uuid;
      v_qty := (v_ovr->>'qty')::numeric;

      UPDATE food_department_ingredients
      SET stock_qty = stock_qty - v_qty,
          last_updated = now()
      WHERE id = v_id
      RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;

      v_deducted_ingredients := v_deducted_ingredients || jsonb_build_object(
        'ingredient_id', v_id,
        'qty_deducted',  v_qty,
        'row',           v_row
      );
    END LOOP;
  END IF;

  -- ─── Intermediate overrides ───────────────────────────────────────────
  IF p_intermediate_overrides IS NOT NULL AND jsonb_typeof(p_intermediate_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_intermediate_overrides) LOOP
      v_id  := (v_ovr->>'intermediate_id')::uuid;
      v_qty := (v_ovr->>'qty')::numeric;

      IF v_id IS NULL OR v_qty IS NULL THEN
        RAISE EXCEPTION 'Malformed intermediate override: %', v_ovr;
      END IF;
      IF v_qty <= 0 THEN
        RAISE EXCEPTION 'Intermediate qty must be > 0 (got % for %)', v_qty, v_id;
      END IF;

      SELECT name, stock_qty INTO v_name, v_stock
      FROM food_department_intermediates
      WHERE id = v_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Intermediate not found: %', v_id;
      END IF;
      IF v_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient %: need %, have %', v_name, v_qty, v_stock;
      END IF;
    END LOOP;

    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_intermediate_overrides) LOOP
      v_id  := (v_ovr->>'intermediate_id')::uuid;
      v_qty := (v_ovr->>'qty')::numeric;

      UPDATE food_department_intermediates
      SET stock_qty = stock_qty - v_qty
      WHERE id = v_id
      RETURNING to_jsonb(food_department_intermediates.*) INTO v_row;

      v_deducted_intermediates := v_deducted_intermediates || jsonb_build_object(
        'intermediate_id', v_id,
        'qty_deducted',    v_qty,
        'row',             v_row
      );
    END LOOP;
  END IF;

  -- ─── Mark the dish cooked ─────────────────────────────────────────────
  -- cooked (boolean) exists on this schema alongside status; keep them in
  -- sync with what fd_cook_dish would do.
  UPDATE food_department_dishes
  SET status         = 'Cooked',
      cooked         = true,
      last_cooked_on = now()
  WHERE id = p_dish_id;

  RETURN jsonb_build_object(
    'dish_id',                 p_dish_id,
    'to_status',               'Cooked',
    'deducted_ingredients',    v_deducted_ingredients,
    'deducted_intermediates',  v_deducted_intermediates
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fd_cook_dish_with_overrides(UUID, JSONB, JSONB) TO anon, authenticated;
