/**
 * Spoilage day counting in a timezone ahead of UTC (Japan, UTC+9).
 * Run with: npm test -- src/engines/__tests__/spoilageTimezone.test.js
 *
 * jest.globalSetup.cjs runs the whole suite with TZ=Asia/Tokyo.
 */
import { checkSpoilage } from '../spoilage.js';

const ing = (purchased_at, shelf_life_days) => ({ id: 1, name: 'Spinach', stock_qty: 100, purchased_at, shelf_life_days });

describe('Spoilage in Asia/Tokyo', () => {
  test('TEST-SPTZ-001: backdated purchase (local midnight Jan 10) + 7 days → expires Jan 17; on Jan 15 10:00 JST → 2 days', () => {
    // BuyDialog stores a backdated date as local midnight: Jan 10 00:00 JST = Jan 9 15:00 UTC
    const r = checkSpoilage(ing('2025-01-09T15:00:00Z', 7), new Date('2025-01-15T01:00:00Z'));
    expect(r.daysRemaining).toBe(2); // was 1 when counted in UTC
  });

  test('TEST-SPTZ-002: bought at 08:00 JST + 3 days → 3 days left the same afternoon', () => {
    // Jan 15 08:00 JST = Jan 14 23:00 UTC
    const r = checkSpoilage(ing('2025-01-14T23:00:00Z', 3), new Date('2025-01-15T03:00:00Z'));
    expect(r.daysRemaining).toBe(3); // was 2 when counted in UTC
  });

  test('TEST-SPTZ-003: "today" rolls over at local midnight, not 09:00', () => {
    const item = ing('2025-01-10T03:00:00Z', 5); // Jan 10 12:00 JST → expires Jan 15
    expect(checkSpoilage(item, new Date('2025-01-14T14:30:00Z')).daysRemaining).toBe(1); // Jan 14 23:30 JST
    expect(checkSpoilage(item, new Date('2025-01-14T15:30:00Z')).daysRemaining).toBe(0); // Jan 15 00:30 JST
  });

  test('TEST-SPTZ-004: expired yesterday reads -1 all day', () => {
    const item = ing('2025-01-10T03:00:00Z', 4); // expires Jan 14 JST
    expect(checkSpoilage(item, new Date('2025-01-14T15:10:00Z')).daysRemaining).toBe(-1); // Jan 15 00:10 JST
    expect(checkSpoilage(item, new Date('2025-01-15T14:50:00Z')).daysRemaining).toBe(-1); // Jan 15 23:50 JST
  });
});
