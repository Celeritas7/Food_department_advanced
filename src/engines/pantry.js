/** Quantities returned by this module are always in the ingredient's stock unit.
 * Spoons, cups, packs, cloves and mass↔volume need an ingredient-specific,
 * user-confirmed conversion. Never infer density or a cup's regional size.
 */
const aliases = {
  gm: 'g', gms: 'g', gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  piece: 'pieces', pc: 'pieces', pcs: 'pieces',
  tablespoon: 'tbsp', tablespoons: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp',
  cups: 'cup', cloves: 'clove', bulbs: 'bulb', packs: 'pack', slices: 'slice',
};
export function normalizeUnit(unit) {
  const key = String(unit ?? '').trim().toLowerCase();
  return aliases[key] || key;
}
const metric = { g: ['mass', 1], kg: ['mass', 1000], ml: ['volume', 1], l: ['volume', 1000] };
export function stockStatus(ingredient) {
  if (ingredient?.stock_status) return ingredient.stock_status;
  if (ingredient && ingredient.stock_qty == null) return 'check';
  // Historical flags were not kept in sync: positive quantities remain usable,
  // but a zero quantity marked as present must not be treated as measured zero.
  return Number(ingredient?.stock_qty) === 0 && ingredient?.in_stock ? 'have_unknown' : 'known';
}
export function stockLabel(ingredient) {
  const state = stockStatus(ingredient);
  return state === 'have_unknown' ? 'Have it, quantity unknown'
    : state === 'check' ? 'Check stock' : `${ingredient?.stock_qty ?? 0} ${ingredient?.unit || ''}`;
}
export function convertToStock(qty, unit, ingredient) {
  if (qty == null || qty === '' || !Number.isFinite(Number(qty)) || Number(qty) <= 0) return null;
  if (!ingredient) return null;
  const from = normalizeUnit(unit || ingredient.unit), to = normalizeUnit(ingredient.unit);
  if (from === to) return Number(qty); // Legacy links without a unit use stock units.
  const a = metric[from], b = metric[to];
  if (a && b && a[0] === b[0]) return Number(qty) * a[1] / b[1];
  const matches = (ingredient.unit_conversions || []).filter(c => normalizeUnit(c.unit) === from);
  if (matches.length !== 1) return null;
  const conversion = matches[0];
  if (conversion.confirmed !== true || !(Number(conversion.stock_qty) > 0) || !Number.isFinite(Number(conversion.stock_qty))) return null;
  return Number(qty) * Number(conversion.stock_qty);
}
export function evaluateNeed(ingredient, qty, unit) {
  const required = convertToStock(qty, unit, ingredient);
  const available = ingredient && stockStatus(ingredient) === 'known' && ingredient.stock_qty != null
    && Number.isFinite(Number(ingredient.stock_qty)) && Number(ingredient.stock_qty) >= 0 ? Number(ingredient.stock_qty) : null;
  const reason = !ingredient ? 'Ingredient missing' : required == null
    ? `Confirm conversion: ${unit || '?'} → ${ingredient.unit}` : available == null ? stockLabel(ingredient) : null;
  return { required, available, unit: ingredient?.unit || '', reason,
    sufficient: !reason && available + 1e-9 >= required,
    deficit: reason ? null : Math.max(0, required - available) };
}
