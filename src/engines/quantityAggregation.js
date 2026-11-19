import { scaleQuantity } from './scaling.js';
import { convertToStock, stockStatus } from './pantry.js';
/**
 * Quantity Aggregation Engine (Phase 4)
 *
 * Aggregates ingredient + intermediate requirements across all active
 * (non-Cooked) dishes and computes deficits against current stock.
 *
 * Rules:
 *   - Cooked dishes are excluded entirely.
 *   - deficit = max(0, totalRequired - stock_qty); never negative.
 *   - An intermediate with sufficient stock does NOT expand to ingredients.
 *   - An intermediate with a deficit expands only its DEFICIT portion
 *     into raw ingredient requirements: deficit × qtyPerUnit per input.
 *   - An ingredient used both directly AND via intermediate expansion
 *     sums both into a single requirement and checks one stock_qty.
 *
 * Tests: TEST-QA-001 through TEST-QA-008
 */

export function computeQuantityAggregation(
  dishes,
  dishIngredients,
  dishIntermediates,
  ingredients,
  intermediates,
) {
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const ingredientRequirements = new Map();
  const intermediateRequirements = new Map();
  const ingredientDeficits = new Map();
  const intermediateDeficits = new Map();

  const activeDishes = dishes.filter(d => d.status !== 'Cooked');

  // No active dishes → return empty maps (TEST-QA-008)
  if (activeDishes.length === 0) {
    return { ingredientRequirements, ingredientDeficits, intermediateRequirements, intermediateDeficits };
  }

  // 1. Sum direct ingredient + intermediate requirements
  for (const dish of activeDishes) {
    for (const e of dishIngredients.filter(di => di.dish_id === dish.id)) {
      const cur = ingredientRequirements.get(e.ingredient_id) ?? 0;
      const qty = convertToStock(scaleQuantity(e.qty, dish), e.recipe_unit, ingMap.get(e.ingredient_id));
      ingredientRequirements.set(e.ingredient_id, ingredientRequirements.get(e.ingredient_id) === null || qty === null ? null : cur + qty);
    }
    for (const e of dishIntermediates.filter(di => di.dish_id === dish.id)) {
      const cur = intermediateRequirements.get(e.intermediate_id) || 0;
      const qty = scaleQuantity(e.qty, dish);
      intermediateRequirements.set(e.intermediate_id, qty == null || intermediateRequirements.get(e.intermediate_id) === null ? null : cur + qty);
    }
  }

  // 2. Intermediate deficits → expand ONLY the deficit portion into ingredients
  const interMap = new Map(intermediates.map(i => [i.id, i]));
  for (const [intId, required] of intermediateRequirements) {
    const inter = interMap.get(intId);
    const stock = inter?.stock_qty ?? 0;
    const deficit = required == null ? null : Math.max(0, required - stock);
    intermediateDeficits.set(intId, deficit);

    if ((deficit == null || deficit > 0) && inter) {
      const inputs = inter.input_ingredients || [];
      for (const inp of inputs) {
        const ingId = inp.ingredientId ?? inp.ingredient_id;
        const qtyPerUnit = inp.qtyPerUnit ?? inp.qty_per_unit ?? 0;
        if (ingId == null) continue;
        const cur = ingredientRequirements.get(ingId) ?? 0;
        const qty = convertToStock(deficit == null ? null : qtyPerUnit * deficit, inp.recipe_unit, ingMap.get(ingId));
        ingredientRequirements.set(ingId, ingredientRequirements.get(ingId) === null || qty === null ? null : cur + qty);
      }
    }
  }

  // 3. Ingredient deficits against stock (single source of truth per ingredient)
  for (const [ingId, required] of ingredientRequirements) {
    const stock = ingMap.get(ingId)?.stock_qty ?? 0;
    ingredientDeficits.set(ingId, required === null || stockStatus(ingMap.get(ingId)) !== 'known' ? null : Math.max(0, required - stock));
  }

  return { ingredientRequirements, ingredientDeficits, intermediateRequirements, intermediateDeficits };
}
