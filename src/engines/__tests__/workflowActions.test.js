/**
 * Phase 6 — Workflow Actions Engine tests
 * Run with: npm test -- src/engines/__tests__/workflowActions.test.js
 */
import { cookDish, prepareIntermediate, buyIngredient } from '../workflowActions.js';

// ─── Fixtures ─────────────────────────────────────────────
const dish = (id, name, status = 'Planned', priority = 3) => ({ id, name, status, priority });
const ing = (id, name, stock_qty, purchased_at = '2025-01-01', shelf_life_days = 30) => ({
  id, name, stock_qty, purchased_at, shelf_life_days, unit: 'g',
});
const inter = (id, name, stock_qty, input_ingredients = []) => ({
  id, name, stock_qty, unit: 'portions', input_ingredients,
});
const dishIng = (dish_id, ingredient_id, qty) => ({ dish_id, ingredient_id, qty });
const dishInt = (dish_id, intermediate_id, qty) => ({ dish_id, intermediate_id, qty });

// Snapshot helper: deep-freeze all input objects so any mutation throws.
// Note: don't pass `freezeOne` directly to forEach — its (item, idx, arr)
// signature would re-feed `arr` and recurse infinitely.
const freezeOne = (o) => {
  if (Array.isArray(o)) o.forEach(item => freezeOne(item));
  else if (o && typeof o === 'object') Object.freeze(o);
};
const freeze = (...objs) => objs.forEach(o => freezeOne(o));

// ─── Tests ────────────────────────────────────────────────

