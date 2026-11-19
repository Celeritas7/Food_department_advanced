-- Phase 3: alternate names for the same pantry item, explicit recipe replacements.
-- Apply after Phase 1 and Phase 2. Existing stocks and recipe links are unchanged.
CREATE OR REPLACE FUNCTION public.fd_valid_ingredient_aliases(p_aliases jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE a jsonb;
BEGIN
 IF jsonb_typeof(p_aliases) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
 IF jsonb_array_length(p_aliases)>50 THEN RETURN false; END IF;
 FOR a IN SELECT * FROM jsonb_array_elements(p_aliases) LOOP
  IF jsonb_typeof(a) IS DISTINCT FROM 'string' OR length(trim(a#>>'{}')) NOT BETWEEN 1 AND 120 THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END; $$;
ALTER TABLE public.food_department_ingredients ADD COLUMN aliases jsonb NOT NULL DEFAULT '[]'::jsonb
 CONSTRAINT fd_ingredient_aliases_valid CHECK(public.fd_valid_ingredient_aliases(aliases));
REVOKE ALL ON FUNCTION public.fd_valid_ingredient_aliases(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fd_valid_ingredient_aliases(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.fd_substitute_dish_ingredient(
 p_dish_id uuid, p_original_id uuid, p_replacement_id uuid,
 p_qty numeric, p_unit text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE d food_department_dishes%ROWTYPE; old_link food_department_dish_ingredients%ROWTYPE;
 original food_department_ingredients%ROWTYPE; replacement food_department_ingredients%ROWTYPE;
 recipe jsonb; groups jsonb; history jsonb; entry jsonb; result_link jsonb;
BEGIN
 SELECT * INTO d FROM food_department_dishes WHERE id=p_dish_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recipe not found'; END IF;
 IF d.status NOT IN ('Planned','Not planned','Not Planned','In Progress') OR d.last_cook_deductions IS NOT NULL THEN
  RAISE EXCEPTION 'Finish or revert the cooked dish before changing its ingredients';
 END IF;
 IF p_original_id IS NULL OR p_replacement_id IS NULL OR p_original_id=p_replacement_id THEN RAISE EXCEPTION 'Choose a different pantry ingredient'; END IF;
 IF p_qty IS NULL OR p_qty<=0 OR p_qty::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Replacement amount must be finite and positive'; END IF;
 IF p_unit IS NULL OR length(trim(p_unit)) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Enter the replacement unit'; END IF;
 IF length(coalesce(p_note,''))>1000 THEN RAISE EXCEPTION 'Substitution note is too long'; END IF;
 SELECT * INTO old_link FROM food_department_dish_ingredients WHERE dish_id=p_dish_id AND ingredient_id=p_original_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recipe ingredient changed; refresh before substituting'; END IF;
 IF EXISTS(SELECT 1 FROM food_department_dish_ingredients WHERE dish_id=p_dish_id AND ingredient_id=p_replacement_id) THEN
  RAISE EXCEPTION 'Replacement is already in this recipe; edit its existing amount instead';
 END IF;
 -- Owner RLS scopes all three entities. Lock pantry metadata in stable order.
 PERFORM 1 FROM food_department_ingredients WHERE id IN (p_original_id,p_replacement_id) ORDER BY id FOR UPDATE;
 SELECT * INTO original FROM food_department_ingredients WHERE id=p_original_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Original ingredient not found'; END IF;
 SELECT * INTO replacement FROM food_department_ingredients WHERE id=p_replacement_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Replacement ingredient not found'; END IF;
 recipe:=coalesce(d.recipe_data,'{}'::jsonb);
 IF jsonb_typeof(recipe)<>'object' THEN RAISE EXCEPTION 'Recipe data needs review before substitution'; END IF;
 IF jsonb_typeof(recipe->'ingredientGroups')='array' THEN
  SELECT coalesce(jsonb_agg(CASE WHEN jsonb_typeof(g->'items')='array' THEN jsonb_set(g,'{items}',
   (SELECT coalesce(jsonb_agg(CASE WHEN item->>'ingredientId'=p_original_id::text THEN item || jsonb_build_object(
    'ingredientId',p_replacement_id,'linkedName',replacement.name,'linkedUnit',replacement.unit,
    'linkedStock',replacement.stock_qty,'qty',p_qty,'unit',trim(p_unit)) ELSE item END ORDER BY item_order),'[]'::jsonb)
    FROM jsonb_array_elements(g->'items') WITH ORDINALITY AS items(item,item_order))) ELSE g END ORDER BY group_order),'[]'::jsonb)
   INTO groups FROM jsonb_array_elements(recipe->'ingredientGroups') WITH ORDINALITY AS groups(g,group_order);
  recipe:=jsonb_set(recipe,'{ingredientGroups}',groups);
 END IF;
 history:=CASE WHEN jsonb_typeof(recipe->'substitutionHistory')='array' THEN recipe->'substitutionHistory' ELSE '[]'::jsonb END;
 entry:=jsonb_build_object('originalId',original.id,'originalName',original.name,'originalQty',old_link.qty,
  'originalUnit',coalesce(old_link.recipe_unit,original.unit),'replacementId',replacement.id,'replacementName',replacement.name,
  'qty',p_qty,'unit',trim(p_unit),'note',nullif(trim(p_note),''),'at',now());
 recipe:=jsonb_set(recipe,'{substitutionHistory}',history || jsonb_build_array(entry));
 UPDATE food_department_dish_ingredients SET ingredient_id=p_replacement_id,qty=p_qty,recipe_unit=trim(p_unit)
  WHERE id=old_link.id RETURNING to_jsonb(food_department_dish_ingredients.*) INTO result_link;
 UPDATE food_department_dishes SET recipe_data=recipe WHERE id=p_dish_id RETURNING * INTO d;
 RETURN jsonb_build_object('dish',to_jsonb(d),'link',result_link);
END; $$;
REVOKE ALL ON FUNCTION public.fd_substitute_dish_ingredient(uuid,uuid,uuid,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fd_substitute_dish_ingredient(uuid,uuid,uuid,numeric,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
