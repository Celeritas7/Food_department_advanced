-- ============================================
-- Migration: extend fd_buy_ingredient with optional p_purchased_at
-- so backdated purchases stay fully atomic (no follow-up UPDATE).
-- ============================================

-- The 2-arg signature must be dropped before redefining with a defaulted
-- third parameter; CREATE OR REPLACE cannot change the parameter list.
DROP FUNCTION IF EXISTS fd_buy_ingredient(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION fd_buy_ingredient(
  p_ingredient_id UUID,
  p_qty NUMERIC,
  p_purchased_at TIMESTAMPTZ DEFAULT NULL
)
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

  -- Reject backdating into the future: a "purchase" that hasn't happened
  -- yet would invert the spoilage timeline.
  IF p_purchased_at IS NOT NULL AND p_purchased_at > now() THEN
    RAISE EXCEPTION 'p_purchased_at cannot be in the future: %', p_purchased_at;
  END IF;

  -- Lock the row first so existence check and update are atomic.
  PERFORM 1 FROM food_department_ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;
  GET DIAGNOSTICS v_exists = ROW_COUNT;

  IF v_exists = 0 THEN
    RAISE EXCEPTION 'Ingredient not found: %', p_ingredient_id;
  END IF;

  UPDATE food_department_ingredients
  SET stock_qty = stock_qty + p_qty,
      purchased_at = COALESCE(p_purchased_at, now()),
      last_updated = now()
  WHERE id = p_ingredient_id
  RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;

  RETURN jsonb_build_object('success', true, 'updatedIngredient', v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION fd_buy_ingredient(UUID, NUMERIC, TIMESTAMPTZ) TO anon, authenticated;
