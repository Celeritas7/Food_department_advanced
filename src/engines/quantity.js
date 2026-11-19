import { convertToStock, evaluateNeed, stockStatus } from './pantry.js';
/**
 * Quantity Aggregation Engine
 * Aggregates ingredient needs across In Progress dishes only.
 * Handles direct + indirect (through intermediates) requirements
 * Tests: TEST-QA-001 through TEST-QA-008
 */

export function aggregateRequirements(dishes, dishIngs, dishInts, intIngs, ingredients, intermediates) {
  // Only include dishes the user is actively cooking right now.
  const activeDishes = dishes.filter(d => d.status === 'In Progress');

  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const ingReq = new Map();   // ingredientId → { total, priority, dishes[] }
  const intReq = new Map();   // intermediateId → { total, priority }

  // 1. Sum up direct ingredient + intermediate requirements from active dishes
  for (const dish of activeDishes) {
    const myIngs = dishIngs.filter(di => di.dish_id === dish.id);
    const myInts = dishInts.filter(di => di.dish_id === dish.id);

    for (const e of myIngs) {
      const cur = ingReq.get(e.ingredient_id) || { total: 0, priority: 99, dishes: [], issues: [] };
      const converted = convertToStock(e.qty, e.recipe_unit, ingMap.get(e.ingredient_id));
      if (converted == null) cur.issues.push(`Confirm conversion: ${e.qty} ${e.recipe_unit || '?'} (${dish.name})`);
      else cur.total += converted;
      cur.priority = Math.min(cur.priority, dish.priority);
      cur.dishes.push(dish.name);
      ingReq.set(e.ingredient_id, cur);
    }

    for (const e of myInts) {
      const cur = intReq.get(e.intermediate_id) || { total: 0, priority: 99, dishes: [] };
      cur.total += Number(e.qty);
      cur.dishes.push(dish.name);
      cur.priority = Math.min(cur.priority, dish.priority);
      intReq.set(e.intermediate_id, cur);
    }
  }

  // 2. Expand intermediate deficits into ingredient requirements
  const intMap = new Map(intermediates.map(i => [i.id, i]));
  for (const [intId, req] of intReq) {
    const inter = intMap.get(intId);
    if (!inter) continue;
    const deficit = Math.max(0, req.total - inter.stock_qty);
    if (deficit > 0) {
      const inputs = intIngs.filter(ii => ii.intermediate_id === intId);
      for (const inp of inputs) {
        const cur = ingReq.get(inp.ingredient_id) || { total: 0, priority: 99, dishes: [], issues: [] };
        const converted = convertToStock(inp.qty_per_unit * deficit, inp.recipe_unit, ingMap.get(inp.ingredient_id));
        if (converted == null) cur.issues.push(`Confirm conversion for ${inter.name}`);
        else cur.total += converted;
        cur.dishes.push(...req.dishes);
        cur.priority = Math.min(cur.priority, req.priority);
        ingReq.set(inp.ingredient_id, cur);
      }
    }
  }

  // 3. Build shopping list with deficits
  const list = [];
  for (const [id, req] of ingReq) {
    const ig = ingMap.get(id);
    if (!ig) continue;
    const result = evaluateNeed(ig, req.total, ig.unit);
    const requiresCheck = req.issues.length > 0 || !!result.reason;
    const deficit = requiresCheck ? null : result.deficit;
    list.push({
      id,
      name: ig.name,
      unit: ig.unit,
      category: ig.category || '',
      stock: stockStatus(ig) === 'known' ? ig.stock_qty : null,
      needed: req.issues.length ? null : req.total,
      requiresCheck,
      issues: req.issues,
      checkReason: req.issues.join('; ') || result.reason,
      deficit,
      toBuy: requiresCheck || deficit > 0,
      priority: req.priority,
      usedIn: [...new Set(req.dishes)],
    });
  }

  list.sort((a, b) => a.toBuy !== b.toBuy ? (a.toBuy ? -1 : 1) : a.priority - b.priority);

  return {
    list,
    toBuy: list.filter(i => i.toBuy).length,
    inStock: list.filter(i => !i.toBuy).length,
  };
}
