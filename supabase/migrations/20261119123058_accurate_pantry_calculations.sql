-- Phase 1: explicit stock certainty and confirmed, ingredient-specific conversions.
-- Apply after 017. Existing quantities and recipe links are retained.
ALTER TABLE public.food_department_ingredients
  ADD COLUMN stock_status text,
  ADD COLUMN unit_conversions jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.food_department_ingredients SET stock_status = CASE
  WHEN stock_qty IS NULL THEN 'check'
  WHEN stock_qty = 0 AND in_stock THEN 'have_unknown' ELSE 'known' END;
ALTER TABLE public.food_department_ingredients
  ALTER COLUMN stock_status SET DEFAULT 'known',
  ALTER COLUMN stock_status SET NOT NULL,
  ADD CONSTRAINT fd_stock_status CHECK (stock_status IN ('known', 'have_unknown', 'check')),
  ADD CONSTRAINT fd_conversion_array CHECK (jsonb_typeof(unit_conversions) = 'array');
ALTER TABLE public.food_department_intermediate_ingredients ADD COLUMN recipe_unit text;

CREATE OR REPLACE FUNCTION public.fd_normalize_unit(p_unit text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT CASE lower(trim(coalesce(p_unit,'')))
 WHEN 'gm' THEN 'g' WHEN 'gms' THEN 'g' WHEN 'gram' THEN 'g' WHEN 'grams' THEN 'g' WHEN 'kilogram' THEN 'kg' WHEN 'kilograms' THEN 'kg'
 WHEN 'milliliter' THEN 'ml' WHEN 'milliliters' THEN 'ml' WHEN 'millilitre' THEN 'ml' WHEN 'millilitres' THEN 'ml'
 WHEN 'liter' THEN 'l' WHEN 'liters' THEN 'l' WHEN 'litre' THEN 'l' WHEN 'litres' THEN 'l'
 WHEN 'piece' THEN 'pieces' WHEN 'pc' THEN 'pieces' WHEN 'pcs' THEN 'pieces'
 WHEN 'tablespoon' THEN 'tbsp' WHEN 'tablespoons' THEN 'tbsp' WHEN 'teaspoon' THEN 'tsp' WHEN 'teaspoons' THEN 'tsp'
 WHEN 'cups' THEN 'cup' WHEN 'cloves' THEN 'clove' WHEN 'bulbs' THEN 'bulb' WHEN 'packs' THEN 'pack' WHEN 'slices' THEN 'slice'
 ELSE lower(trim(coalesce(p_unit,''))) END;
$$;

CREATE OR REPLACE FUNCTION public.fd_stock_quantity(p_qty numeric, p_unit text, p_stock_unit text, p_conversions jsonb)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE a text := fd_normalize_unit(coalesce(nullif(trim(p_unit),''),p_stock_unit));
 b text := fd_normalize_unit(p_stock_unit); c jsonb; factor numeric; matches integer;
BEGIN
 IF p_qty IS NULL OR p_qty <= 0 OR p_qty::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Quantity must be finite and positive'; END IF;
 IF a = b THEN RETURN p_qty; END IF;
 IF a IN ('g','kg') AND b IN ('g','kg') OR a IN ('ml','l') AND b IN ('ml','l') THEN
   RETURN p_qty * CASE WHEN a IN ('kg','l') THEN 1000 ELSE 1 END / CASE WHEN b IN ('kg','l') THEN 1000 ELSE 1 END;
 END IF;
 SELECT count(*) INTO matches FROM jsonb_array_elements(p_conversions) e WHERE fd_normalize_unit(e->>'unit')=a;
 IF matches = 1 THEN
  SELECT e INTO c FROM jsonb_array_elements(p_conversions) e WHERE fd_normalize_unit(e->>'unit')=a;
  factor := (c->>'stock_qty')::numeric;
  IF c->'confirmed' = 'true'::jsonb AND factor > 0 AND factor::text NOT IN ('NaN','Infinity','-Infinity') THEN RETURN p_qty * factor; END IF;
 END IF;
 RAISE EXCEPTION 'Confirm conversion: % to %', a,b;
END; $$;

-- Keep the old presence flag in sync, validate saved conversions, and prevent
-- stale clients from deducting an unmeasured quantity. No privileged bypass.
CREATE OR REPLACE FUNCTION public.fd_validate_pantry()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c jsonb; seen text[] := '{}'; key text;
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.unit IS DISTINCT FROM OLD.unit THEN
   IF EXISTS (SELECT 1 FROM food_department_dishes d,
     LATERAL jsonb_array_elements(d.last_cook_deductions->'ingredients') e
     WHERE (e->>'ingredient_id')::uuid = OLD.id) THEN
    RAISE EXCEPTION 'Revert or finish the cooked dish before changing this pantry unit';
   END IF;
   -- Pin implicit legacy recipe units before changing the pantry unit.
   UPDATE food_department_dish_ingredients SET recipe_unit=OLD.unit
     WHERE ingredient_id=OLD.id AND nullif(trim(recipe_unit),'') IS NULL;
   UPDATE food_department_intermediate_ingredients SET recipe_unit=OLD.unit
     WHERE ingredient_id=OLD.id AND nullif(trim(recipe_unit),'') IS NULL;
   IF NEW.unit_conversions = OLD.unit_conversions THEN NEW.unit_conversions := '[]'; END IF;
  END IF;
  IF NEW.stock_qty < OLD.stock_qty AND NEW.stock_status <> 'known' THEN
   RAISE EXCEPTION 'Check and enter measured pantry stock first';
  END IF;
 END IF;
 IF NEW.stock_status = 'known' AND (NEW.stock_qty IS NULL OR NEW.stock_qty::text IN ('NaN','Infinity','-Infinity')) THEN
  RAISE EXCEPTION 'Measured stock must be finite';
 END IF;
 FOR c IN SELECT * FROM jsonb_array_elements(NEW.unit_conversions) LOOP
  key := fd_normalize_unit(c->>'unit');
  IF key='' OR key=ANY(seen) OR c->'confirmed' IS DISTINCT FROM 'true'::jsonb OR
   coalesce((c->>'stock_qty')::numeric,0) <= 0 OR (c->>'stock_qty')::numeric::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'Conversions need unique units, finite positive amounts and confirmation';
  END IF;
  seen := array_append(seen,key);
 END LOOP;
 NEW.in_stock := NEW.stock_status='have_unknown' OR (NEW.stock_status='known' AND NEW.stock_qty > 0);
 RETURN NEW;
END; $$;
CREATE TRIGGER fd_validate_pantry BEFORE INSERT OR UPDATE ON public.food_department_ingredients
 FOR EACH ROW EXECUTE FUNCTION public.fd_validate_pantry();

-- Overrides carry their displayed unit; legacy callers fall back to recipe units.
CREATE OR REPLACE FUNCTION public.fd_cook_dish_with_overrides(
  p_dish_id uuid, p_ingredient_overrides jsonb, p_intermediate_overrides jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE
  v_dish  food_department_dishes%ROWTYPE;
  v_row   JSONB; v_ovr JSONB; v_id UUID; v_qty NUMERIC; v_name TEXT; v_stock NUMERIC;
  v_ig food_department_ingredients%ROWTYPE; v_recipe_unit text;
  v_ded_ings JSONB := '[]'::jsonb;
  v_ded_ints JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_dish FROM food_department_dishes WHERE id = p_dish_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found: %', p_dish_id; END IF;
  IF v_dish.status NOT IN ('Planned', 'In Progress') THEN
    RAISE EXCEPTION 'Cannot cook from status % (must be Planned or In Progress)', v_dish.status;
  END IF;

  IF jsonb_typeof(p_ingredient_overrides) IS DISTINCT FROM 'array' OR jsonb_typeof(p_intermediate_overrides) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Cook quantities must be arrays';
  END IF;
  IF jsonb_array_length(p_ingredient_overrides) + jsonb_array_length(p_intermediate_overrides) = 0 THEN RAISE EXCEPTION 'No linked requirements'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_ingredient_overrides) e GROUP BY e->>'ingredient_id' HAVING count(*) > 1)
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_intermediate_overrides) e GROUP BY e->>'intermediate_id' HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate cook quantities';
  END IF;
  IF (SELECT count(*) FROM food_department_dish_ingredients WHERE dish_id=p_dish_id) <> jsonb_array_length(p_ingredient_overrides)
   OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_ingredient_overrides) e WHERE NOT EXISTS
    (SELECT 1 FROM food_department_dish_ingredients di WHERE di.dish_id=p_dish_id AND di.ingredient_id=(e->>'ingredient_id')::uuid))
   OR (SELECT count(*) FROM food_department_dish_intermediates WHERE dish_id=p_dish_id) <> jsonb_array_length(p_intermediate_overrides)
   OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_intermediate_overrides) e WHERE NOT EXISTS
    (SELECT 1 FROM food_department_dish_intermediates di WHERE di.dish_id=p_dish_id AND di.intermediate_id=(e->>'intermediate_id')::uuid)) THEN
    RAISE EXCEPTION 'Recipe links changed; reopen the Cook dialog';
  END IF;

  -- Ingredients: validate + lock, then deduct
  IF p_ingredient_overrides IS NOT NULL AND jsonb_typeof(p_ingredient_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) ORDER BY (value->>'ingredient_id') LOOP
      v_id := (v_ovr->>'ingredient_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      IF v_id IS NULL OR v_qty IS NULL THEN RAISE EXCEPTION 'Malformed ingredient override: %', v_ovr; END IF;
      IF v_qty <= 0 OR v_qty::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Ingredient qty must be > 0 (got % for %)', v_qty, v_id; END IF;
      SELECT * INTO v_ig FROM food_department_ingredients WHERE id = v_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ingredient not found: %', v_id; END IF;
      IF v_ig.stock_status <> 'known' THEN RAISE EXCEPTION 'Check stock: %', v_ig.name; END IF;
      SELECT recipe_unit INTO v_recipe_unit FROM food_department_dish_ingredients WHERE dish_id=p_dish_id AND ingredient_id=v_id;
      v_qty := fd_stock_quantity(v_qty, coalesce(v_ovr->>'unit',v_recipe_unit),v_ig.unit,v_ig.unit_conversions);
      v_name := v_ig.name; v_stock := v_ig.stock_qty;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ingredient not found: %', v_id; END IF;
      IF v_stock < v_qty THEN RAISE EXCEPTION 'Insufficient %: need %, have %', v_name, v_qty, v_stock; END IF;
    END LOOP;
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_ingredient_overrides) LOOP
      v_id := (v_ovr->>'ingredient_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      SELECT * INTO v_ig FROM food_department_ingredients WHERE id=v_id;
      SELECT recipe_unit INTO v_recipe_unit FROM food_department_dish_ingredients WHERE dish_id=p_dish_id AND ingredient_id=v_id;
      v_qty := fd_stock_quantity(v_qty,coalesce(v_ovr->>'unit',v_recipe_unit),v_ig.unit,v_ig.unit_conversions);
      UPDATE food_department_ingredients SET stock_qty = stock_qty - v_qty, last_updated = now()
      WHERE id = v_id RETURNING to_jsonb(food_department_ingredients.*) INTO v_row;
      v_ded_ings := v_ded_ings || jsonb_build_object('ingredient_id', v_id, 'qty_deducted', v_qty, 'unit', v_ig.unit, 'row', v_row);
    END LOOP;
  END IF;

  -- Intermediates: same
  IF p_intermediate_overrides IS NOT NULL AND jsonb_typeof(p_intermediate_overrides) = 'array' THEN
    FOR v_ovr IN SELECT * FROM jsonb_array_elements(p_intermediate_overrides) ORDER BY (value->>'intermediate_id') LOOP
      v_id := (v_ovr->>'intermediate_id')::uuid; v_qty := (v_ovr->>'qty')::numeric;
      IF v_id IS NULL OR v_qty IS NULL THEN RAISE EXCEPTION 'Malformed intermediate override: %', v_ovr; END IF;
      IF v_qty <= 0 OR v_qty::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Intermediate qty must be > 0 (got % for %)', v_qty, v_id; END IF;
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

CREATE OR REPLACE FUNCTION fd_prepare_intermediate(p_intermediate_id UUID, p_units NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_inter food_department_intermediates%ROWTYPE;
  v_inp RECORD;
  v_updated_ingredients JSONB := '[]'::jsonb;
  v_updated_intermediate JSONB;
  v_row JSONB;
BEGIN
  IF p_units IS NULL OR p_units <= 0 OR p_units::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Invalid quantity: %', p_units;
  END IF;

  SELECT * INTO v_inter
  FROM food_department_intermediates
  WHERE id = p_intermediate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intermediate not found: %', p_intermediate_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM food_department_intermediate_ingredients WHERE intermediate_id=p_intermediate_id) THEN RAISE EXCEPTION 'No linked inputs'; END IF;

  -- Lock + validate every input ingredient (ordered by id to avoid deadlock).
  FOR v_inp IN
    SELECT i.id, i.name, i.stock_qty, i.stock_status, fd_stock_quantity(ii.qty_per_unit,ii.recipe_unit,i.unit,i.unit_conversions) AS qty_per_unit
    FROM food_department_intermediate_ingredients ii
    JOIN food_department_ingredients i ON i.id = ii.ingredient_id
    WHERE ii.intermediate_id = p_intermediate_id
    ORDER BY i.id
    FOR UPDATE OF i
  LOOP
    IF v_inp.stock_status <> 'known' THEN RAISE EXCEPTION 'Check stock: %', v_inp.name; END IF;
    IF v_inp.stock_qty < v_inp.qty_per_unit * p_units THEN
      RAISE EXCEPTION 'Insufficient %: need %, have %',
        v_inp.name, v_inp.qty_per_unit * p_units, v_inp.stock_qty;
    END IF;
  END LOOP;

  -- Deduct each input ingredient.
  FOR v_inp IN
    SELECT ii.ingredient_id AS id, fd_stock_quantity(ii.qty_per_unit,ii.recipe_unit,i.unit,i.unit_conversions) AS qty_per_unit
    FROM food_department_intermediate_ingredients ii
    JOIN food_department_ingredients i ON i.id=ii.ingredient_id
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

-- Legacy cook entry point uses the same conversion/locking/snapshot path.
CREATE OR REPLACE FUNCTION public.fd_cook_dish(p_dish_id uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ings jsonb; preps jsonb; result jsonb; dish_row jsonb;
BEGIN
 PERFORM 1 FROM food_department_dishes WHERE id=p_dish_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('ingredient_id',ingredient_id,'qty',qty,'unit',recipe_unit)),'[]')
 INTO ings FROM food_department_dish_ingredients WHERE dish_id=p_dish_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('intermediate_id',intermediate_id,'qty',qty)),'[]')
 INTO preps FROM food_department_dish_intermediates WHERE dish_id=p_dish_id;
 result := fd_cook_dish_with_overrides(p_dish_id,ings,preps);
 SELECT to_jsonb(d) INTO dish_row FROM food_department_dishes d WHERE id=p_dish_id;
 RETURN jsonb_build_object('success',true,'updatedDish',dish_row,
  'updatedIngredients',(SELECT coalesce(jsonb_agg(e->'row'),'[]') FROM jsonb_array_elements(result->'deducted_ingredients') e),
  'updatedIntermediates',(SELECT coalesce(jsonb_agg(e->'row'),'[]') FROM jsonb_array_elements(result->'deducted_intermediates') e));
END; $$;
REVOKE ALL ON FUNCTION public.fd_normalize_unit(text), public.fd_stock_quantity(numeric,text,text,jsonb), public.fd_validate_pantry() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fd_normalize_unit(text), public.fd_stock_quantity(numeric,text,text,jsonb), public.fd_validate_pantry() TO authenticated;
-- Existing RPC grants remain unchanged (SECURITY INVOKER, owner RLS applies).
NOTIFY pgrst, 'reload schema';

-- Purchases keep an unknown balance unknown; numeric increments remain atomic.
CREATE OR REPLACE FUNCTION fd_buy_ingredient(
  p_ingredient_id UUID,
  p_qty NUMERIC,
  p_purchased_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_exists INTEGER;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 OR p_qty::text IN ('NaN','Infinity','-Infinity') THEN
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

-- Reconcile the legacy presence flag without changing any stored quantities.
UPDATE public.food_department_ingredients
SET in_stock = stock_status='have_unknown' OR (stock_status='known' AND stock_qty > 0);
