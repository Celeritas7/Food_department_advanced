/**
 * Phase 5 — Spoilage & Expiry Engine tests
 * Run with: npm test -- src/engines/__tests__/spoilage.test.js
 *
 * All dates use UTC midnight (ISO 'YYYY-MM-DD') so day diffs are exact integers.
 */
import { checkSpoilage, computeAllSpoilage } from '../spoilage.js';

// ─── Fixtures ─────────────────────────────────────────────
const ing = (id, name, stock_qty, purchased_at, shelf_life_days) => ({
  id, name, stock_qty, purchased_at, shelf_life_days, unit: 'g',
});
const utc = (iso) => new Date(iso); // 'YYYY-MM-DD' → UTC midnight

// ─── Tests ────────────────────────────────────────────────

describe('Phase 5 Spoilage Engine', () => {
  test('TEST-SP-001: purchased_at=null → Unknown, expiryDate/daysRemaining undefined', () => {
    const i = ing(1, 'Mystery Spice', 100, null, 7);
    const r = checkSpoilage(i, utc('2025-01-15'));

    expect(r.spoilageStatus).toBe('Unknown');
    expect(r.expiryDate).toBeUndefined();
    expect(r.daysRemaining).toBeUndefined();
  });

  test('TEST-SP-002: shelf_life_days=null → Unknown, expiryDate undefined', () => {
    const i = ing(2, 'Eternal Salt', 500, '2025-01-01', null);
    const r = checkSpoilage(i, utc('2025-01-15'));

    expect(r.spoilageStatus).toBe('Unknown');
    expect(r.expiryDate).toBeUndefined();
    expect(r.daysRemaining).toBeUndefined();
  });

  test('TEST-SP-003: purchased=2025-01-10, shelf=7, today=2025-01-15 → NearExpiry, 2 days, expiry=2025-01-17', () => {
    const i = ing(3, 'Yogurt', 200, '2025-01-10', 7);
    const r = checkSpoilage(i, utc('2025-01-15'));

    expect(r.daysRemaining).toBe(2);
    expect(r.spoilageStatus).toBe('NearExpiry');
    expect(r.expiryDate.toISOString().slice(0, 10)).toBe('2025-01-17');
  });

  test('TEST-SP-004: purchased=2025-01-01, shelf=7, today=2025-01-15 → Expired, -7 days; stock_qty unchanged', () => {
    const i = ing(4, 'Old Milk', 250, '2025-01-01', 7);
    const stockBefore = i.stock_qty;
    const refBefore = i;

    const r = checkSpoilage(i, utc('2025-01-15'));

    expect(r.daysRemaining).toBe(-7);
    expect(r.spoilageStatus).toBe('Expired');
    expect(r.expiryDate.toISOString().slice(0, 10)).toBe('2025-01-08');

    // Engine must NOT mutate the input ingredient
    expect(i.stock_qty).toBe(stockBefore);
    expect(i).toBe(refBefore);
    expect(i).toEqual({ id: 4, name: 'Old Milk', stock_qty: 250, purchased_at: '2025-01-01', shelf_life_days: 7, unit: 'g' });
  });

  test('TEST-SP-005: purchased=2025-01-10, shelf=14, today=2025-01-12 → Fresh, 12 days, expiry=2025-01-24', () => {
    const i = ing(5, 'Cheese', 300, '2025-01-10', 14);
    const r = checkSpoilage(i, utc('2025-01-12'));

    expect(r.daysRemaining).toBe(12);
    expect(r.spoilageStatus).toBe('Fresh');
    expect(r.expiryDate.toISOString().slice(0, 10)).toBe('2025-01-24');
  });

  test('TEST-SP-006: partial usage does NOT reset expiry (same result as full stock)', () => {
    const today = utc('2025-01-10');
    const partiallyUsed = ing(6, 'Bread', 2,  '2025-01-01', 7); // was 10, now 2
    const fullStock     = ing(6, 'Bread', 10, '2025-01-01', 7);

    const rPartial = checkSpoilage(partiallyUsed, today);
    const rFull    = checkSpoilage(fullStock, today);

    expect(rPartial.daysRemaining).toBe(-2);
    expect(rPartial.spoilageStatus).toBe('Expired');
    expect(rPartial.expiryDate.toISOString().slice(0, 10)).toBe('2025-01-08');

    // Identical timeline regardless of how much stock has been consumed
    expect(rPartial.daysRemaining).toBe(rFull.daysRemaining);
    expect(rPartial.spoilageStatus).toBe(rFull.spoilageStatus);
    expect(rPartial.expiryDate.getTime()).toBe(rFull.expiryDate.getTime());
  });

  test('computeAllSpoilage batch wrapper returns Map keyed by ingredient id', () => {
    const today = utc('2025-01-15');
    const ingredients = [
      ing(1, 'Mystery Spice', 100, null, 7),
      ing(3, 'Yogurt', 200, '2025-01-10', 7),
      ing(5, 'Cheese', 300, '2025-01-10', 14),
    ];

    const map = computeAllSpoilage(ingredients, today);

    expect(map.size).toBe(3);
    expect(map.get(1).spoilageStatus).toBe('Unknown');
    expect(map.get(3).spoilageStatus).toBe('NearExpiry');
    expect(map.get(5).spoilageStatus).toBe('Fresh');
  });
});
