/**
 * Phase 4 — Quantity Aggregation Engine tests
 * Run with: npm test -- src/engines/__tests__/quantityAggregation.test.js
 */
import { computeQuantityAggregation } from '../quantityAggregation.js';

// ─── Fixtures ─────────────────────────────────────────────
const dish = (id, name, status = 'Planned', priority = 3) => ({ id, name, status, priority });
const ing = (id, name, stock_qty) => ({ id, name, stock_qty, unit: 'g' });
const inter = (id, name, stock_qty, input_ingredients = []) => ({
  id, name, stock_qty, unit: 'portions', input_ingredients,
});
const dishIng = (dish_id, ingredient_id, qty) => ({ dish_id, ingredient_id, qty });
const dishInt = (dish_id, intermediate_id, qty) => ({ dish_id, intermediate_id, qty });

// ─── Tests ────────────────────────────────────────────────

describe('Phase 4 Quantity Aggregation Engine', () => {
  test('TEST-QA-001: I1(stock=50), D1 needs 30, D2 needs 40 → required=70, deficit=20', () => {
    const dishes = [dish(1, 'D1'), dish(2, 'D2')];
    const ingredients = [ing(100, 'I1', 50)];
    const dishIngs = [dishIng(1, 100, 30), dishIng(2, 100, 40)];

    const r = computeQuantityAggregation(dishes, dishIngs, [], ingredients, []);

    expect(r.ingredientRequirements.get(100)).toBe(70);
    expect(r.ingredientDeficits.get(100)).toBe(20);
  });

  test('TEST-QA-002: INT1(stock=5), D1 needs 3, D2 needs 4 → required=7, deficit=2', () => {
    const dishes = [dish(1, 'D1'), dish(2, 'D2')];
    const intermediates = [inter(200, 'INT1', 5)];
    const dishInts = [dishInt(1, 200, 3), dishInt(2, 200, 4)];

    const r = computeQuantityAggregation(dishes, [], dishInts, [], intermediates);

    expect(r.intermediateRequirements.get(200)).toBe(7);
    expect(r.intermediateDeficits.get(200)).toBe(2);
  });

  test('TEST-QA-003: D1 uses I1 directly (qty=20) AND via INT1 (deficit=2, qtyPerUnit=10) → I1 required=40, deficit=0 (stock=100)', () => {
    const dishes = [dish(1, 'D1')];
    const ingredients = [ing(100, 'I1', 100)];
    // INT1: dish needs 5, stock 3 → deficit 2; expansion adds 2 * 10 = 20 to I1
    const intermediates = [inter(200, 'INT1', 3, [{ ingredientId: 100, qtyPerUnit: 10 }])];
    const dishIngs = [dishIng(1, 100, 20)];          // direct: 20
    const dishInts = [dishInt(1, 200, 5)];            // via INT1

    const r = computeQuantityAggregation(dishes, dishIngs, dishInts, ingredients, intermediates);

    expect(r.intermediateDeficits.get(200)).toBe(2);
    expect(r.ingredientRequirements.get(100)).toBe(40); // 20 direct + 2*10 expansion
    expect(r.ingredientDeficits.get(100)).toBe(0);      // 40 ≤ 100 stock
  });

  test('TEST-QA-004: D1 Cooked → excluded; only D2 (Planned) counted', () => {
    const dishes = [
      dish(1, 'D1', 'Cooked'),
      dish(2, 'D2', 'Planned'),
    ];
    const ingredients = [ing(100, 'I1', 100)];
    const dishIngs = [
      dishIng(1, 100, 50),  // would-be from cooked dish, must be ignored
      dishIng(2, 100, 30),
    ];

    const r = computeQuantityAggregation(dishes, dishIngs, [], ingredients, []);

    expect(r.ingredientRequirements.get(100)).toBe(30); // only D2's 30
    expect(r.ingredientDeficits.get(100)).toBe(0);
  });

  test('TEST-QA-005: stock=200, need=50 → deficit=0 (never negative)', () => {
    const dishes = [dish(1, 'D1')];
    const ingredients = [ing(100, 'I1', 200)];
    const dishIngs = [dishIng(1, 100, 50)];

    const r = computeQuantityAggregation(dishes, dishIngs, [], ingredients, []);

    expect(r.ingredientRequirements.get(100)).toBe(50);
    expect(r.ingredientDeficits.get(100)).toBe(0);
  });

  test('TEST-QA-006: INT1 stock sufficient → do NOT expand to ingredients', () => {
    const dishes = [dish(1, 'D1')];
    const ingredients = [ing(100, 'I1', 0)]; // would-be huge deficit if expansion fired
    const intermediates = [inter(200, 'INT1', 10, [{ ingredientId: 100, qtyPerUnit: 5 }])];
    const dishInts = [dishInt(1, 200, 5)]; // need 5, stock 10 → no deficit

    const r = computeQuantityAggregation(dishes, [], dishInts, ingredients, intermediates);

    expect(r.intermediateRequirements.get(200)).toBe(5);
    expect(r.intermediateDeficits.get(200)).toBe(0);
    // No expansion happened, no direct I1 use → I1 absent from both maps
    expect(r.ingredientRequirements.has(100)).toBe(false);
    expect(r.ingredientDeficits.has(100)).toBe(false);
  });

  test('TEST-QA-007: INT1 stock=3, need=5 → deficit=2; expand only 2 × qtyPerUnit to I1', () => {
    const dishes = [dish(1, 'D1')];
    const ingredients = [ing(100, 'I1', 0)];
    const intermediates = [inter(200, 'INT1', 3, [{ ingredientId: 100, qtyPerUnit: 7 }])];
    const dishInts = [dishInt(1, 200, 5)];

    const r = computeQuantityAggregation(dishes, [], dishInts, ingredients, intermediates);

    expect(r.intermediateDeficits.get(200)).toBe(2);
    expect(r.ingredientRequirements.get(100)).toBe(14); // 2 * 7
    expect(r.ingredientDeficits.get(100)).toBe(14);     // stock 0
  });

  test('TEST-QA-008: no active dishes → return all empty Maps, no errors', () => {
    // All dishes Cooked → no active dishes
    const dishes = [dish(1, 'D1', 'Cooked'), dish(2, 'D2', 'Cooked')];
    const ingredients = [ing(100, 'I1', 50)];
    const dishIngs = [dishIng(1, 100, 30)];

    const r = computeQuantityAggregation(dishes, dishIngs, [], ingredients, []);

    expect(r.ingredientRequirements.size).toBe(0);
    expect(r.ingredientDeficits.size).toBe(0);
    expect(r.intermediateRequirements.size).toBe(0);
    expect(r.intermediateDeficits.size).toBe(0);

    // Also robust to literally-empty dish array
    const empty = computeQuantityAggregation([], [], [], [], []);
    expect(empty.ingredientRequirements.size).toBe(0);
    expect(empty.ingredientDeficits.size).toBe(0);
    expect(empty.intermediateRequirements.size).toBe(0);
    expect(empty.intermediateDeficits.size).toBe(0);
  });
});
