/**
 * Spoilage Engine
 * Calculates expiry status for ingredients based on purchasedAt + shelfLifeDays
 * Tests: TEST-SP-001 through TEST-SP-006
 */

export function computeSpoilage(ingredient) {
  const { purchased_at, shelf_life_days } = ingredient;

  if (!purchased_at || !shelf_life_days) {
    return { status: 'Unknown', daysRemaining: null };
  }

  const expiry = new Date(purchased_at);
  expiry.setDate(expiry.getDate() + shelf_life_days);
  const daysRemaining = Math.ceil((expiry - new Date()) / 86400000);

  if (daysRemaining < 0) return { status: 'Expired', daysRemaining };
  if (daysRemaining <= 3) return { status: 'NearExpiry', daysRemaining };
  return { status: 'Fresh', daysRemaining };
}
