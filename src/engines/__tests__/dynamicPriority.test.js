/**
 * Phase D — Dynamic Priority Engine tests
 * Run with: npm test -- src/engines/__tests__/dynamicPriority.test.js
 */
import { computeDynamicPriority, boostForDays } from '../dynamicPriority.js';

// ─── Fixtures ─────────────────────────────────────────────
const dish = (id, priority = 3, status = 'Planned') => ({ id, name: id, priority, status });
const ing = (id, daysRemaining, stock_qty = 100) => ({ id, name: id, stock_qty, _spoilage: { daysRemaining } });
const link = (dish_id, ingredient_id) => ({ dish_id, ingredient_id, qty: 1 });

// ─── Tests ────────────────────────────────────────────────

describe('Phase D Dynamic Priority Engine', () => {
  test('TEST-DP-001: boost thresholds — 0–1 days → 1, 2–3 days → 2, later/unknown/expired → none', () => {
    expect(boostForDays(0)).toBe(1);
    expect(boostForDays(1)).toBe(1);
    expect(boostForDays(2)).toBe(2);
    expect(boostForDays(3)).toBe(2);
    expect(boostForDays(4)).toBeNull();
    expect(boostForDays(null)).toBeNull();
    expect(boostForDays(-1)).toBeNull();
  });

  test('TEST-DP-002: ingredient expiring tomorrow raises a Normal dish to Urgent', () => {
    const r = computeDynamicPriority([dish('D1', 3)], [link('D1', 'tofu')], [ing('tofu', 1)]).get('D1');
    expect(r.priority).toBe(1);
    expect(r.manualPriority).toBe(3);
    expect(r.boostedBy).toEqual([{ id: 'tofu', name: 'tofu', daysRemaining: 1 }]);
  });

  test('TEST-DP-003: 2–3 days left raises to High', () => {
    const r = computeDynamicPriority([dish('D1', 4)], [link('D1', 'spinach')], [ing('spinach', 3)]).get('D1');
    expect(r.priority).toBe(2);
  });

  test('TEST-DP-004: boost never lowers — an Urgent dish stays Urgent, nothing listed', () => {
    const r = computeDynamicPriority([dish('D1', 1)], [link('D1', 'spinach')], [ing('spinach', 3)]).get('D1');
    expect(r.priority).toBe(1);
    expect(r.boostedBy).toEqual([]);
  });

  test('TEST-DP-005: expired ingredients do not boost but are listed', () => {
    const r = computeDynamicPriority([dish('D1', 3)], [link('D1', 'milk')], [ing('milk', -2)]).get('D1');
    expect(r.priority).toBe(3);
    expect(r.boostedBy).toEqual([]);
    expect(r.expired).toEqual([{ id: 'milk', name: 'milk', daysRemaining: -2 }]);
  });

  test('TEST-DP-006: out-of-stock and unknown-date ingredients are ignored', () => {
    const r = computeDynamicPriority(
      [dish('D1', 3)],
      [link('D1', 'a'), link('D1', 'b')],
      [ing('a', 0, 0), ing('b', null)],
    ).get('D1');
    expect(r.priority).toBe(3);
    expect(r.boostedBy).toEqual([]);
    expect(r.expired).toEqual([]);
  });

  test('TEST-DP-007: Cooked and In Fridge dishes are never boosted', () => {
    const m = computeDynamicPriority(
      [dish('C', 3, 'Cooked'), dish('F', 3, 'In Fridge')],
      [link('C', 'tofu'), link('F', 'tofu')],
      [ing('tofu', 0)],
    );
    expect(m.get('C').priority).toBe(3);
    expect(m.get('F').priority).toBe(3);
  });

  test('TEST-DP-008: soonest ingredient wins; boostedBy sorted soonest first', () => {
    const r = computeDynamicPriority(
      [dish('D1', 4)],
      [link('D1', 'spinach'), link('D1', 'tofu'), link('D1', 'rice')],
      [ing('spinach', 3), ing('tofu', 0), ing('rice', 200)],
    ).get('D1');
    expect(r.priority).toBe(1);
    expect(r.boostedBy.map(b => b.id)).toEqual(['tofu', 'spinach']);
  });

  test('TEST-DP-009: dishes without links keep their manual priority', () => {
    const r = computeDynamicPriority([dish('D1', 5)], [], []).get('D1');
    expect(r).toEqual({ priority: 5, manualPriority: 5, boostedBy: [], expired: [] });
  });
});
