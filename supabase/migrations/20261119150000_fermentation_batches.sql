-- Phase 5. Requires owner migrations 016/017 and Phase 1–3 migrations.
-- Independent history: deleting a recipe detaches its batch logs, never removes them.
BEGIN;
CREATE TABLE public.food_department_fermentation_batches (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 dish_id uuid REFERENCES public.food_department_dishes(id) ON DELETE SET NULL,
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
 dish_name text NOT NULL,
 started_at timestamptz NOT NULL CHECK (isfinite(started_at)),
 stage text NOT NULL DEFAULT 'fermenting' CHECK (stage IN ('fermenting','refrigerated','closed','discarded')),
 stage_changed_at timestamptz NOT NULL,
 next_check_at timestamptz CHECK (isfinite(next_check_at)),
 recipe_snapshot jsonb NOT NULL,
 container_snapshot jsonb NOT NULL,
 request_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,user_id)
);
CREATE TABLE public.food_department_fermentation_entries (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 batch_id uuid NOT NULL,
 observed_at timestamptz NOT NULL CHECK (isfinite(observed_at)),
 ph numeric CHECK (ph BETWEEN 0 AND 14),
 temperature_c numeric CHECK (temperature_c > '-Infinity'::numeric AND temperature_c < 'Infinity'::numeric),
 note text NOT NULL DEFAULT '' CHECK (length(note) <= 2000),
 stage text CHECK (stage IN ('fermenting','refrigerated','closed','discarded')),
 set_check boolean NOT NULL DEFAULT false,
 next_check_at timestamptz CHECK (isfinite(next_check_at)),
 request_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(batch_id,user_id) REFERENCES public.food_department_fermentation_batches(id,user_id) ON DELETE CASCADE
);
CREATE INDEX ON public.food_department_fermentation_batches(user_id,dish_id,started_at,id);
CREATE INDEX ON public.food_department_fermentation_batches(user_id,next_check_at);
CREATE INDEX ON public.food_department_fermentation_entries(batch_id,observed_at,id);
ALTER TABLE public.food_department_fermentation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_department_fermentation_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY batch_read ON public.food_department_fermentation_batches FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY batch_insert ON public.food_department_fermentation_batches FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.food_department_dishes d WHERE d.id=dish_id AND d.user_id=auth.uid()));
CREATE POLICY batch_update ON public.food_department_fermentation_batches FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY entry_read ON public.food_department_fermentation_entries FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY entry_insert ON public.food_department_fermentation_entries FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
REVOKE ALL ON public.food_department_fermentation_batches,public.food_department_fermentation_entries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.food_department_fermentation_batches TO authenticated;
GRANT SELECT,INSERT ON public.food_department_fermentation_entries TO authenticated;

