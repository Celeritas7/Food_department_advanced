-- ============================================
-- 000 — Live baseline (food_department_* only), reconstructed 2026-10-18
-- from information_schema / pg_constraint / pg_indexes / pg_policies / pg_views.
-- Source of truth for a FRESH project. On the existing live DB this is a no-op
-- (everything is IF NOT EXISTS) — do not use it to "repair" live.
--
-- Fresh-project order:  000_live_baseline.sql → functions (009, 010, 013, 014 —
-- verified identical to live — plus live/fd_functions_live.sql for
-- fd_store_in_fridge + fd_mark_eaten) → 015+
-- 001–014 stay in the repo as history only; 000 supersedes their DDL
-- (and replaces the lost 005–007).
-- ============================================

-- ─── Tables ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_department_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  country TEXT DEFAULT '',
  unit TEXT DEFAULT 'g',
  stock_qty NUMERIC DEFAULT 0 CHECK (stock_qty >= 0),
  in_stock BOOLEAN DEFAULT false,              -- redundant with stock_qty (P3: derive or drop)
  shelf_life_days INTEGER DEFAULT 7,           -- H5: default should be NULL (P3)
  purchased_at TIMESTAMPTZ,
  priority TEXT DEFAULT '',                    -- text here, integer on dishes (P2/U2)
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_staple BOOLEAN DEFAULT false,
  min_stock_qty NUMERIC,
  restock_reminder_days INTEGER,
  last_reminder_checked TIMESTAMPTZ,
  has_reminder BOOLEAN DEFAULT false,
  emoji TEXT,
  reminder_next_due DATE
);

CREATE TABLE IF NOT EXISTS food_department_intermediates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  country TEXT DEFAULT '',
  unit TEXT DEFAULT 'portions',
  stock_qty NUMERIC DEFAULT 0 CHECK (stock_qty >= 0),
  cooked BOOLEAN DEFAULT false,
  priority TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_department_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Not planned',
  cook_status TEXT DEFAULT '',                 -- legacy duplicate of status (P2: drop)
  cooked BOOLEAN DEFAULT false,                -- legacy duplicate of status (P2: drop)
  cooking_time TEXT DEFAULT '',
  country TEXT DEFAULT '',
  difficulty TEXT DEFAULT '',
  dish_type TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  notes TEXT DEFAULT '',
  url TEXT DEFAULT '',
  last_cooked_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  recipe_data JSONB,
  can_cook BOOLEAN DEFAULT false,              -- stored, never kept in sync; app computes it (P2: drop)
  stored_at TIMESTAMPTZ,
  times_cooked INTEGER DEFAULT 0,
  CONSTRAINT food_department_dishes_status_check CHECK (status = ANY (ARRAY[
    'Planned','Not Planned','Not planned','In Progress','Cooked','In Fridge','Eaten']))
    -- P2: drop 'Not Planned' after normalising rows; drop 'Eaten' (never stored)
);

CREATE TABLE IF NOT EXISTS food_department_dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES food_department_dishes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty NUMERIC DEFAULT 1 CHECK (qty > 0),
  recipe_unit TEXT,
  UNIQUE (dish_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS food_department_dish_intermediates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES food_department_dishes(id) ON DELETE CASCADE,
  intermediate_id UUID NOT NULL REFERENCES food_department_intermediates(id) ON DELETE CASCADE,
  qty NUMERIC DEFAULT 1 CHECK (qty > 0),
  UNIQUE (dish_id, intermediate_id)
);

