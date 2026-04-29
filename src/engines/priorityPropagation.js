/**
 * Priority Propagation Engine (Phase 3)
 *
 * Propagates dish priority downward to ingredients and intermediates.
 * Lower number = more urgent (1 = highest, 5 = lowest).
 *
 * Rules:
 *   - Each ingredient inherits the MIN priority across active (non-Cooked) dishes.
 *   - Each intermediate inherits the MIN priority across active dishes that use it.
 *   - An intermediate's input ingredients also inherit that priority.
 *   - Cooked dishes do NOT propagate.
 *   - Ingredients with no active dish references are absent from the map (Map.get → undefined).
 *   - No upward propagation: dish priorities are never modified.
 *
 * Tests: TEST-PP-001 through TEST-PP-006
 */

export function computePriorityPropagation(dishes, dishIngredients, dishIntermediates, intermediates) {
  const ingredientPriorities = new Map();
  const intermediatePriorities = new Map();

  // Cooked dishes do NOT propagate (TEST-PP-002)
  const activeDishes = dishes.filter(d => d.status !== 'Cooked');

  for (const dish of activeDishes) {
    // Dish → ingredients (TEST-PP-001)
    const myIngs = dishIngredients.filter(di => di.dish_id === dish.id);
    for (const e of myIngs) {
      const cur = ingredientPriorities.get(e.ingredient_id) ?? Infinity;
      ingredientPriorities.set(e.ingredient_id, Math.min(cur, dish.priority));
    }

    // Dish → intermediates (TEST-PP-006)
    const myInts = dishIntermediates.filter(di => di.dish_id === dish.id);
    for (const e of myInts) {
      const cur = intermediatePriorities.get(e.intermediate_id) ?? Infinity;
      intermediatePriorities.set(e.intermediate_id, Math.min(cur, dish.priority));
    }
  }

  // Intermediate → input ingredients (TEST-PP-003)
  const interMap = new Map(intermediates.map(i => [i.id, i]));
  for (const [intId, priority] of intermediatePriorities) {
    const inter = interMap.get(intId);
    const inputs = inter?.input_ingredients || [];
    for (const inp of inputs) {
      const ingId = inp.ingredient_id ?? inp.ingredientId;
      if (ingId == null) continue;
      const cur = ingredientPriorities.get(ingId) ?? Infinity;
      ingredientPriorities.set(ingId, Math.min(cur, priority));
    }
  }

  return { ingredientPriorities, intermediatePriorities };
}
