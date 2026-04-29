/**
 * Import & Sync Engine (Phase 8)
 *
 * Validates a complete import payload up front, then computes the new
 * in-memory state in FK-safe order. The engine never partially imports:
 * if any validation rule fails, `executeImport` returns success=false
 * with the full error list and never produces a `newState`.
 *
 * Expected payload shape:
 *   {
 *     ingredients:   [{ id, name, stockQty, shelfLifeDays?, unit?, category? }],
 *     shops:         [{ id, name, ... }],
 *     intermediates: [{ id, name, stockQty, inputIngredients?: [{ ingredientId, qtyPerUnit }] }],
 *     dishes:        [{ id, name, status?, recipeIngredients?: [{ ingredientId, qty }],
 *                                          recipeIntermediates?: [{ intermediateId, qty }] }],
 *     prices:        [{ id, ingredientId, shopId, price }],
 *   }
 *
 * Tests: TEST-IM-001 through TEST-IM-008
 */

const VALID_STATUSES = new Set(['Planned', 'Not planned', 'In Progress', 'Cooked']);

export function validateImport(data) {
  const errors = [];
  const ingredients   = data?.ingredients   || [];
  const shops         = data?.shops         || [];
  const intermediates = data?.intermediates || [];
  const dishes        = data?.dishes        || [];
  const prices        = data?.prices        || [];

  const ingIds   = new Set(ingredients.map(i => i.id));
  const shopIds  = new Set(shops.map(s => s.id));
  const interIds = new Set(intermediates.map(i => i.id));

  // 1. Required fields — name on ingredients and dishes
  for (const ing of ingredients) {
    if (!ing.name || typeof ing.name !== 'string' || !ing.name.trim()) {
      errors.push(`Ingredient ${ing.id ?? '?'} missing required field: name`);
    }
  }
  for (const dish of dishes) {
    if (!dish.name || typeof dish.name !== 'string' || !dish.name.trim()) {
      errors.push(`Dish ${dish.id ?? '?'} missing required field: name`);
    }
  }

  // 2. No negative stock values
  for (const ing of ingredients) {
    if (ing.stockQty != null && ing.stockQty < 0) {
      errors.push(`Ingredient ${ing.id} has invalid stockQty: ${ing.stockQty}`);
    }
  }
  for (const inter of intermediates) {
    if (inter.stockQty != null && inter.stockQty < 0) {
      errors.push(`Intermediate ${inter.id} has invalid stockQty: ${inter.stockQty}`);
    }
  }

  // 3. Status must be one of the allowed values (when present)
  for (const dish of dishes) {
    if (dish.status != null && !VALID_STATUSES.has(dish.status)) {
      errors.push(`Dish ${dish.id} has invalid status: ${dish.status}`);
    }
  }

  // 4. Dish → ingredient references must resolve within the import
  for (const dish of dishes) {
    for (const e of dish.recipeIngredients || []) {
      if (!ingIds.has(e.ingredientId)) {
        errors.push(`Dish ${dish.id} references non-existent ingredient ${e.ingredientId}`);
      }
    }
  }

  // 5. Dish → intermediate references must resolve within the import
  for (const dish of dishes) {
    for (const e of dish.recipeIntermediates || []) {
      if (!interIds.has(e.intermediateId)) {
        errors.push(`Dish ${dish.id} references non-existent intermediate ${e.intermediateId}`);
      }
    }
  }

  // 6. Price → shop and price → ingredient references
  for (const p of prices) {
    if (!shopIds.has(p.shopId)) {
      errors.push(`Price ${p.id} references non-existent shop ${p.shopId}`);
    }
    if (!ingIds.has(p.ingredientId)) {
      errors.push(`Price ${p.id} references non-existent ingredient ${p.ingredientId}`);
    }
  }

  return errors.length ? { valid: false, errors } : { valid: true };
}

/**
 * In-memory only. Returns { success, imported, errors, newState? }.
 * Callers persist `newState` to Supabase in FK order (ingredients, shops,
 * intermediates, dishes, junctions) once they have it.
 */
export function executeImport(data, existingData = {}, mode = 'overwrite') {
  const validation = validateImport(data);
  if (!validation.valid) {
    return { success: false, imported: 0, errors: validation.errors };
  }
  if (mode !== 'overwrite') {
    return { success: false, imported: 0, errors: [`Unsupported mode: ${mode}`] };
  }

  // Overwrite mode: every incoming entity replaces the local one with the
  // same id; entities whose ids aren't in the import are preserved as-is.
  const upsertById = (existing = [], incoming = []) => {
    const map = new Map(existing.map(e => [e.id, e]));
    for (const e of incoming) map.set(e.id, e);
    return [...map.values()];
  };

  // FK-safe order: ingredients → shops → intermediates → dishes → prices
  const newState = {
    ingredients:   upsertById(existingData.ingredients,   data.ingredients),
    shops:         upsertById(existingData.shops,         data.shops),
    intermediates: upsertById(existingData.intermediates, data.intermediates),
    dishes:        upsertById(existingData.dishes,        data.dishes),
    prices:        upsertById(existingData.prices,        data.prices),
  };

  const imported =
    (data.ingredients?.length   || 0) +
    (data.shops?.length         || 0) +
    (data.intermediates?.length || 0) +
    (data.dishes?.length        || 0) +
    (data.prices?.length        || 0);

  return { success: true, imported, errors: [], newState };
}
