-- ============================================
-- Migration: fd_revert_dish RPC (Phase C1)
--
-- Lets the UI walk a dish ONE step backwards in the cook lifecycle:
--   Eaten     → In Fridge
--   In Fridge → Cooked
--   Cooked    → Planned
--
-- Stock restoration is opt-in (caller decides per tap). Eaten → In Fridge
-- never touches stock (the deduction lives upstream of the fridge stage).
--
-- All work happens inside the implicit transaction of the function: any
-- RAISE EXCEPTION rolls back every mutation, so callers never observe
-- partial state. SELECT … FOR UPDATE serializes concurrent reverts of the
-- same dish.
-- ============================================

CREATE OR REPLACE FUNCTION fd_revert_dish(p_dish_id UUID, p_restore_stock BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_dish         food_department_dishes%ROWTYPE;
  v_from_status  TEXT;
  v_to_status    TEXT;
  v_ing          RECORD;
  v_int          RECORD;
BEGIN
  -- Lock the dish row first so a concurrent forward action can't race us.
  SELECT * INTO v_dish
  FROM food_department_dishes
  WHERE id = p_dish_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dish not found: %', p_dish_id;
  END IF;

  v_from_status := v_dish.status;

  -- One-step-back mapping. Anything else is a no-op error.
  IF v_from_status = 'Eaten' THEN
    v_to_status := 'In Fridge';
  ELSIF v_from_status = 'In Fridge' THEN
    v_to_status := 'Cooked';
  ELSIF v_from_status = 'Cooked' THEN
    v_to_status := 'Planned';
  ELSE
    RAISE EXCEPTION 'Cannot revert from status %', v_from_status;
  END IF;

  -- ─── Restore stock (only when going BACK across the cook boundary) ───
  -- Eaten → In Fridge keeps stock as-is; the deduction was already
  -- committed when the dish moved Planned → Cooked, so restoring on every
  -- backward step would double-count.
  IF p_restore_stock AND v_from_status IN ('Cooked', 'In Fridge') THEN
    -- Lock + restore each ingredient (ordered by id to keep lock order
    -- consistent with fd_cook_dish and avoid deadlocks).
    FOR v_ing IN
      SELECT di.ingredient_id AS id, di.qty AS qty
      FROM food_department_dish_ingredients di
      WHERE di.dish_id = p_dish_id
      ORDER BY di.ingredient_id
    LOOP
      UPDATE food_department_ingredients
      SET stock_qty = stock_qty + v_ing.qty,
          last_updated = now()
      WHERE id = v_ing.id;
    END LOOP;

    FOR v_int IN
      SELECT di.intermediate_id AS id, di.qty AS qty
      FROM food_department_dish_intermediates di
      WHERE di.dish_id = p_dish_id
      ORDER BY di.intermediate_id
    LOOP
      UPDATE food_department_intermediates
      SET stock_qty = stock_qty + v_int.qty
      WHERE id = v_int.id;
    END LOOP;
  END IF;

  -- ─── Status + per-transition column resets ────────────────────────────
  IF v_from_status = 'In Fridge' THEN
    -- Going back to Cooked: drop the fridge timestamp.
    UPDATE food_department_dishes
    SET status = v_to_status,
        stored_at = NULL
    WHERE id = p_dish_id;

  ELSIF v_from_status = 'Cooked' THEN
    -- Going back to Planned: decrement times_cooked (clamped at 0) and
    -- clear last_cooked_on so the dish looks un-cooked again.
    UPDATE food_department_dishes
    SET status = v_to_status,
        times_cooked = GREATEST(COALESCE(times_cooked, 0) - 1, 0),
        last_cooked_on = NULL
    WHERE id = p_dish_id;

    -- Delete the most recent cook_history row for this dish — the one
    -- created when the dish was last cooked.
    DELETE FROM food_department_cook_history
    WHERE id = (
      SELECT id FROM food_department_cook_history
      WHERE dish_id = p_dish_id
      ORDER BY cooked_at DESC NULLS LAST
      LIMIT 1
    );

  ELSE
    -- Eaten → In Fridge: status only. No stock, no counters, no history.
    UPDATE food_department_dishes
    SET status = v_to_status
    WHERE id = p_dish_id;
  END IF;

  RETURN jsonb_build_object(
    'dish_id',        p_dish_id,
    'from_status',    v_from_status,
    'to_status',      v_to_status,
    'restored_stock', (p_restore_stock AND v_from_status IN ('Cooked', 'In Fridge'))
  );
END;
$$;

-- Match the rest of the app's open-access posture.
GRANT EXECUTE ON FUNCTION fd_revert_dish(UUID, BOOLEAN) TO anon, authenticated;
