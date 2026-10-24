-- ============================================
-- Migration 016 — Ownership column on every food_department_* table (R045, step A)
-- Additive and safe to apply while the old no-sign-in app is still live.
-- Idempotent.
--
-- Adds user_id uuid DEFAULT auth.uid() REFERENCES auth.users, backfills
-- every existing row to the hub owner (mangaonkaraniket@gmail.com) and
-- indexes it. NOT NULL and the owner RLS policies come in 017, after the
-- signed-in app is deployed — until then the old app inserts with the anon
-- key (auth.uid() is null), so the column must stay nullable.
--
-- food_department_dish_insights is a security_invoker view over dishes +
-- cook_history, so it inherits their RLS and needs no column of its own.
-- ============================================

DO $$
DECLARE
  v_owner uuid;
  t text;
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
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE %I SET user_id = $1 WHERE user_id IS NULL', t) USING v_owner;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id)', 'idx_' || t || '_user', t);
  END LOOP;
END $$;
