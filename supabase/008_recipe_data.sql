-- Add recipe_data JSONB column to dishes
ALTER TABLE food_department_dishes 
ADD COLUMN IF NOT EXISTS recipe_data JSONB DEFAULT NULL;

COMMENT ON COLUMN food_department_dishes.recipe_data IS 'Full recipe: ingredientGroups, preparation, cookingSteps, serve';
