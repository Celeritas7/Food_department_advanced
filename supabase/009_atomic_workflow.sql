-- ============================================
-- Phase 7 — Atomic Workflow RPC Functions
-- Run after 008_recipe_data.sql
--
-- Each function executes inside an implicit transaction. RAISE EXCEPTION
-- aborts the function and rolls back every mutation made within it, so
-- callers never observe partial state. SELECT ... FOR UPDATE locks the
-- rows we touch so concurrent cooks/prepares of the same resource
-- serialize and the loser of a race fails cleanly instead of overdrawing
-- stock. The CHECK (stock_qty >= 0) constraint on both stock columns is
-- the final safety net.
-- ============================================

-- ─── 1. fd_cook_dish ───────────────────────────────────
CREATE OR REPLACE FUNCTION fd_cook_dish(p_dish_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_dish food_department_dishes%ROWTYPE;
  v_ing  RECORD;
  v_int  RECORD;
  v_updated_ingredients JSONB := '[]'::jsonb;
  v_updated_intermediates JSONB := '[]'::jsonb;
  v_row JSONB;
BEGIN
  -- Lock the dish row. If status is already 'Cooked', refuse early.
  SELECT * INTO v_dish
  FROM food_department_dishes
  WHERE id = p_dish_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dish not found: %', p_dish_id;
  END IF;
  IF v_dish.status = 'Cooked' THEN
    RAISE EXCEPTION 'Dish is already cooked';
  END IF;

  -- Lock + validate every ingredient row (ordered by id to avoid deadlock).
  FOR v_ing IN
    SELECT i.id, i.name, i.stock_qty, di.qty AS need
    FROM food_department_dish_ingredients di
    JOIN food_department_ingredients i ON i.id = di.ingredient_id
    WHERE di.dish_id = p_dish_id
    ORDER BY i.id
    FOR UPDATE OF i
  LOOP
    IF v_ing.stock_qty < v_ing.need THEN
      RAISE EXCEPTION 'Insufficient %: need %, have %',
        v_ing.name, v_ing.need, v_ing.stock_qty;
    END IF;
  END LOOP;

  -- Lock + validate every intermediate row.
  FOR v_int IN
    SELECT t.id, t.name, t.stock_qty, di.qty AS need
    FROM food_department_dish_intermediates di
    JOIN food_department_intermediates t ON t.id = di.intermediate_id
    WHERE di.dish_id = p_dish_id
    ORDER BY t.id
    FOR UPDATE OF t
  LOOP
    IF v_int.stock_qty < v_int.need THEN
      RAISE EXCEPTION 'Insufficient %: need %, have %',
        v_int.name, v_int.need, v_int.stock_qty;
    END IF;
  END LOOP;

  -- Deduct ingredient stock. CHECK constraint blocks any negative result
  -- (defensive — the validation loop above should have caught it).
  FOR v_ing IN
    SELECT di.ingredient_id AS id, di.qty AS need
    FROM food_department_dish_ingredients di
    WHERE di.dish_id = p_dish_id
  LOOP
    UPDATE food_department_ingredients
    SET stock_qty = stock_qty - v_ing.need,
        last_updated = now()
    WHERE id = v_ing.id
    RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;
    v_updated_ingredients := v_updated_ingredients || v_row;
  END LOOP;

  -- Deduct intermediate stock.
  FOR v_int IN
    SELECT di.intermediate_id AS id, di.qty AS need
    FROM food_department_dish_intermediates di
    WHERE di.dish_id = p_dish_id
  LOOP
    UPDATE food_department_intermediates
    SET stock_qty = stock_qty - v_int.need
    WHERE id = v_int.id
    RETURNING to_jsonb(food_department_intermediates.*) INTO v_row;
    v_updated_intermediates := v_updated_intermediates || v_row;
  END LOOP;

  -- Mark the dish cooked.
  UPDATE food_department_dishes
  SET status = 'Cooked', last_cooked_on = now()
  WHERE id = p_dish_id
  RETURNING to_jsonb(food_department_dishes.*) INTO v_row;

  RETURN jsonb_build_object(
    'success', true,
    'updatedDish', v_row,
    'updatedIngredients', v_updated_ingredients,
    'updatedIntermediates', v_updated_intermediates
  );
END;
$$;

-- ─── 2. fd_prepare_intermediate ─────────────────────────
CREATE OR REPLACE FUNCTION fd_prepare_intermediate(p_intermediate_id UUID, p_units NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_inter food_department_intermediates%ROWTYPE;
  v_inp RECORD;
  v_updated_ingredients JSONB := '[]'::jsonb;
  v_updated_intermediate JSONB;
  v_row JSONB;
BEGIN
  IF p_units IS NULL OR p_units <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity: %', p_units;
  END IF;

  SELECT * INTO v_inter
  FROM food_department_intermediates
  WHERE id = p_intermediate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intermediate not found: %', p_intermediate_id;
  END IF;

  -- Lock + validate every input ingredient (ordered by id to avoid deadlock).
  FOR v_inp IN
    SELECT i.id, i.name, i.stock_qty, ii.qty_per_unit
    FROM food_department_intermediate_ingredients ii
    JOIN food_department_ingredients i ON i.id = ii.ingredient_id
    WHERE ii.intermediate_id = p_intermediate_id
    ORDER BY i.id
    FOR UPDATE OF i
  LOOP
    IF v_inp.stock_qty < v_inp.qty_per_unit * p_units THEN
      RAISE EXCEPTION 'Insufficient %: need %, have %',
        v_inp.name, v_inp.qty_per_unit * p_units, v_inp.stock_qty;
    END IF;
  END LOOP;

  -- Deduct each input ingredient.
  FOR v_inp IN
    SELECT ii.ingredient_id AS id, ii.qty_per_unit
    FROM food_department_intermediate_ingredients ii
    WHERE ii.intermediate_id = p_intermediate_id
  LOOP
    UPDATE food_department_ingredients
    SET stock_qty = stock_qty - (v_inp.qty_per_unit * p_units),
        last_updated = now()
    WHERE id = v_inp.id
    RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;
    v_updated_ingredients := v_updated_ingredients || v_row;
  END LOOP;

  -- Increment the intermediate's stock.
  UPDATE food_department_intermediates
  SET stock_qty = stock_qty + p_units
  WHERE id = p_intermediate_id
  RETURNING to_jsonb(food_department_intermediates.*) INTO v_updated_intermediate;

  RETURN jsonb_build_object(
    'success', true,
    'updatedIntermediate', v_updated_intermediate,
    'updatedIngredients', v_updated_ingredients
  );
END;
$$;

-- ─── 3. fd_buy_ingredient ──────────────────────────────
CREATE OR REPLACE FUNCTION fd_buy_ingredient(p_ingredient_id UUID, p_qty NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_row JSONB;
  v_exists BOOLEAN;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity: %', p_qty;
  END IF;

  -- Lock the row first to ensure the existence check and update are atomic.
  PERFORM 1 FROM food_department_ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;
  GET DIAGNOSTICS v_exists = ROW_COUNT;

  IF v_exists = 0 THEN
    RAISE EXCEPTION 'Ingredient not found: %', p_ingredient_id;
  END IF;

  UPDATE food_department_ingredients
  SET stock_qty = stock_qty + p_qty,
      purchased_at = now(),
      last_updated = now()
  WHERE id = p_ingredient_id
  RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;

  RETURN jsonb_build_object('success', true, 'updatedIngredient', v_row);
END;
$$;

-- ============================================
-- Permissions: allow the anon role to call these RPCs (matches the rest
-- of the app's open-access posture). Tighten if you add auth later.
-- ============================================
GRANT EXECUTE ON FUNCTION fd_cook_dish(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fd_prepare_intermediate(UUID, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fd_buy_ingredient(UUID, NUMERIC) TO anon, authenticated;
