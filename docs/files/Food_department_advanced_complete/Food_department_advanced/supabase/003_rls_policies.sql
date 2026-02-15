-- ============================================
-- Row Level Security Policies
-- Run this if you want public access (no auth)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE food_department_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_intermediates ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_dish_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_dish_intermediates ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_intermediate_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_department_ingredient_shops ENABLE ROW LEVEL SECURITY;

-- Allow full access (for personal app without auth)
CREATE POLICY "Allow all on ingredients" ON food_department_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on intermediates" ON food_department_intermediates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on dishes" ON food_department_dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on dish_ingredients" ON food_department_dish_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on dish_intermediates" ON food_department_dish_intermediates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on intermediate_ingredients" ON food_department_intermediate_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ingredient_shops" ON food_department_ingredient_shops FOR ALL USING (true) WITH CHECK (true);

-- Shops table
ALTER TABLE food_department_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on shops" ON food_department_shops FOR ALL USING (true) WITH CHECK (true);
