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

  const purchased = new Date(purchased_at);
  const expiryDate = new Date(purchased);
  expiryDate.setUTCDate(expiryDate.getUTCDate() + shelf_life_days);

  // Count whole days on the LOCAL calendar (the user's own "today"), not in
  // UTC: in Japan (UTC+9) a purchase between 00:00 and 09:00, or a backdated
  // purchase stored as local midnight, falls on the previous UTC day and
  // used to expire one day early; "today" also rolled over at 09:00.
  // Math.round absorbs DST hour shifts between the two local midnights.
  const t = new Date(today);
  const expiryMidnight = new Date(purchased.getFullYear(), purchased.getMonth(), purchased.getDate() + shelf_life_days);
  const todayMidnight = new Date(t.getFullYear(), t.getMonth(), t.getDate());

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
