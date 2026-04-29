/**
 * Availability Engine
 * Evaluates per-dish whether it can be cooked based on current stock
 * Tests: TEST-AV-001 through TEST-AV-008
 */

export function checkDishAvailability(dish, dishIngs, dishInts, ingredients, intermediates) {
  // Skip cooked dishes (TEST-AV-007)
  if (dish.status === 'Cooked') {
    return { canCook: false, skipped: true, missing: [], missingInts: [], missingIngredients: [], missingIntermediates: [] };
  }

  const myIngs = dishIngs.filter(di => di.dish_id === dish.id);
  const myInts = dishInts.filter(di => di.dish_id === dish.id);

  // Unlinked dish (TEST-AV-001)
  if (!myIngs.length && !myInts.length) {
    return { canCook: false, unlinked: true, missing: [], missingInts: [], missingIngredients: [], missingIntermediates: [] };
  }

  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const intMap = new Map(intermediates.map(i => [i.id, i]));

  // Check ingredients (TEST-AV-002, AV-008)
  const missing = myIngs.filter(e => {
    const ig = ingMap.get(e.ingredient_id);
    return !ig || ig.stock_qty < e.qty;
  }).map(e => {
    const ig = ingMap.get(e.ingredient_id);
    return { ingredientId: e.ingredient_id, name: ig?.name || '?', required: e.qty, available: ig?.stock_qty || 0 };
  });

  // Check intermediates (TEST-AV-004, AV-005)
  const missingInts = myInts.filter(e => {
    const it = intMap.get(e.intermediate_id);
    return !it || it.stock_qty < e.qty;
  }).map(e => {
    const it = intMap.get(e.intermediate_id);
    return { intermediateId: e.intermediate_id, name: it?.name || '?', required: e.qty, available: it?.stock_qty || 0 };
  });

  return {
    canCook: missing.length === 0 && missingInts.length === 0,
    unlinked: false,
    missing,
    missingInts,
    missingIngredients: missing,
    missingIntermediates: missingInts,
    totalIngs: myIngs.length,
    totalInts: myInts.length,
    haveIngs: myIngs.length - missing.length,
    haveInts: myInts.length - missingInts.length,
    completeness: myIngs.length + myInts.length > 0
      ? Math.round(((myIngs.length - missing.length) + (myInts.length - missingInts.length)) / (myIngs.length + myInts.length) * 100)
      : 0,
  };
}

/**
 * Phase 2 batch wrapper.
 * Returns a Map<dishId, { canCook, missingIngredients, missingIntermediates }>
 * for every planned dish. Cooked dishes are skipped entirely (omitted from the map).
 */
export function computeAvailability(dishes, dishIngs, dishInts, ingredients, intermediates) {
  const result = new Map();
  for (const dish of dishes) {
    if (dish.status === 'Cooked') continue;
    const r = checkDishAvailability(dish, dishIngs, dishInts, ingredients, intermediates);
    result.set(dish.id, {
      canCook: r.canCook,
      missingIngredients: r.missingIngredients,
      missingIntermediates: r.missingIntermediates,
    });
  }
  return result;
}

export function checkIntermediateAvailability(inter, intIngs, ingredients) {
  const inputs = intIngs.filter(ii => ii.intermediate_id === inter.id);
  if (!inputs.length) return { canPrepare: false, unlinked: true };

  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const ok = inputs.every(inp => {
    const ig = ingMap.get(inp.ingredient_id);
    return ig && ig.stock_qty >= inp.qty_per_unit;
  });

  return { canPrepare: ok, unlinked: false };
}
