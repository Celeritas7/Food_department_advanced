/**
 * Dynamic Priority Engine (Phase D)
 *
 * Raises a dish's priority when an in-stock ingredient it uses is about to
 * expire. Lower number = more urgent (1 = Urgent … 5 = Someday).
 *
 * Rules:
 *   - Only active dishes (not Cooked / In Fridge) are considered.
 *   - Only ingredients with stock > 0 and a known daysRemaining count.
 *   - 0–1 days left → priority 1 (Urgent); 2–3 days left → priority 2 (High).
 *   - A boost only RAISES priority: effective = min(manual, boost). The
 *     manual priority is never lowered and never written back.
 *   - Expired ingredients (daysRemaining < 0) do NOT boost; they are listed
 *     in `expired` so the UI can flag them for a check.
 *
 * `ingredients` must carry `_spoilage: { daysRemaining }` (computeSpoilage).
 * Returns Map<dishId, { priority, manualPriority, boostedBy, expired }>,
 * where boostedBy = [{ id, name, daysRemaining }] for the ingredients that
 * actually raised the priority (soonest first).
 */

export const BOOST_RULES = [
  { maxDays: 1, priority: 1 },
  { maxDays: 3, priority: 2 },
];

export function boostForDays(daysRemaining) {
  if (daysRemaining == null || daysRemaining < 0) return null;
  const rule = BOOST_RULES.find(r => daysRemaining <= r.maxDays);
  return rule ? rule.priority : null;
}

export function computeDynamicPriority(dishes, dishIngredients, ingredients) {
  const ingById = new Map(ingredients.map(i => [i.id, i]));
  const linksByDish = new Map();
  for (const di of dishIngredients) {
    if (!linksByDish.has(di.dish_id)) linksByDish.set(di.dish_id, []);
    linksByDish.get(di.dish_id).push(di);
  }

  const result = new Map();
  for (const dish of dishes) {
    const manual = dish.priority ?? 3;
    const entry = { priority: manual, manualPriority: manual, boostedBy: [], expired: [] };
    result.set(dish.id, entry);
    if (dish.status === 'Cooked' || dish.status === 'In Fridge') continue;

    const candidates = [];
    for (const di of linksByDish.get(dish.id) || []) {
      const ing = ingById.get(di.ingredient_id);
      if (!ing || !(ing.stock_qty > 0)) continue;
      const days = ing._spoilage?.daysRemaining;
      if (days == null) continue;
      if (days < 0) { entry.expired.push({ id: ing.id, name: ing.name, daysRemaining: days }); continue; }
      const boost = boostForDays(days);
      if (boost != null && boost < manual) candidates.push({ id: ing.id, name: ing.name, daysRemaining: days, boost });
    }

    if (candidates.length) {
      entry.priority = Math.min(...candidates.map(c => c.boost));
      entry.boostedBy = candidates
        .sort((a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name))
        .map(({ id, name, daysRemaining }) => ({ id, name, daysRemaining }));
    }
    entry.expired.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }
  return result;
}
