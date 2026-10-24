-- ============================================
-- Migration 017 — Owner RLS on every food_department_* table (R045, step B)
-- Apply ONLY after the signed-in build (Google sign-in, x-akatsuki-app: food)
-- is live: from here on the anon key reads and writes nothing.
-- Idempotent.
--
--   1. Backfill rows the old anon app inserted after 016 (user_id null)
--   2. user_id NOT NULL
--   3. Drop the old allow-all policies; one owner policy per table,
--      TO authenticated, user_id = auth.uid() for read and write
--   4. Revoke anon on the tables and on every fd_* RPC (all are
--      SECURITY INVOKER, so RLS already scopes what they touch)
-- ============================================

DO $$
DECLARE
  v_owner uuid;
  t text;
  p record;
  f record;
  tables text[] := ARRAY[
    'food_department_ingredients',
    'food_department_intermediates',
    'food_department_dishes',
    'food_department_dish_ingredients',
    'food_department_dish_intermediates',
    'food_department_intermediate_ingredients',
    'food_department_shops',
    'food_department_ingredient_shops',
    'food_department_cook_history',
    'food_department_ingredient_usage_log',
    'food_department_general_shopping'
  ];
BEGIN
  SELECT id INTO v_owner FROM auth.users WHERE email = 'mangaonkaraniket@gmail.com';
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'owner account mangaonkaraniket@gmail.com not found in auth.users';
  END IF;

  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('UPDATE %I SET user_id = $1 WHERE user_id IS NULL', t) USING v_owner;
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON %I', p.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t || '_owner', t);

    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;

  REVOKE ALL ON food_department_dish_insights FROM anon;

  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'fd\_%'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
  END LOOP;
END $$;