CREATE TABLE IF NOT EXISTS food_department_intermediate_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intermediate_id UUID NOT NULL REFERENCES food_department_intermediates(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty_per_unit NUMERIC DEFAULT 1 CHECK (qty_per_unit > 0),
  CONSTRAINT food_department_intermediate__intermediate_id_ingredient_id_key UNIQUE (intermediate_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS food_department_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  shop_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_department_ingredient_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES food_department_shops(id) ON DELETE CASCADE,
  price NUMERIC,
  UNIQUE (ingredient_id, shop_id)
);

CREATE TABLE IF NOT EXISTS food_department_cook_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID REFERENCES food_department_dishes(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL,
  cooked_at TIMESTAMPTZ,
  eaten_at TIMESTAMPTZ DEFAULT now(),
  stored_at TIMESTAMPTZ,
  days_in_fridge INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS food_department_general_shopping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',             -- C5: app helper defaults to 'Other' — pick one
  quantity TEXT,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_department_ingredient_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty_cleared NUMERIC NOT NULL,
  unit TEXT,
  reason TEXT NOT NULL CHECK (reason = ANY (ARRAY['used','wasted'])),
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fd_dish_ingredients_dish ON food_department_dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_ingredients_ing ON food_department_dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_intermediates_dish ON food_department_dish_intermediates(dish_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_intermediates_int ON food_department_dish_intermediates(intermediate_id);
CREATE INDEX IF NOT EXISTS idx_fd_dishes_priority ON food_department_dishes(priority);
CREATE INDEX IF NOT EXISTS idx_fd_dishes_status ON food_department_dishes(status);
CREATE INDEX IF NOT EXISTS idx_fd_ingredient_shops_ing ON food_department_ingredient_shops(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_ingredient_shops_shop ON food_department_ingredient_shops(shop_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_log_ingredient ON food_department_ingredient_usage_log(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_log_logged_at ON food_department_ingredient_usage_log(logged_at);
CREATE INDEX IF NOT EXISTS idx_fd_ingredients_name ON food_department_ingredients(name);
CREATE INDEX IF NOT EXISTS idx_fd_ingredients_reminder_due ON food_department_ingredients(reminder_next_due) WHERE has_reminder = true;
CREATE INDEX IF NOT EXISTS idx_fd_intermediate_ingredients_ing ON food_department_intermediate_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_intermediate_ingredients_int ON food_department_intermediate_ingredients(intermediate_id);
-- (cook_history.dish_id index is added by 015)

-- ─── RLS (live state: open to everyone — P8 replaces these) ─
DO $$
DECLARE t TEXT; p TEXT;
BEGIN
  FOR t, p IN VALUES
    ('food_department_cook_history',             'allow_all_cook_history'),
    ('food_department_dish_ingredients',         'Allow all on dish_ingredients'),
    ('food_department_dish_intermediates',       'Allow all on dish_intermediates'),
    ('food_department_dishes',                   'Allow all on dishes'),
    ('food_department_general_shopping',         'allow_all_general_shopping'),
    ('food_department_ingredient_shops',         'Allow all on ingredient_shops'),
    ('food_department_ingredient_usage_log',     'Allow all on ingredient_usage_log'),
    ('food_department_ingredients',              'Allow all on ingredients'),
    ('food_department_intermediate_ingredients', 'Allow all on intermediate_ingredients'),
    ('food_department_intermediates',            'Allow all on intermediates'),
    ('food_department_shops',                    'Allow all on shops')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = p) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)', p, t);
    END IF;
  END LOOP;
END $$;

-- ─── View ───────────────────────────────────────────────
-- security_invoker = true fixes the advisor's SECURITY DEFINER view ERROR.
-- Safe on live too — run this block alone as part of P0.
CREATE OR REPLACE VIEW food_department_dish_insights
WITH (security_invoker = true) AS
SELECT d.id AS dish_id, d.name AS dish_name, d.times_cooked, d.last_cooked_on,
  CASE
    WHEN d.last_cooked_on IS NULL THEN 'Never cooked'
    WHEN now() - d.last_cooked_on < interval '7 days'  THEN 'This week'
    WHEN now() - d.last_cooked_on < interval '14 days' THEN 'Last week'
    WHEN now() - d.last_cooked_on < interval '30 days' THEN 'This month'
    WHEN now() - d.last_cooked_on < interval '90 days' THEN 'Last few months'
    ELSE 'Over 3 months ago'
  END AS last_cooked_label,
  EXTRACT(day FROM now() - d.last_cooked_on)::integer AS days_since_cooked,
  count(h.id) AS total_cook_logs,
  max(h.eaten_at) AS last_eaten_at,
  round(avg(h.days_in_fridge), 1) AS avg_days_in_fridge
FROM food_department_dishes d
LEFT JOIN food_department_cook_history h ON h.dish_id = d.id
GROUP BY d.id, d.name, d.times_cooked, d.last_cooked_on;

-- No triggers on food_department_* tables (checked live).
