-- Phase 2: recipe links remain original-batch quantities.
-- Apply after accurate_pantry_calculations. Override RPC amounts are already
-- actual quantities, so only the legacy recipe-driven entry point scales.
CREATE OR REPLACE FUNCTION public.fd_cook_dish(p_dish_id uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_factor numeric; ings jsonb; preps jsonb; result jsonb; dish_row jsonb;
BEGIN
 PERFORM 1 FROM food_department_dishes WHERE id=p_dish_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Dish not found'; END IF;
 SELECT coalesce((recipe_data->>'batchScale')::numeric,1) INTO v_factor FROM food_department_dishes WHERE id=p_dish_id;
 IF v_factor <= 0 OR v_factor > 1000 OR v_factor::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Batch multiplier must be greater than 0 and at most 1000';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('ingredient_id',ingredient_id,'qty',qty*v_factor,'unit',recipe_unit)),'[]')
 INTO ings FROM food_department_dish_ingredients WHERE dish_id=p_dish_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('intermediate_id',intermediate_id,'qty',qty*v_factor)),'[]')
 INTO preps FROM food_department_dish_intermediates WHERE dish_id=p_dish_id;
 result := fd_cook_dish_with_overrides(p_dish_id,ings,preps);
 SELECT to_jsonb(d) INTO dish_row FROM food_department_dishes d WHERE id=p_dish_id;
 RETURN jsonb_build_object('success',true,'updatedDish',dish_row,
  'updatedIngredients',(SELECT coalesce(jsonb_agg(e->'row'),'[]') FROM jsonb_array_elements(result->'deducted_ingredients') e),
  'updatedIntermediates',(SELECT coalesce(jsonb_agg(e->'row'),'[]') FROM jsonb_array_elements(result->'deducted_intermediates') e));
END; $$;
NOTIFY pgrst, 'reload schema';
