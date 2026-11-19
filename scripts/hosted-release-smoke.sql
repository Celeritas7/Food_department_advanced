-- Operator-only smoke test, not an app RPC. Execute this ENTIRE file together.
-- Set request.jwt.claim.sub to an existing app-owner UUID before SET LOCAL ROLE.
-- Uses only newly generated fixture IDs; ROLLBACK leaves no test records behind.
BEGIN;
-- OWNER_SETTING_PLACEHOLDER
SET LOCAL ROLE authenticated;
DO $$
DECLARE a uuid; b uuid; dish uuid; batch uuid=gen_random_uuid(); second uuid=gen_random_uuid(); event uuid=gen_random_uuid(); started timestamptz=now()-interval '2 hours'; result jsonb; caught boolean=false;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Set an existing owner UUID before running the test'; END IF;
 INSERT INTO public.food_department_ingredients(name,unit,stock_qty,stock_status,aliases) VALUES('Release smoke A','g',800,'known','["Smoke alias"]') RETURNING id INTO a;
 INSERT INTO public.food_department_ingredients(name,unit,stock_qty,stock_status) VALUES('Release smoke B','g',500,'known') RETURNING id INTO b;
 INSERT INTO public.food_department_dishes(name,status,recipe_data) VALUES('Release smoke recipe','In Progress','{"batchScale":0.5,"ingredientGroups":[],"supplies":{"equipment":[{"id":"jar","type":"container","name":"Smoke jar","capacityMl":1000,"quantity":1}]}}') RETURNING id INTO dish;
 INSERT INTO public.food_department_dish_ingredients(dish_id,ingredient_id,qty,recipe_unit) VALUES(dish,a,800,'g');
 PERFORM public.fd_cook_dish(dish);
 IF (SELECT stock_qty FROM public.food_department_ingredients WHERE id=a)<>400 THEN RAISE EXCEPTION 'Scaled cook deduction failed'; END IF;
 PERFORM public.fd_revert_dish(dish,true);
 IF (SELECT stock_qty FROM public.food_department_ingredients WHERE id=a)<>800 THEN RAISE EXCEPTION 'Cook revert failed'; END IF;
 PERFORM public.fd_substitute_dish_ingredient(dish,a,b,600,'g','Release smoke');
 PERFORM public.fd_cook_dish(dish);
 IF (SELECT stock_qty FROM public.food_department_ingredients WHERE id=b)<>200 OR (SELECT stock_qty FROM public.food_department_ingredients WHERE id=a)<>800 THEN RAISE EXCEPTION 'Substitution deduction failed'; END IF;
 PERFORM public.fd_revert_dish(dish,true);
 IF (SELECT stock_qty FROM public.food_department_ingredients WHERE id=b)<>500 THEN RAISE EXCEPTION 'Substitution revert failed'; END IF;
 result=public.fd_start_fermentation_batch(dish,batch,'Smoke batch',started,'jar','',now()-interval '1 minute','Start');
 IF result#>>'{batch,recipe_snapshot,batchScale}'<>'0.5' OR result#>>'{batch,container_snapshot,capacityMl}'<>'1000' THEN RAISE EXCEPTION 'Starting snapshot failed'; END IF;
 PERFORM public.fd_start_fermentation_batch(dish,batch,'Smoke batch',started,'jar','',now()-interval '1 minute','Start');
 IF (SELECT count(*) FROM public.food_department_fermentation_batches WHERE id=batch)<>1 THEN RAISE EXCEPTION 'Duplicate start'; END IF;
 PERFORM public.fd_start_fermentation_batch(dish,second,'Independent batch',started,NULL,'Other jar',NULL,'');
 PERFORM public.fd_append_fermentation_entry(batch,event,now()-interval '30 minutes',4.2,18,'Measured','refrigerated',NULL,true);
 PERFORM public.fd_append_fermentation_entry(batch,event,now()-interval '30 minutes',4.2,18,'Measured','refrigerated',NULL,true);
 IF (SELECT count(*) FROM public.food_department_fermentation_entries WHERE batch_id=batch)<>2 THEN RAISE EXCEPTION 'Duplicate observation'; END IF;
 UPDATE public.food_department_dishes SET recipe_data=jsonb_set(recipe_data,'{batchScale}','2') WHERE id=dish;
 IF (SELECT recipe_snapshot->>'batchScale' FROM public.food_department_fermentation_batches WHERE id=batch)<>'0.5' THEN RAISE EXCEPTION 'Snapshot changed'; END IF;
 PERFORM public.fd_append_fermentation_entry(batch,gen_random_uuid(),now()-interval '1 minute',NULL,NULL,'Close','closed',NULL,false);
 IF (SELECT next_check_at IS NOT NULL FROM public.food_department_fermentation_batches WHERE id=batch) THEN RAISE EXCEPTION 'Closed check retained'; END IF;
 BEGIN
  PERFORM public.fd_append_fermentation_entry(batch,gen_random_uuid(),now(),4,NULL,'After closing',NULL,NULL,false);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%log is closed%' THEN RAISE; END IF; caught=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'Closed log accepted a new observation'; END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 IF EXISTS(SELECT 1 FROM public.food_department_dishes WHERE id=dish) OR EXISTS(SELECT 1 FROM public.food_department_fermentation_batches WHERE id IN(batch,second)) OR EXISTS(SELECT 1 FROM public.food_department_fermentation_entries WHERE batch_id=batch) THEN RAISE EXCEPTION 'Other owner can see fixture records'; END IF;
 caught=false;
 BEGIN
  PERFORM public.fd_append_fermentation_entry(batch,gen_random_uuid(),now(),4,NULL,'Other owner',NULL,NULL,false);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%Batch not found%' THEN RAISE; END IF; caught=true;
 END;
 IF NOT caught THEN RAISE EXCEPTION 'Other owner could append to the batch'; END IF;
END $$;
ROLLBACK;
