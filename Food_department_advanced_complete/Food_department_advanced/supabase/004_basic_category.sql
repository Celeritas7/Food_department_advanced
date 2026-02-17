-- Migration: Recategorize common staples as "Basic"
-- Run this in Supabase SQL Editor to update existing data

UPDATE food_department_ingredients
SET category = 'Basic'
WHERE lower(name) IN (
  'salt', 'sugar', 'white sugar', 'brown sugar', 'pepper', 'black pepper',
  'water', 'vinegar', 'vegetable oil', 'cooking oil',
  'cornstarch', 'potato starch', 'baking soda',
  'soy sauce', 'mirin', 'sake'
)
OR lower(name) LIKE '%egg%'
OR lower(name) LIKE '%salt%';

-- Verify
SELECT name, category FROM food_department_ingredients
WHERE category = 'Basic'
ORDER BY name;
