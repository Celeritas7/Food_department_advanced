-- ============================================
-- Migration 015 — Revert & cook correctness (P1: H1, H2, H3 + fd_mark_eaten)
-- Apply AFTER a DB backup. Idempotent.
--
-- Fixes
--   H1  revert restored stock on BOTH In Fridge→Cooked and Cooked→Planned
--   H2  revert from Cooked deleted a cook_history row and decremented
--       times_cooked — both are written only by fd_mark_eaten
--   H3  revert restored recipe quantities, not what was actually deducted
--   M1  fd_mark_eaten wrote 'Not Planned' (capital P)
--   +   fd_undo_eaten: the correct inverse of fd_mark_eaten (where the H2
--       logic actually belongs) — gives the UI an undo toast after "Eaten"
--   +   search_path pinned on every fd_* function; index on cook_history
--
-- Note: 'Eaten' is never a stored status — fd_mark_eaten resets the dish to
-- 'Not planned'. The old Eaten→In Fridge revert branch was unreachable and is
-- replaced by fd_undo_eaten(history_id).
-- ============================================

-- ─── 1. Snapshot column: what the last cook actually deducted ──────
ALTER TABLE food_department_dishes
  ADD COLUMN IF NOT EXISTS last_cook_deductions JSONB;
COMMENT ON COLUMN food_department_dishes.last_cook_deductions IS
  '{"ingredients":[{"ingredient_id","qty_deducted"}],"intermediates":[{"intermediate_id","qty_deducted"}]} written by fd_cook_dish_with_overrides, consumed and cleared by fd_revert_dish';

CREATE INDEX IF NOT EXISTS idx_fd_cook_history_dish ON food_department_cook_history(dish_id);

