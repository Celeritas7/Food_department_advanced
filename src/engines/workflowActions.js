/**
 * Workflow Actions Engine (Phase 6)
 *
 * Pure, in-memory state transitions for the three core workflows.
 * Inputs are never mutated; each action validates first and only then
 * builds the new state, so atomicity ("all-or-nothing") is trivially
 * preserved — a failed action throws before any updated objects exist.
 *
 * Callers receive the updated entities and persist them to Supabase
 * separately. On throw, no state changes need to be rolled back since
 * none were ever applied.
 *
 * Tests: TEST-WF-001 through TEST-WF-010
 */
import { checkDishAvailability } from './availability.js';

// ─── ACTION 1 ─────────────────────────────────────────────
// Note: spec's literal 5-arg signature is missing the dish→intermediate
// junction needed for WF-004. Added `dishInts` as the 4th positional arg
// to match the same shape used in availability.js / quantityAggregation.js.
export function cookDish(dishId, dishes, dishIngs, dishInts, ingredients, intermediates) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) throw new Error('Dish not found');
  if (dish.status === 'Cooked') throw new Error('Dish is already cooked');

  const av = checkDishAvailability(dish, dishIngs, dishInts, ingredients, intermediates);
  if (!av.canCook) {
    const missing = [
      ...(av.missingIngredients || []).map(m => m.name),
      ...(av.missingIntermediates || []).map(m => m.name),
    ].join(', ');
    throw new Error(`Cannot cook ${dish.name}: missing ${missing || 'requirements'}`);
  }

  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const intMap = new Map(intermediates.map(i => [i.id, i]));

  // Compute new ingredient stock — second-pass safety: refuse any negative result.
  const updatedIngredients = [];
  for (const e of dishIngs.filter(di => di.dish_id === dishId)) {
    const ig = ingMap.get(e.ingredient_id);
    if (!ig) throw new Error(`Ingredient ${e.ingredient_id} not found`);
    const newStock = ig.stock_qty - e.qty;
    if (newStock < 0) throw new Error(`Insufficient ${ig.name}: need ${e.qty}, have ${ig.stock_qty}`);
    updatedIngredients.push({ ...ig, stock_qty: newStock });
  }

  // Compute new intermediate stock with the same safety check.
  const updatedIntermediates = [];
  for (const e of dishInts.filter(di => di.dish_id === dishId)) {
    const it = intMap.get(e.intermediate_id);
    if (!it) throw new Error(`Intermediate ${e.intermediate_id} not found`);
    const newStock = it.stock_qty - e.qty;
    if (newStock < 0) throw new Error(`Insufficient ${it.name}: need ${e.qty}, have ${it.stock_qty}`);
    updatedIntermediates.push({ ...it, stock_qty: newStock });
  }

  const updatedDish = { ...dish, status: 'Cooked', last_cooked_on: new Date().toISOString() };

  return { success: true, updatedDish, updatedIngredients, updatedIntermediates };
}

// ─── ACTION 2 ─────────────────────────────────────────────
// Each intermediate is expected to carry its inputs as `input_ingredients`
// (same shape as Phases 3 and 4). Both camelCase and snake_case keys are
// accepted on each input row for robustness.
export function prepareIntermediate(intermediateId, unitsToPrepare, intermediates, ingredients) {
  const inter = intermediates.find(i => i.id === intermediateId);
  if (!inter) throw new Error('Intermediate not found');
  if (!(unitsToPrepare > 0)) throw new Error('Invalid quantity');

  const inputs = inter.input_ingredients || [];
  const ingMap = new Map(ingredients.map(i => [i.id, i]));

  // Validate every input up front — if any fails, throw before any computation.
  for (const inp of inputs) {
    const ingId = inp.ingredientId ?? inp.ingredient_id;
    const qtyPerUnit = inp.qtyPerUnit ?? inp.qty_per_unit ?? 0;
    const ig = ingMap.get(ingId);
    if (!ig) throw new Error(`Input ingredient ${ingId} not found`);
    const needed = qtyPerUnit * unitsToPrepare;
    if (ig.stock_qty < needed) {
      throw new Error(`Insufficient ${ig.name}: need ${needed}, have ${ig.stock_qty}`);
    }
  }

  // All inputs validated — build updated state.
  const updatedIngredients = inputs.map(inp => {
    const ingId = inp.ingredientId ?? inp.ingredient_id;
    const qtyPerUnit = inp.qtyPerUnit ?? inp.qty_per_unit ?? 0;
    const ig = ingMap.get(ingId);
    return { ...ig, stock_qty: ig.stock_qty - qtyPerUnit * unitsToPrepare };
  });

  const updatedIntermediate = {
    ...inter,
    stock_qty: (inter.stock_qty ?? 0) + unitsToPrepare,
  };

  return { success: true, updatedIntermediate, updatedIngredients };
}

// ─── ACTION 3 ─────────────────────────────────────────────
export function buyIngredient(ingredientId, purchasedQty, ingredients) {
  const ing = ingredients.find(i => i.id === ingredientId);
  if (!ing) throw new Error('Ingredient not found');
  if (!(purchasedQty > 0)) throw new Error('Invalid quantity');

  const updatedIngredient = {
    ...ing,
    stock_qty: (ing.stock_qty ?? 0) + purchasedQty,
    purchased_at: new Date().toISOString(),
  };

  return { success: true, updatedIngredient };
}
