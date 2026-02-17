-- ============================================
-- COOKING APP — Supabase Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. SHOPS
CREATE TABLE IF NOT EXISTS food_department_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  shop_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INGREDIENTS
CREATE TABLE IF NOT EXISTS food_department_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  country TEXT DEFAULT '',
  unit TEXT DEFAULT 'g',
  stock_qty NUMERIC DEFAULT 0 CHECK (stock_qty >= 0),
  in_stock BOOLEAN DEFAULT false,
  shelf_life_days INTEGER DEFAULT 7,
  purchased_at TIMESTAMPTZ,
  priority TEXT DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INTERMEDIATES (Base Preparations)
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

-- 4. DISHES (Cooked Food / Final Dishes)
CREATE TABLE IF NOT EXISTS food_department_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Not planned' CHECK (status IN ('Not planned', 'Planned', 'In Progress', 'Cooked')),
  cook_status TEXT DEFAULT '',
  cooked BOOLEAN DEFAULT false,
  cooking_time TEXT DEFAULT '',
  country TEXT DEFAULT '',
  difficulty TEXT DEFAULT '',
  dish_type TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  notes TEXT DEFAULT '',
  url TEXT DEFAULT '',
  last_cooked_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. JUNCTION: dish ↔ ingredient
CREATE TABLE IF NOT EXISTS food_department_dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES food_department_dishes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty NUMERIC DEFAULT 1 CHECK (qty > 0),
  UNIQUE(dish_id, ingredient_id)
);

-- 6. JUNCTION: dish ↔ intermediate
CREATE TABLE IF NOT EXISTS food_department_dish_intermediates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES food_department_dishes(id) ON DELETE CASCADE,
  intermediate_id UUID NOT NULL REFERENCES food_department_intermediates(id) ON DELETE CASCADE,
  qty NUMERIC DEFAULT 1 CHECK (qty > 0),
  UNIQUE(dish_id, intermediate_id)
);

-- 7. JUNCTION: intermediate ↔ ingredient (inputs for preparation)
CREATE TABLE IF NOT EXISTS food_department_intermediate_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intermediate_id UUID NOT NULL REFERENCES food_department_intermediates(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  qty_per_unit NUMERIC DEFAULT 1 CHECK (qty_per_unit > 0),
  UNIQUE(intermediate_id, ingredient_id)
);

-- 8. JUNCTION: ingredient ↔ shop (which shops sell which ingredients)
CREATE TABLE IF NOT EXISTS food_department_ingredient_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES food_department_ingredients(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES food_department_shops(id) ON DELETE CASCADE,
  price NUMERIC,
  UNIQUE(ingredient_id, shop_id)
);

-- ============================================
-- INDEXES for query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fd_ingredients_name ON food_department_ingredients(name);
CREATE INDEX IF NOT EXISTS idx_fd_dishes_status ON food_department_dishes(status);
CREATE INDEX IF NOT EXISTS idx_fd_dishes_priority ON food_department_dishes(priority);
CREATE INDEX IF NOT EXISTS idx_fd_dish_ingredients_dish ON food_department_dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_ingredients_ing ON food_department_dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_intermediates_dish ON food_department_dish_intermediates(dish_id);
CREATE INDEX IF NOT EXISTS idx_fd_dish_intermediates_int ON food_department_dish_intermediates(intermediate_id);
CREATE INDEX IF NOT EXISTS idx_fd_intermediate_ingredients_int ON food_department_intermediate_ingredients(intermediate_id);
CREATE INDEX IF NOT EXISTS idx_fd_intermediate_ingredients_ing ON food_department_intermediate_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_ingredient_shops_ing ON food_department_ingredient_shops(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_fd_ingredient_shops_shop ON food_department_ingredient_shops(shop_id);

-- ============================================
-- ROW LEVEL SECURITY (optional — enable if using auth)
-- ============================================
-- ALTER TABLE food_department_ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE food_department_intermediates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE food_department_dishes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE food_department_dish_ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE food_department_dish_intermediates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE food_department_intermediate_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_ingredient_shops ENABLE ROW LEVEL SECURITY;

-- For public access (no auth), add policies:
-- CREATE POLICY "Allow all" ON food_department_ingredients FOR ALL USING (true);
-- (repeat for each table)