CREATE FUNCTION public.fd_freeze_fermentation_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF (NEW.id,NEW.user_id,NEW.name,NEW.dish_name,NEW.started_at,NEW.recipe_snapshot,NEW.container_snapshot,NEW.request_data,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.user_id,OLD.name,OLD.dish_name,OLD.started_at,OLD.recipe_snapshot,OLD.container_snapshot,OLD.request_data,OLD.created_at)
 OR (NEW.dish_id IS DISTINCT FROM OLD.dish_id AND NEW.dish_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Starting batch details are immutable';
 END IF;
 IF NEW.stage_changed_at < NEW.started_at OR NOT isfinite(NEW.stage_changed_at) OR NEW.stage_changed_at > now() THEN RAISE EXCEPTION 'Invalid stage time'; END IF;
 IF OLD.stage IN ('closed','discarded') AND (NEW.stage,NEW.stage_changed_at,NEW.next_check_at) IS DISTINCT FROM (OLD.stage,OLD.stage_changed_at,OLD.next_check_at) THEN RAISE EXCEPTION 'This batch log is closed'; END IF;
 IF NEW.stage IN ('closed','discarded') AND NEW.next_check_at IS NOT NULL THEN RAISE EXCEPTION 'Closed logs cannot schedule checks'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fd_freeze_fermentation_snapshot BEFORE UPDATE ON public.food_department_fermentation_batches FOR EACH ROW EXECUTE FUNCTION public.fd_freeze_fermentation_snapshot();
REVOKE ALL ON FUNCTION public.fd_freeze_fermentation_snapshot() FROM PUBLIC,anon;

CREATE FUNCTION public.fd_start_fermentation_batch(p_dish_id uuid,p_batch_id uuid,p_name text,p_started_at timestamptz,p_container_id text DEFAULT NULL,p_container_label text DEFAULT '',p_next_check_at timestamptz DEFAULT NULL,p_note text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE b food_department_fermentation_batches; e food_department_fermentation_entries; d food_department_dishes; req jsonb; snap jsonb; container jsonb; scale numeric;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 req=jsonb_build_object('dish',p_dish_id,'name',btrim(p_name),'start',p_started_at,'containerId',p_container_id,'containerLabel',btrim(coalesce(p_container_label,'')),'next',p_next_check_at,'note',btrim(coalesce(p_note,'')));
 -- Lock a stable key even before a batch exists, making simultaneous retries serial.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_batch_id::text,0));
 SELECT * INTO b FROM food_department_fermentation_batches WHERE id=p_batch_id AND user_id=auth.uid();
 IF FOUND THEN
  IF b.request_data IS DISTINCT FROM req THEN RAISE EXCEPTION 'Batch request ID already used with different details'; END IF;
  SELECT * INTO e FROM food_department_fermentation_entries WHERE batch_id=b.id AND request_data=req ORDER BY created_at,id LIMIT 1;
  RETURN jsonb_build_object('batch',to_jsonb(b),'entry',to_jsonb(e));
 END IF;
 IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 120 OR p_started_at IS NULL OR NOT isfinite(p_started_at) OR p_started_at>now() OR length(coalesce(p_note,''))>2000 OR length(coalesce(p_container_label,''))>120 OR (p_next_check_at IS NOT NULL AND NOT isfinite(p_next_check_at)) THEN RAISE EXCEPTION 'Review batch name, dates and notes'; END IF;
 SELECT * INTO d FROM food_department_dishes WHERE id=p_dish_id AND user_id=auth.uid() FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recipe not found'; END IF;
 scale=coalesce((d.recipe_data->>'batchScale')::numeric,1);
 IF NOT (scale>0 AND scale<=1000) THEN RAISE EXCEPTION 'Save a valid recipe batch scale'; END IF;
 SELECT jsonb_build_object('recipeData',d.recipe_data,'batchScale',scale,'ingredients',coalesce(jsonb_agg(jsonb_build_object('ingredientId',i.id,'name',i.name,'baseQuantity',l.qty,'unit',coalesce(nullif(l.recipe_unit,''),i.unit),'plannedQuantity',l.qty*scale) ORDER BY i.id),'[]'::jsonb)) INTO snap
 FROM food_department_dish_ingredients l JOIN food_department_ingredients i ON i.id=l.ingredient_id AND i.user_id=auth.uid() WHERE l.dish_id=d.id AND l.user_id=auth.uid();
 -- Preparations are also preserved as planned recipe inputs; never deducted here.
 snap=snap || jsonb_build_object('preparations',coalesce((SELECT jsonb_agg(jsonb_build_object('preparationId',i.id,'name',i.name,'baseQuantity',l.qty,'plannedQuantity',l.qty*scale,'unit',i.unit) ORDER BY i.id) FROM food_department_dish_intermediates l JOIN food_department_intermediates i ON i.id=l.intermediate_id AND i.user_id=auth.uid() WHERE l.dish_id=d.id AND l.user_id=auth.uid()),'[]'::jsonb));
 IF p_container_id IS NOT NULL THEN
  SELECT value INTO container FROM jsonb_array_elements(coalesce(d.recipe_data#>'{supplies,equipment}','[]')) WHERE value->>'id'=p_container_id AND value->>'type'='container';
  IF container IS NULL THEN RAISE EXCEPTION 'Container not found; reload recipe supplies'; END IF;
 ELSE container=jsonb_build_object('name',btrim(coalesce(p_container_label,'')),'capacityMl',NULL); END IF;
 INSERT INTO food_department_fermentation_batches(id,dish_id,name,dish_name,started_at,stage_changed_at,next_check_at,recipe_snapshot,container_snapshot,request_data)
 VALUES(p_batch_id,d.id,btrim(p_name),d.name,p_started_at,p_started_at,p_next_check_at,snap,container,req) RETURNING * INTO b;
 INSERT INTO food_department_fermentation_entries(id,batch_id,observed_at,note,stage,set_check,next_check_at,request_data)
 VALUES(gen_random_uuid(),b.id,p_started_at,btrim(coalesce(p_note,'')),'fermenting',true,p_next_check_at,req) RETURNING * INTO e;
 RETURN jsonb_build_object('batch',to_jsonb(b),'entry',to_jsonb(e));
END $$;

CREATE FUNCTION public.fd_append_fermentation_entry(p_batch_id uuid,p_entry_id uuid,p_observed_at timestamptz,p_ph numeric DEFAULT NULL,p_temperature_c numeric DEFAULT NULL,p_note text DEFAULT '',p_stage text DEFAULT NULL,p_next_check_at timestamptz DEFAULT NULL,p_set_check boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE b food_department_fermentation_batches; e food_department_fermentation_entries; req jsonb;
BEGIN
 SELECT * INTO b FROM food_department_fermentation_batches WHERE id=p_batch_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF;
 req=jsonb_build_object('batch',p_batch_id,'observed',p_observed_at,'ph',p_ph,'temperature',p_temperature_c,'note',btrim(coalesce(p_note,'')),'stage',p_stage,'next',p_next_check_at,'setCheck',p_set_check);
 SELECT * INTO e FROM food_department_fermentation_entries WHERE id=p_entry_id AND user_id=auth.uid();
 IF FOUND THEN
  IF e.request_data IS DISTINCT FROM req THEN RAISE EXCEPTION 'Observation request ID already used with different details'; END IF;
  RETURN jsonb_build_object('batch',to_jsonb(b),'entry',to_jsonb(e));
 END IF;
 IF b.stage IN ('closed','discarded') THEN RAISE EXCEPTION 'This batch log is closed'; END IF;
 IF p_observed_at IS NULL OR NOT isfinite(p_observed_at) OR p_observed_at<b.started_at OR p_observed_at>now() THEN RAISE EXCEPTION 'Observation time must be between the batch start and now'; END IF;
 IF (p_ph IS NOT NULL AND NOT(p_ph BETWEEN 0 AND 14)) OR (p_temperature_c IS NOT NULL AND NOT(p_temperature_c>'-Infinity'::numeric AND p_temperature_c<'Infinity'::numeric)) OR length(coalesce(p_note,''))>2000 OR (p_next_check_at IS NOT NULL AND NOT isfinite(p_next_check_at)) OR p_set_check IS NULL THEN RAISE EXCEPTION 'Review pH, temperature, notes and check time'; END IF;
 IF p_stage IS NOT NULL AND (p_stage NOT IN ('fermenting','refrigerated','closed','discarded') OR p_stage=b.stage OR p_observed_at<b.stage_changed_at) THEN RAISE EXCEPTION 'Invalid stage change or stage time'; END IF;
 IF p_ph IS NULL AND p_temperature_c IS NULL AND btrim(coalesce(p_note,''))='' AND p_stage IS NULL AND NOT p_set_check THEN RAISE EXCEPTION 'Add a reading, note, stage or check change'; END IF;
 IF NOT p_set_check AND p_next_check_at IS NOT NULL THEN RAISE EXCEPTION 'Select change next check'; END IF;
 INSERT INTO food_department_fermentation_entries(id,batch_id,observed_at,ph,temperature_c,note,stage,set_check,next_check_at,request_data)
 VALUES(p_entry_id,b.id,p_observed_at,p_ph,p_temperature_c,btrim(coalesce(p_note,'')),p_stage,p_set_check,p_next_check_at,req) RETURNING * INTO e;
 UPDATE food_department_fermentation_batches SET stage=coalesce(p_stage,stage),stage_changed_at=CASE WHEN p_stage IS NOT NULL THEN p_observed_at ELSE stage_changed_at END,
 next_check_at=CASE WHEN p_stage IN ('closed','discarded') THEN NULL WHEN p_set_check THEN p_next_check_at ELSE next_check_at END,updated_at=now() WHERE id=b.id RETURNING * INTO b;
 RETURN jsonb_build_object('batch',to_jsonb(b),'entry',to_jsonb(e));
END $$;
REVOKE ALL ON FUNCTION public.fd_start_fermentation_batch(uuid,uuid,text,timestamptz,text,text,timestamptz,text),public.fd_append_fermentation_entry(uuid,uuid,timestamptz,numeric,numeric,text,text,timestamptz,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fd_start_fermentation_batch(uuid,uuid,text,timestamptz,text,text,timestamptz,text),public.fd_append_fermentation_entry(uuid,uuid,timestamptz,numeric,numeric,text,text,timestamptz,boolean) TO authenticated;
COMMIT;