describe('Phase 6 Workflow Actions Engine', () => {
  // ─── ACTION 1: cookDish ─────────────────────────────────

  test('TEST-WF-001: cookDish with stock=0 ingredient → throws, no mutations', () => {
    const dishes = [dish(1, 'Salad')];
    const ingredients = [ing(10, 'Lettuce', 0)]; // empty
    const dishIngs = [dishIng(1, 10, 50)];
    freeze(dishes, ingredients, dishIngs);

    expect(() => cookDish(1, dishes, dishIngs, [], ingredients, [])).toThrow();
    expect(ingredients[0].stock_qty).toBe(0);
    expect(dishes[0].status).toBe('Planned');
  });

  test('TEST-WF-004: cookDish success → dish→Cooked, ingredient + intermediate stock deducted', () => {
    const dishes = [dish(1, 'Pasta')];
    const ingredients = [ing(10, 'Flour', 500), ing(11, 'Egg', 12)];
    const intermediates = [inter(20, 'Tomato Sauce', 5)];
    const dishIngs = [dishIng(1, 10, 200), dishIng(1, 11, 2)];
    const dishInts = [dishInt(1, 20, 1)];
    freeze(dishes, ingredients, intermediates, dishIngs, dishInts);

    const r = cookDish(1, dishes, dishIngs, dishInts, ingredients, intermediates);

    expect(r.success).toBe(true);
    expect(r.updatedDish.status).toBe('Cooked');
    expect(r.updatedDish.last_cooked_on).toBeDefined();

    const flour = r.updatedIngredients.find(i => i.id === 10);
    const egg = r.updatedIngredients.find(i => i.id === 11);
    expect(flour.stock_qty).toBe(300);  // 500 − 200
    expect(egg.stock_qty).toBe(10);     // 12 − 2

    expect(r.updatedIntermediates[0].stock_qty).toBe(4); // 5 − 1

    // Originals untouched
    expect(ingredients[0].stock_qty).toBe(500);
    expect(intermediates[0].stock_qty).toBe(5);
    expect(dishes[0].status).toBe('Planned');
  });

  test('TEST-WF-006: cookDish atomic — second resource fails, no partial deduction', () => {
    const dishes = [dish(1, 'Curry')];
    // I1 (sufficient: 500 ≥ 200) and INT1 (insufficient: 1 < 5)
    const ingredients = [ing(10, 'Rice', 500)];
    const intermediates = [inter(20, 'Curry Paste', 1)];
    const dishIngs = [dishIng(1, 10, 200)];
    const dishInts = [dishInt(1, 20, 5)];
    freeze(dishes, ingredients, intermediates, dishIngs, dishInts);

    expect(() => cookDish(1, dishes, dishIngs, dishInts, ingredients, intermediates))
      .toThrow();

    // No partial deduction — Rice stock is NOT 300
    expect(ingredients[0].stock_qty).toBe(500);
    expect(intermediates[0].stock_qty).toBe(1); // not -4
    expect(dishes[0].status).toBe('Planned');
  });

  test('TEST-WF-007: cookDish on already-Cooked dish → throws, no mutations', () => {
    const dishes = [dish(1, 'Roast', 'Cooked')];
    const ingredients = [ing(10, 'Beef', 500)];
    const dishIngs = [dishIng(1, 10, 200)];
    freeze(dishes, ingredients, dishIngs);

    expect(() => cookDish(1, dishes, dishIngs, [], ingredients, []))
      .toThrow(/already cooked/i);
    expect(ingredients[0].stock_qty).toBe(500);
  });

  // ─── ACTION 2: prepareIntermediate ───────────────────────

  test('TEST-WF-002: prepareIntermediate with insufficient ingredient → throws, no mutations', () => {
    const ingredients = [ing(10, 'Tomato', 1)]; // need 5*2=10
    const intermediates = [inter(20, 'Sauce', 0, [
      { ingredientId: 10, qtyPerUnit: 5 },
    ])];
    freeze(ingredients, intermediates);

    expect(() => prepareIntermediate(20, 2, intermediates, ingredients))
      .toThrow(/Insufficient Tomato/);

    expect(ingredients[0].stock_qty).toBe(1);
    expect(intermediates[0].stock_qty).toBe(0);
  });

  test('TEST-WF-005: prepareIntermediate success → ingredient stock down, intermediate up', () => {
    const ingredients = [ing(10, 'Tomato', 100)];
    const intermediates = [inter(20, 'Sauce', 2, [
      { ingredientId: 10, qtyPerUnit: 5 },
    ])];
    freeze(ingredients, intermediates);

    const r = prepareIntermediate(20, 3, intermediates, ingredients);

    expect(r.success).toBe(true);
    expect(r.updatedIngredients[0].stock_qty).toBe(85);   // 100 − 3*5
    expect(r.updatedIntermediate.stock_qty).toBe(5);       // 2 + 3

    // Originals untouched
    expect(ingredients[0].stock_qty).toBe(100);
    expect(intermediates[0].stock_qty).toBe(2);
  });

  test('TEST-WF-009: prepareIntermediate with multiple inputs → all deducted atomically', () => {
    const ingredients = [
      ing(10, 'Flour', 200),
      ing(11, 'Water', 500),
      ing(12, 'Yeast', 50),
    ];
    const intermediates = [inter(20, 'Dough', 0, [
      { ingredientId: 10, qtyPerUnit: 10 },  // need 4*10 = 40
      { ingredientId: 11, qtyPerUnit: 6 },   // need 4*6  = 24
      { ingredientId: 12, qtyPerUnit: 1 },   // need 4*1  = 4
    ])];
    freeze(ingredients, intermediates);

    const r = prepareIntermediate(20, 4, intermediates, ingredients);

    const byId = Object.fromEntries(r.updatedIngredients.map(i => [i.id, i.stock_qty]));
    expect(byId[10]).toBe(160); // 200 − 40
    expect(byId[11]).toBe(476); // 500 − 24
    expect(byId[12]).toBe(46);  // 50  − 4
    expect(r.updatedIntermediate.stock_qty).toBe(4); // 0 + 4

    // Originals untouched
    expect(ingredients.map(i => i.stock_qty)).toEqual([200, 500, 50]);
  });

  // ─── ACTION 3: buyIngredient ─────────────────────────────

  test('TEST-WF-003: buyIngredient → stock increments, purchased_at updated to now', () => {
    const ingredients = [ing(10, 'Salt', 100, '2024-12-01')];
    freeze(ingredients);

    const before = Date.now();
    const r = buyIngredient(10, 50, ingredients);
    const after = Date.now();

    expect(r.success).toBe(true);
    expect(r.updatedIngredient.stock_qty).toBe(150);
    const purchasedAt = new Date(r.updatedIngredient.purchased_at).getTime();
    expect(purchasedAt).toBeGreaterThanOrEqual(before);
    expect(purchasedAt).toBeLessThanOrEqual(after);

    // Original untouched
    expect(ingredients[0].stock_qty).toBe(100);
    expect(ingredients[0].purchased_at).toBe('2024-12-01');
  });

  test('TEST-WF-008: buyIngredient with qty=0 → throws "Invalid quantity", no mutations', () => {
    const ingredients = [ing(10, 'Salt', 100)];
    freeze(ingredients);

    expect(() => buyIngredient(10, 0, ingredients)).toThrow(/Invalid quantity/);
    expect(() => buyIngredient(10, -5, ingredients)).toThrow(/Invalid quantity/);
    expect(ingredients[0].stock_qty).toBe(100);
  });

  test('TEST-WF-010: buyIngredient with non-existent id → throws "Ingredient not found"', () => {
    const ingredients = [ing(10, 'Salt', 100)];
    freeze(ingredients);

    expect(() => buyIngredient(999, 50, ingredients)).toThrow(/Ingredient not found/);
    expect(ingredients[0].stock_qty).toBe(100);
  });
});
