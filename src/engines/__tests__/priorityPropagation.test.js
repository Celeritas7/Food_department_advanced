/**
 * Phase 3 — Priority Propagation Engine tests
 * Run with: npm test -- src/engines/__tests__/priorityPropagation.test.js
 */
import { computePriorityPropagation } from '../priorityPropagation.js';

// ─── Fixtures ─────────────────────────────────────────────
const dish = (id, name, priority, status = 'Planned') => ({ id, name, priority, status });
const dishIng = (dish_id, ingredient_id, qty = 1) => ({ dish_id, ingredient_id, qty });
const dishInt = (dish_id, intermediate_id, qty = 1) => ({ dish_id, intermediate_id, qty });
const inter = (id, name, input_ingredients = []) => ({ id, name, input_ingredients });
const interInput = (ingredient_id, qty_per_unit = 1) => ({ ingredient_id, qty_per_unit });

// ─── Tests ────────────────────────────────────────────────

describe('Phase 3 Priority Propagation Engine', () => {
  test('TEST-PP-001: I1 in D1(p=1) + D2(p=5) → I1 gets 1 (min wins)', () => {
    const dishes = [dish(1, 'D1', 1), dish(2, 'D2', 5)];
    const dishIngs = [dishIng(1, 100), dishIng(2, 100)];

    const { ingredientPriorities } = computePriorityPropagation(dishes, dishIngs, [], []);

    expect(ingredientPriorities.get(100)).toBe(1);
  });

  test('TEST-PP-002: D1 Cooked(p=1) + D2 Planned(p=5) → I1 gets 5 only (cooked does not propagate)', () => {
    const dishes = [
      dish(1, 'D1', 1, 'Cooked'),
      dish(2, 'D2', 5, 'Planned'),
    ];
    const dishIngs = [dishIng(1, 100), dishIng(2, 100)];

    const { ingredientPriorities } = computePriorityPropagation(dishes, dishIngs, [], []);

    expect(ingredientPriorities.get(100)).toBe(5);
  });

  test('TEST-PP-003: D1(p=2) uses INT1 → INT1 gets 2, INT1 input ingredient gets 2', () => {
    const dishes = [dish(1, 'D1', 2)];
    const dishInts = [dishInt(1, 200)];
    const intermediates = [inter(200, 'INT1', [interInput(100)])];

    const { ingredientPriorities, intermediatePriorities } = computePriorityPropagation(
      dishes, [], dishInts, intermediates
    );

    expect(intermediatePriorities.get(200)).toBe(2);
    expect(ingredientPriorities.get(100)).toBe(2);
  });

  test('TEST-PP-004: ingredient priority cannot bubble up to dish', () => {
    const dishes = [dish(1, 'D1', 5)];
    const dishIngs = [dishIng(1, 100)];

    const result = computePriorityPropagation(dishes, dishIngs, [], []);

    // Ingredient inherits dish priority (downward only)
    expect(result.ingredientPriorities.get(100)).toBe(5);
    // Dish priority is unchanged — engine never mutates dishes
    expect(dishes[0].priority).toBe(5);
    // No reverse-propagation map exposed
    expect(result.dishPriorities).toBeUndefined();
  });

  test('TEST-PP-005: ingredient with no dish refs → priority undefined', () => {
    const dishes = [dish(1, 'D1', 1)];
    const dishIngs = [dishIng(1, 100)]; // only references ingredient 100

    const { ingredientPriorities } = computePriorityPropagation(dishes, dishIngs, [], []);

    expect(ingredientPriorities.has(999)).toBe(false);
    expect(ingredientPriorities.get(999)).toBeUndefined();
  });

  test('TEST-PP-006: INT1 used by D1(p=3) + D2(p=1) → INT1 gets 1 (min wins)', () => {
    const dishes = [dish(1, 'D1', 3), dish(2, 'D2', 1)];
    const dishInts = [dishInt(1, 200), dishInt(2, 200)];
    const intermediates = [inter(200, 'INT1')];

    const { intermediatePriorities } = computePriorityPropagation(dishes, [], dishInts, intermediates);

    expect(intermediatePriorities.get(200)).toBe(1);
  });
});
