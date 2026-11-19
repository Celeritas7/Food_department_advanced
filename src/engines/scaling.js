/** Recipe links always store the original batch. Apply the multiplier once,
 * at calculation/display time; cook overrides already contain actual amounts.
 */
export function parseBatchScale(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const scale = Number(value);
  return Number.isFinite(scale) && scale > 0 && scale <= 1000 ? scale : null;
}
export function recipeScale(dish) {
  return dish?.recipe_data?.batchScale == null ? 1 : parseBatchScale(dish.recipe_data.batchScale);
}
export function scaleQuantity(qty, dish) {
  const scale = recipeScale(dish);
  if (qty == null || qty === '' || scale == null) return null;
  const result = Number(qty) * scale;
  return Number.isFinite(result) && result > 0 ? Number(result.toPrecision(14)) : null;
}
export function scaleForIngredient(baseQty, targetQty) {
  const base = Number(baseQty), target = Number(targetQty);
  return Number.isFinite(base) && base > 0 && Number.isFinite(target) && target > 0
    ? parseBatchScale(target / base) : null;
}
export function formatQuantity(qty) {
  return qty == null || !Number.isFinite(Number(qty)) ? 'Check quantity' : String(Number(Number(qty).toPrecision(10)));
}