-- ─── 2. fd_cook_dish_with_overrides — now stores the snapshot ───────
CREATE OR REPLACE FUNCTION public.fd_cook_dish_with_overrides(
  p_dish_id uuid, p_ingredient_overrides jsonb, p_intermediate_overrides jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE
  v_dish  food_department_dishes%ROWTYPE;
  v_row   JSONB; v_ovr JSONB; v_id UUID; v_qty NUMERIC; v_name TEXT; v_stock NUMERIC;
  v_ded_ings JSONB := '[]'::jsonb;
  v_ded_ints JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;
  IF v_dish.status NOT IN ('Planned', 'In Progress') THEN
    RAISE EXCEPTION 'Cannot cook from status % (must be Planned or In Progress)', v_dish.status;
  END IF;

  -- Ingredients: validate + lock, then deduct
  IF p_ingredient_overrides IS NOT NULL AND jsonb_typeof(p_ingredient_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) ORDER BY (value->>'ingredient_id') LOOP
      v_id := (v_ovr->>'ingredient_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      IF v_id IS NULL OR v_qty IS NULL THEN RAISE EXCEPTION 'Malformed ingredient override: %', v_ovr; END IF;
      IF v_qty <= 0 THEN RAISE EXCEPTION 'Ingredient qty must be > 0 (got % for %)', v_qty, v_id; END IF;
      SELECT name, stock_qty INTO v_name, v_stock FROM food_department_ingredients WHERE id = v_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ingredient not found: %', v_id; END IF;
      IF v_stock < v_qty THEN RAISE EXCEPTION 'Insufficient %: need %, have %', v_name, v_qty, v_stock; END IF;
    END LOOP;
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) LOOP
      v_id := (v_ovr->>'ingredient_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      UPDATE food_department_ingredients SET stock_qty = stock_qty - v_qty, last_updated = now()
      WHERE id = v_id RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;
      v_ded_ings := v_ded_ings || jsonb_build_object('ingredient_id', v_id, 'qty_deducted', v_qty, 'row', v_row);
    END LOOP;
  END IF;

  -- Intermediates: same
  IF p_intermediate_overrides IS NOT NULL AND jsonb_typeof(p_intermediate_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_intermediate_overrides) ORDER BY (value->>'intermediate_id') LOOP
      v_id := (v_ovr->>'intermediate_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      IF v_id IS NULL OR v_qty IS NULL THEN RAISE EXCEPTION 'Malformed intermediate override: %', v_ovr; END IF;
      IF v_qty <= 0 THEN RAISE EXCEPTION 'Intermediate qty must be > 0 (got % for %)', v_qty, v_id; END IF;
      SELECT name, stock_qty INTO v_name, v_stock FROM food_department_intermediates WHERE id = v_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Intermediate not found: %', v_id; END IF;
      IF v_stock < v_qty THEN RAISE EXCEPTION 'Insufficient %: need %, have %', v_name, v_qty, v_stock; END IF;
    END LOOP;
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_intermediate_overrides) LOOP
      v_id := (v_ovr->>'intermediate_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      UPDATE food_department_intermediates SET stock_qty = stock_qty - v_qty
      WHERE id = v_id RETURNING to_jsonb(food_department_intermediates.*) INTO v_row;
      v_ded_ints := v_ded_ints || jsonb_build_object('intermediate_id', v_id, 'qty_deducted', v_qty, 'row', v_row);
    END LOOP;
  END IF;

  UPDATE food_department_dishes
  SET status = 'Cooked', cooked = true, last_cooked_on = now(),
      -- strip the bulky 'row' copies; keep only what revert needs
      last_cook_deductions = jsonb_build_object(
        'ingredients',   (SELECT COALESCE(jsonb_agg(e - 'row'), '[]'::jsonb) FROM jsonb_array_elements(v_ded_ings) e),
        'intermediates', (SELECT COALESCE(jsonb_agg(e - 'row'), '[]'::jsonb) FROM jsonb_array_elements(v_ded_ints) e),
        'cooked_at', now())
  WHERE id = p_dish_id;

  RETURN jsonb_build_object('dish_id', p_dish_id, 'to_status', 'Cooked',
    'deducted_ingredients', v_ded_ings, 'deducted_intermediates', v_ded_ints);
END;
$function$;

-- ─── 3. fd_revert_dish — restore once, from the snapshot, no history edits ─
-- Same signature + return type → CREATE OR REPLACE keeps existing grants (no DROP).
CREATE OR REPLACE FUNCTION public.fd_revert_dish(p_dish_id uuid, p_restore_stock boolean)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE
  v_dish food_department_dishes%ROWTYPE;
  v_to   TEXT; v_e JSONB; v_restored BOOLEAN := false; v_source TEXT := NULL;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;

  IF v_dish.status = 'In Fridge' THEN
    -- Status only. Stock was deducted at cook time; it comes back on the next step.
    UPDATE food_department_dishes SET status = 'Cooked', stored_at = NULL WHERE id = p_dish_id;
    v_to := 'Cooked';

  ELSIF v_dish.status = 'Cooked' THEN
    v_to := 'Planned';
    IF p_restore_stock THEN
      IF v_dish.last_cook_deductions IS NOT NULL THEN
        v_source := 'snapshot';
        FOR v_e IN SELECT * FROM jsonb_array_elements(v_dish.last_cook_deductions->'ingredients') ORDER BY (value->>'ingredient_id') LOOP
          UPDATE food_department_ingredients
          SET stock_qty = stock_qty + (v_e->>'qty_deducted')::numeric, last_updated = now()
          WHERE id = (v_e->>'ingredient_id')::uuid;
        END LOOP;
        FOR v_e IN SELECT * FROM jsonb_array_elements(v_dish.last_cook_deductions->'intermediates') ORDER BY (value->>'intermediate_id') LOOP
          UPDATE food_department_intermediates
          SET stock_qty = stock_qty + (v_e->>'qty_deducted')::numeric
          WHERE id = (v_e->>'intermediate_id')::uuid;
        END LOOP;
      ELSE
        -- Dish was cooked before 015: best effort from recipe quantities.
        v_source := 'recipe';
        UPDATE food_department_ingredients i SET stock_qty = i.stock_qty + di.qty, last_updated = now()
        FROM food_department_dish_ingredients di WHERE di.dish_id = p_dish_id AND i.id = di.ingredient_id;
        UPDATE food_department_intermediates t SET stock_qty = t.stock_qty + di.qty
        FROM food_department_dish_intermediates di WHERE di.dish_id = p_dish_id AND t.id = di.intermediate_id;
      END IF;
      v_restored := true;
    END IF;
    -- No times_cooked change, no cook_history delete (H2). Clear the snapshot
    -- so a second revert can never restore again (H1).
    UPDATE food_department_dishes
    SET status = 'Planned', cooked = false, last_cooked_on = NULL, last_cook_deductions = NULL
    WHERE id = p_dish_id;

  ELSE
    RAISE EXCEPTION 'Cannot revert from status % (use fd_undo_eaten to reverse an Eaten log)', v_dish.status;
  END IF;

  RETURN jsonb_build_object('dish_id', p_dish_id, 'from_status', v_dish.status, 'to_status', v_to,
    'restored_stock', v_restored, 'restore_source', v_source);
END;
$function$;

-- ─── 4. fd_mark_eaten — lowercase status, null-safe counter ────────
CREATE OR REPLACE FUNCTION public.fd_mark_eaten(p_dish_id uuid, p_notes text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE
  v_dish food_department_dishes%ROWTYPE;
  v_days INTEGER; v_hist UUID;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;
  IF v_dish.status != 'In Fridge' THEN
    RAISE EXCEPTION 'Dish is not in fridge (current status: %)', v_dish.status;
  END IF;
  v_days := GREATEST(0, (now()::date - v_dish.stored_at::date));
  INSERT INTO food_department_cook_history (dish_id, dish_name, cooked_at, eaten_at, stored_at, days_in_fridge, notes)
  VALUES (v_dish.id, v_dish.name, v_dish.last_cooked_on, now(), v_dish.stored_at, v_days, p_notes)
  RETURNING id INTO v_hist;
  UPDATE food_department_dishes
  SET status = 'Not planned', cooked = false, stored_at = NULL, last_cook_deductions = NULL,
      times_cooked = COALESCE(times_cooked, 0) + 1
  WHERE id = p_dish_id;
  RETURN jsonb_build_object('success', true, 'history_id', v_hist, 'days_in_fridge', v_days,
    'times_cooked', COALESCE(v_dish.times_cooked, 0) + 1);
END;
$function$;

-- ─── 5. fd_undo_eaten — the real inverse of fd_mark_eaten ──────────
CREATE OR REPLACE FUNCTION public.fd_undo_eaten(p_history_id uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE
  v_h food_department_cook_history%ROWTYPE;
BEGIN
  SELECT * INTO v_h FROM food_department_cook_history WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'History row not found (undo window may have passed): %', p_history_id; END IF;
  PERFORM 1 FROM food_department_dishes WHERE id = v_h.dish_id AND status = 'Not planned' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish has moved on since it was marked eaten; cannot undo'; END IF;
  UPDATE food_department_dishes
  SET status = 'In Fridge', cooked = true, stored_at = COALESCE(v_h.stored_at, now()),
      last_cooked_on = COALESCE(v_h.cooked_at, last_cooked_on),
      times_cooked = GREATEST(COALESCE(times_cooked, 0) - 1, 0)
  WHERE id = v_h.dish_id;
  DELETE FROM food_department_cook_history WHERE id = p_history_id;
  RETURN jsonb_build_object('success', true, 'dish_id', v_h.dish_id, 'to_status', 'In Fridge');
END;
$function$;

-- ─── 6. Pin search_path on the untouched fd_* functions ────────────
ALTER FUNCTION public.fd_buy_ingredient(uuid, numeric, timestamptz) SET search_path = public;
ALTER FUNCTION public.fd_cook_dish(uuid) SET search_path = public;
ALTER FUNCTION public.fd_prepare_intermediate(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.fd_store_in_fridge(uuid) SET search_path = public;

GRANT EXECUTE ON FUNCTION public.fd_undo_eaten(uuid) TO anon, authenticated;

-- ─── Verification (run after) ───────────────────────────────────────
-- SELECT proname, proconfig FROM pg_proc WHERE proname LIKE 'fd\_%';  -- all show {search_path=public}
-- Manual: cook a dish with a 400 g override on a 200 g recipe → revert with restore
--   → ingredient stock equals the pre-cook value; second revert raises; cook_history unchanged.
