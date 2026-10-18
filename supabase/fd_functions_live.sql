-- Live fd_* function definitions, pulled from pg_get_functiondef on 2026-10-18.
-- Part of the P0 baseline. Read-only reference — P1 (015) rewrites three of these.
-- Diff vs repo: fd_cook_dish_with_overrides matches 014; fd_revert_dish matches 013;
-- fd_buy_ingredient matches 010; fd_cook_dish / fd_prepare_intermediate match 009;
-- fd_mark_eaten and fd_store_in_fridge had NO file in the repo until now.

CREATE OR REPLACE FUNCTION public.fd_store_in_fridge(p_dish_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $function$
DECLARE
  v_dish food_department_dishes%ROWTYPE;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;
  IF v_dish.status != 'Cooked' THEN
    RAISE EXCEPTION 'Dish must be Cooked before storing in fridge (current: %)', v_dish.status;
  END IF;
  UPDATE food_department_dishes SET status = 'In Fridge', stored_at = now() WHERE id = p_dish_id;
  RETURN jsonb_build_object('success', true, 'stored_at', now());
END;
$function$;

-- LIVE VERSION (has the 'Not Planned' bug — fixed in 015)
CREATE OR REPLACE FUNCTION public.fd_mark_eaten(p_dish_id uuid, p_notes text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql AS $function$
DECLARE
  v_dish food_department_dishes%ROWTYPE;
  v_days_in_fridge INTEGER;
  v_history_id UUID;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;
  IF v_dish.status != 'In Fridge' THEN
    RAISE EXCEPTION 'Dish is not in fridge (current status: %)', v_dish.status;
  END IF;
  v_days_in_fridge := EXTRACT(DAY FROM (now() - v_dish.stored_at))::INTEGER;
  INSERT INTO food_department_cook_history (dish_id, dish_name, cooked_at, eaten_at, stored_at, days_in_fridge, notes)
  VALUES (v_dish.id, v_dish.name, v_dish.last_cooked_on, now(), v_dish.stored_at, v_days_in_fridge, p_notes)
  RETURNING id INTO v_history_id;
  UPDATE food_department_dishes
  SET status = 'Not Planned', stored_at = NULL, times_cooked = COALESCE(times_cooked, 0) + 1
  WHERE id = p_dish_id;
  RETURN jsonb_build_object('success', true, 'history_id', v_history_id,
    'days_in_fridge', v_days_in_fridge, 'times_cooked', v_dish.times_cooked + 1);
END;
$function$;

-- Inferred cook_history columns (from fd_mark_eaten's INSERT):
--   id, dish_id, dish_name, cooked_at, eaten_at, stored_at, days_in_fridge, notes
-- Inferred dish columns not in 001: cooked BOOLEAN, stored_at TIMESTAMPTZ,
--   times_cooked INTEGER, last_cooked_on TIMESTAMPTZ
