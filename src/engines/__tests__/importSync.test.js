/**
 * Phase 8 — Import & Sync Engine tests
 * Run with: npm test -- src/engines/__tests__/importSync.test.js
 */
import { validateImport, executeImport } from '../importSync.js';

// ─── Fixtures ─────────────────────────────────────────────
const ing  = (id, name, extra = {}) => ({ id, name, stockQty: 0, unit: 'g', ...extra });
const shop = (id, name) => ({ id, name });
const inter = (id, name, extra = {}) => ({ id, name, stockQty: 0, ...extra });
const dish = (id, name, extra = {}) => ({ id, name, status: 'Planned', priority: 3, ...extra });
const price = (id, ingredientId, shopId, p = 1) => ({ id, ingredientId, shopId, price: p });

// ─── Tests ────────────────────────────────────────────────

describe('Phase 8 Import & Sync Engine', () => {
  test('TEST-IM-001: two ingredients with same name but different IDs → both imported, no merge', () => {
    const data = {
      ingredients: [
        ing('I1', 'Tomato', { stockQty: 10 }),
        ing('I2', 'Tomato', { stockQty: 50 }), // duplicate name, distinct id
      ],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(true);

    const r = executeImport(data, {});
    expect(r.success).toBe(true);
    expect(r.imported).toBe(2);
    expect(r.newState.ingredients).toHaveLength(2);
    expect(r.newState.ingredients.find(i => i.id === 'I1').stockQty).toBe(10);
    expect(r.newState.ingredients.find(i => i.id === 'I2').stockQty).toBe(50);
  });

  test('TEST-IM-002: ingredient missing name → reject entire import with exact message', () => {
    const data = {
      ingredients: [
        { id: 'I1', stockQty: 5, unit: 'g' }, // no name
        ing('I2', 'Salt'),
      ],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(false);
    expect(v.errors).toContain('Ingredient I1 missing required field: name');

    const r = executeImport(data, {});
    expect(r.success).toBe(false);
    expect(r.imported).toBe(0);
    expect(r.errors).toContain('Ingredient I1 missing required field: name');
    expect(r.newState).toBeUndefined();
  });

  test('TEST-IM-003: dish references ingredientId not in import → reject with exact message', () => {
    const data = {
      ingredients: [ing('I1', 'Flour')],
      dishes: [dish('D1', 'Pasta', {
        recipeIngredients: [
          { ingredientId: 'I1', qty: 100 },
          { ingredientId: 'I999', qty: 50 }, // missing
        ],
      })],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(false);
    expect(v.errors).toContain('Dish D1 references non-existent ingredient I999');

    const r = executeImport(data, {});
    expect(r.success).toBe(false);
    expect(r.imported).toBe(0);
  });

  test('TEST-IM-004: overwrite mode replaces by id (local stock=100, import stock=20 → 20)', () => {
    const existingData = {
      ingredients: [ing('I1', 'Sugar', { stockQty: 100 })],
    };
    const data = {
      ingredients: [ing('I1', 'Sugar', { stockQty: 20 })],
    };

    const r = executeImport(data, existingData, 'overwrite');
    expect(r.success).toBe(true);
    const after = r.newState.ingredients.find(i => i.id === 'I1');
    expect(after.stockQty).toBe(20);                // replaced, not summed
    expect(r.newState.ingredients).toHaveLength(1); // not duplicated
  });

  test('TEST-IM-005: price references shopId not in import → reject with exact message', () => {
    const data = {
      ingredients: [ing('I1', 'Salt')],
      shops: [shop('S1', 'Local Market')],
      prices: [
        price('P1', 'I1', 'S999', 2.50), // S999 missing
      ],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(false);
    expect(v.errors).toContain('Price P1 references non-existent shop S999');

    const r = executeImport(data, {});
    expect(r.success).toBe(false);
    expect(r.imported).toBe(0);
  });

  test('TEST-IM-006: dish with status="Pending" (invalid) is rejected — never accepted silently', () => {
    const data = {
      dishes: [dish('D1', 'Mystery', { status: 'Pending' })],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(false);
    expect(v.errors.some(e => /D1.*invalid status.*Pending/.test(e))).toBe(true);

    const r = executeImport(data, {});
    expect(r.success).toBe(false);
    expect(r.imported).toBe(0);

    // Sanity: each of the four valid statuses passes
    for (const s of ['Planned', 'Not planned', 'In Progress', 'Cooked']) {
      const ok = validateImport({ dishes: [dish('D9', 'Ok', { status: s })] });
      expect(ok.valid).toBe(true);
    }
  });

  test('TEST-IM-007: ingredient with stockQty=-5 → reject with exact message', () => {
    const data = {
      ingredients: [ing('I1', 'Pepper', { stockQty: -5 })],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(false);
    expect(v.errors).toContain('Ingredient I1 has invalid stockQty: -5');

    const r = executeImport(data, {});
    expect(r.success).toBe(false);
    expect(r.imported).toBe(0);
  });

  test('TEST-IM-008: valid complete dataset with all 5 entity arrays → imported in FK-safe order', () => {
    const data = {
      ingredients: [ing('I1', 'Flour', { stockQty: 500 }), ing('I2', 'Tomato', { stockQty: 100 })],
      shops:       [shop('S1', 'Mart'), shop('S2', 'Bazaar')],
      intermediates: [
        inter('T1', 'Tomato Sauce', {
          stockQty: 5,
          inputIngredients: [{ ingredientId: 'I2', qtyPerUnit: 5 }],
        }),
      ],
      dishes: [
        dish('D1', 'Pasta', {
          recipeIngredients:   [{ ingredientId: 'I1', qty: 200 }],
          recipeIntermediates: [{ intermediateId: 'T1', qty: 1 }],
        }),
      ],
      prices: [
        price('P1', 'I1', 'S1', 1.20),
        price('P2', 'I2', 'S2', 0.80),
      ],
    };

    const v = validateImport(data);
    expect(v.valid).toBe(true);

    const r = executeImport(data, {});
    expect(r.success).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.imported).toBe(2 + 2 + 1 + 1 + 2); // = 8

    // FK-safe key order in the returned newState
    expect(Object.keys(r.newState)).toEqual([
      'ingredients', 'shops', 'intermediates', 'dishes', 'prices',
    ]);

    expect(r.newState.ingredients).toHaveLength(2);
    expect(r.newState.shops).toHaveLength(2);
    expect(r.newState.intermediates).toHaveLength(1);
    expect(r.newState.dishes).toHaveLength(1);
    expect(r.newState.prices).toHaveLength(2);
  });
});
