/**
 * Spoilage & Expiry Engine (Phase 5)
 *
 * Read-only — flags ingredient expiry status from purchased_at + shelf_life_days.
 * NEVER mutates stock_qty (or any other field). Partial usage does NOT reset
 * expiry: the timeline starts at purchased_at regardless of remaining stock.
 *
 * Status thresholds (against `daysRemaining`):
 *   'Unknown'     → purchased_at is null OR shelf_life_days is null
 *   'Fresh'       → daysRemaining > 3
 *   'NearExpiry'  → daysRemaining >= 0 AND <= 3
 *   'Expired'     → daysRemaining < 0
 *
 * `today` is injectable for deterministic tests; defaults to `new Date()`.
 *
 * Tests: TEST-SP-001 through TEST-SP-006
 */

const MS_PER_DAY = 86400000;

export function checkSpoilage(ingredient, today = new Date()) {
  const { purchased_at, shelf_life_days } = ingredient;

  if (purchased_at == null || shelf_life_days == null) {
    return { expiryDate: undefined, daysRemaining: undefined, spoilageStatus: 'Unknown' };
  }

  const expiryDate = new Date(purchased_at);
  expiryDate.setUTCDate(expiryDate.getUTCDate() + shelf_life_days);

  // Normalize both ends to UTC midnight so daysRemaining is a clean integer
  // regardless of the time-of-day on `today` (e.g. when `new Date()` is used).
  const expiryMidnight = new Date(expiryDate);
  expiryMidnight.setUTCHours(0, 0, 0, 0);
  const todayMidnight = new Date(today);
  todayMidnight.setUTCHours(0, 0, 0, 0);

  const daysRemaining = Math.round((expiryMidnight - todayMidnight) / MS_PER_DAY);

  let spoilageStatus;
  if (daysRemaining < 0) spoilageStatus = 'Expired';
  else if (daysRemaining <= 3) spoilageStatus = 'NearExpiry';
  else spoilageStatus = 'Fresh';

  return { expiryDate, daysRemaining, spoilageStatus };
}

/**
 * Batch wrapper.
 * Returns Map<ingredientId, { expiryDate, daysRemaining, spoilageStatus }>.
 */
export function computeAllSpoilage(ingredients, today = new Date()) {
  const result = new Map();
  for (const ing of ingredients) {
    result.set(ing.id, checkSpoilage(ing, today));
  }
  return result;
}

/**
 * Backwards-compat shim — preserves the legacy `{ status, daysRemaining }` shape
 * consumed by App.jsx and the page components. Prefer `checkSpoilage` for new code.
 */
export function computeSpoilage(ingredient, today = new Date()) {
  const r = checkSpoilage(ingredient, today);
  return {
    status: r.spoilageStatus,
    daysRemaining: r.daysRemaining ?? null,
  };
}
