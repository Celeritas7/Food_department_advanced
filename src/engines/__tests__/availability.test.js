/**
 * Phase 2 — Availability Engine tests
 * Run with: node --experimental-vm-modules node_modules/.bin/jest src/engines/__tests__/availability.test.js
 */
import { checkDishAvailability, computeAvailability } from '../availability.js';

// ─── Fixtures ─────────────────────────────────────────────
const ing = (id, name, stock_qty) => ({ id, name, stock_qty, unit: 'g' });
const inter = (id, name, stock_qty) => ({ id, name, stock_qty, unit: 'portions' });
const dish = (id, name, status = 'Planned') => ({ id, name, status, priority: 3 });
const dishIng = (dish_id, ingredient_id, qty) => ({ dish_id, ingredient_id, qty });
const dishInt = (dish_id, intermediate_id, qty) => ({ dish_id, intermediate_id, qty });

// ─── Tests ────────────────────────────────────────────────

describe('Phase 2 Availability Engine', () => {
  test('TEST-AV-001: dish with no linked ingredients → canCook=false', () => {
    const d = dish(1, 'Empty Dish');
    const r = checkDishAvailability(d, [], [], [], []);
    expect(r.canCook).toBe(false);
    expect(r.unlinked).toBe(true);
    expect(r.missingIngredients).toEqual([]);
    expect(r.missingIntermediates).toEqual([]);
  });

  test('TEST-AV-002: ingredient stock_qty=0 → canCook=false, missingIngredients has it', () => {
    const d = dish(1, 'Salad');
    const ingredients = [ing(10, 'Lettuce', 0)];
    const dishIngs = [dishIng(1, 10, 50)];
    const r = checkDishAvailability(d, dishIngs, [], ingredients, []);
    expect(r.canCook).toBe(false);
    expect(r.missingIngredients).toHaveLength(1);
    expect(r.missingIngredients[0]).toMatchObject({
      ingredientId: 10,
      name: 'Lettuce',
      required: 50,
      available: 0,
    });
    expect(r.missingIntermediates).toEqual([]);
  });

  test('TEST-AV-003: stock=100, two dishes each need 60 → both canCook=true (per-dish, not cumulative)', () => {
    const d1 = dish(1, 'Dish A');
    const d2 = dish(2, 'Dish B');
    const ingredients = [ing(10, 'Flour', 100)];
    const dishIngs = [dishIng(1, 10, 60), dishIng(2, 10, 60)];

    const r1 = checkDishAvailability(d1, dishIngs, [], ingredients, []);
    const r2 = checkDishAvailability(d2, dishIngs, [], ingredients, []);

    expect(r1.canCook).toBe(true);
    expect(r2.canCook).toBe(true);
    expect(r1.missingIngredients).toEqual([]);
    expect(r2.missingIngredients).toEqual([]);
  });

  test('TEST-AV-004: intermediate stock_qty=0 → canCook=false, missingIntermediates has it', () => {
    const d = dish(1, 'Curry');
    const intermediates = [inter(20, 'Tomato Sauce', 0)];
    const dishInts = [dishInt(1, 20, 1)];
    const r = checkDishAvailability(d, [], dishInts, [], intermediates);
    expect(r.canCook).toBe(false);
    expect(r.missingIntermediates).toHaveLength(1);
    expect(r.missingIntermediates[0]).toMatchObject({
      intermediateId: 20,
      name: 'Tomato Sauce',
      required: 1,
      available: 0,
    });
    expect(r.missingIngredients).toEqual([]);
  });

  test('TEST-AV-005: intermediate stock=1 but need 3 → canCook=false', () => {
    const d = dish(1, 'Triple Pasta');
    const intermediates = [inter(20, 'Pesto', 1)];
    const dishInts = [dishInt(1, 20, 3)];
    const r = checkDishAvailability(d, [], dishInts, [], intermediates);
    expect(r.canCook).toBe(false);
    expect(r.missingIntermediates).toHaveLength(1);
    expect(r.missingIntermediates[0]).toMatchObject({
      intermediateId: 20,
      required: 3,
      available: 1,
    });
  });

  test('TEST-AV-006: all ingredients + intermediates sufficient → canCook=true, both arrays empty', () => {
    const d = dish(1, 'Lasagna');
    const ingredients = [
      ing(10, 'Flour', 500),
      ing(11, 'Cheese', 200),
    ];
    const intermediates = [inter(20, 'Bechamel', 5)];
    const dishIngs = [dishIng(1, 10, 250), dishIng(1, 11, 100)];
    const dishInts = [dishInt(1, 20, 2)];

    const r = checkDishAvailability(d, dishIngs, dishInts, ingredients, intermediates);
    expect(r.canCook).toBe(true);
    expect(r.missingIngredients).toEqual([]);
    expect(r.missingIntermediates).toEqual([]);
  });

  test("TEST-AV-007: dish status='Cooked' → skipped entirely, not in returned map", () => {
    const d1 = dish(1, 'Already Cooked', 'Cooked');
    const d2 = dish(2, 'Still Planned', 'Planned');
    const ingredients = [ing(10, 'Flour', 500)];
    const dishIngs = [dishIng(1, 10, 100), dishIng(2, 10, 100)];

    const map = computeAvailability([d1, d2], dishIngs, [], ingredients, []);

    expect(map.has(1)).toBe(false); // cooked dish skipped entirely
    expect(map.has(2)).toBe(true);
    expect(map.get(2).canCook).toBe(true);
    expect(map.size).toBe(1);
  });

  test('TEST-AV-008: one ingredient ok, one missing → canCook=false, only missing one flagged', () => {
    const d = dish(1, 'Stew');
    const ingredients = [
      ing(10, 'Beef', 500),    // sufficient
      ing(11, 'Carrot', 10),   // insufficient
    ];
    const dishIngs = [
      dishIng(1, 10, 300),     // need 300, have 500 — ok
      dishIng(1, 11, 50),      // need 50, have 10 — missing
    ];

    const r = checkDishAvailability(d, dishIngs, [], ingredients, []);
    expect(r.canCook).toBe(false);
    expect(r.missingIngredients).toHaveLength(1);
    expect(r.missingIngredients[0]).toMatchObject({
      ingredientId: 11,
      name: 'Carrot',
      required: 50,
      available: 10,
    });
    // Beef should NOT appear in missing list
    expect(r.missingIngredients.find(m => m.ingredientId === 10)).toBeUndefined();
  });
});
