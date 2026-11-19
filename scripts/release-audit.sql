-- Read-only catalog checks for an operator account; not an application RPC.
-- No row contents, DDL, writes or workflow RPCs. Passes are structural evidence,
-- not proof of the exact migration body or successful signed-in behavior.
WITH expected_columns(table_name,column_name,data_type) AS (VALUES
 ('food_department_ingredients','stock_status','text'),
 ('food_department_ingredients','unit_conversions','jsonb'),
 ('food_department_ingredients','aliases','jsonb'),
 ('food_department_intermediate_ingredients','recipe_unit','text')
), expected_functions(signature) AS (VALUES
 ('public.fd_stock_quantity(numeric,text,text,jsonb)'),
 ('public.fd_cook_dish_with_overrides(uuid,jsonb,jsonb)'),
 ('public.fd_prepare_intermediate(uuid,numeric)'),
 ('public.fd_buy_ingredient(uuid,numeric,timestamptz)'),
 ('public.fd_cook_dish(uuid)'),
 ('public.fd_substitute_dish_ingredient(uuid,uuid,uuid,numeric,text,text)'),
 ('public.fd_start_fermentation_batch(uuid,uuid,text,timestamptz,text,text,timestamptz,text)'),
 ('public.fd_append_fermentation_entry(uuid,uuid,timestamptz,numeric,numeric,text,text,timestamptz,boolean)')
), expected_tables(name) AS (VALUES
 ('food_department_ingredients'),('food_department_intermediates'),('food_department_dishes'),
 ('food_department_dish_ingredients'),('food_department_dish_intermediates'),('food_department_intermediate_ingredients'),
 ('food_department_fermentation_batches'),('food_department_fermentation_entries')
), checks AS (
 SELECT 'column:'||e.table_name||'.'||e.column_name AS check_name,
 EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=e.table_name AND c.column_name=e.column_name AND c.data_type=e.data_type) AS passed
 FROM expected_columns e
 UNION ALL
 SELECT 'function:'||e.signature, EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure(e.signature) AND NOT p.prosecdef
 AND p.proconfig::text LIKE '%search_path=%' AND has_function_privilege('authenticated',p.oid,'EXECUTE') AND NOT has_function_privilege('anon',p.oid,'EXECUTE')) FROM expected_functions e
 UNION ALL
 SELECT 'owner-rls:'||e.name, EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname=e.name AND c.relrowsecurity
 AND EXISTS(SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=e.name AND 'authenticated'=ANY(p.roles) AND p.qual LIKE '%user_id%auth.uid()%')
 AND EXISTS(SELECT 1 FROM information_schema.columns col WHERE col.table_schema='public' AND col.table_name=e.name AND col.column_name='user_id' AND col.is_nullable='NO')
 AND NOT has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')) FROM expected_tables e
 UNION ALL
 SELECT 'batch-scale-body-marker', coalesce((SELECT p.prosrc LIKE '%batchScale%' FROM pg_proc p WHERE p.oid=to_regprocedure('public.fd_cook_dish(uuid)')),false)
 UNION ALL
 SELECT 'fermentation-snapshot-trigger', EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=to_regclass('public.food_department_fermentation_batches') AND t.tgname='fd_freeze_fermentation_snapshot' AND t.tgenabled='O' AND NOT t.tgisinternal)
 UNION ALL
 SELECT 'fermentation-entry-append-only', coalesce((SELECT has_table_privilege('authenticated',c.oid,'SELECT') AND has_table_privilege('authenticated',c.oid,'INSERT') AND NOT has_table_privilege('authenticated',c.oid,'UPDATE,DELETE') FROM pg_class c WHERE c.oid=to_regclass('public.food_department_fermentation_entries')),false)
)
SELECT check_name, passed FROM checks ORDER BY check_name;
