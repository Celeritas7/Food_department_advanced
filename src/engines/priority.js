/**
 * Priority Propagation Engine
 * Propagates dish priority downward to intermediates and ingredients
 * Tests: TEST-PP-001 through TEST-PP-006
 */

export function propagatePriorities(dishes, dishIngs, dishInts, intIngs) {
  const activeDishes = dishes.filter(d =>
    d.status === 'Planned' || d.status === 'In Progress'
  );
  const ingPriorities = new Map();
  const intPriorities = new Map();

  for (const dish of activeDishes) {
    const myIngs = dishIngs.filter(di => di.dish_id === dish.id);
    const myInts = dishInts.filter(di => di.dish_id === dish.id);

    // Direct ingredient priorities
    for (const e of myIngs) {
      const cur = ingPriorities.get(e.ingredient_id) ?? Infinity;
      ingPriorities.set(e.ingredient_id, Math.min(cur, dish.priority));
    }

    // Intermediate priorities
    for (const e of myInts) {
      const cur = intPriorities.get(e.intermediate_id) ?? Infinity;
      intPriorities.set(e.intermediate_id, Math.min(cur, dish.priority));
    }
  }

  // Propagate intermediate priority to their input ingredients
  for (const [intId, priority] of intPriorities) {
    const inputs = intIngs.filter(ii => ii.intermediate_id === intId);
    for (const inp of inputs) {
      const cur = ingPriorities.get(inp.ingredient_id) ?? Infinity;
      ingPriorities.set(inp.ingredient_id, Math.min(cur, priority));
    }
  }

  return { ingredientPriorities: ingPriorities, intermediatePriorities: intPriorities };
}
