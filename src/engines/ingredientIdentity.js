/** Aliases identify the same pantry item. Substitutions are explicit recipe
 * changes, never inferred from a partial name or from an alias collision. */
export function normalizeIngredientName(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase()
    .replace(/\p{Script=Latin}\p{M}*/gu, letter => letter.normalize('NFD').replace(/\p{M}/gu, ''))
    .replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
export function parseIngredientAliases(text) {
  const seen = new Set();
  const aliases = String(text || '').split(/[,\n]/).map(a => a.trim()).filter(a => {
    const key = normalizeIngredientName(a);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  if (aliases.length > 50 || aliases.some(a => a.length > 120)) throw new Error('Use at most 50 alternate names, each up to 120 characters.');
  return aliases;
}
export function ingredientNames(ingredient) {
  return [ingredient.name, ...(Array.isArray(ingredient.aliases) ? ingredient.aliases : [])].filter(n => typeof n === 'string');
}
export function matchIngredientName(name, ingredients) {
  const key = normalizeIngredientName(name);
  const matches = key ? ingredients.filter(i => ingredientNames(i).some(n => normalizeIngredientName(n) === key)) : [];
  return { status: matches.length === 1 ? 'matched' : matches.length ? 'ambiguous' : 'unmatched', ingredient: matches.length === 1 ? matches[0] : null, matches };
}
export function ingredientMatchesSearch(ingredient, search) {
  const key = normalizeIngredientName(search);
  return !key || ingredientNames(ingredient).some(n => normalizeIngredientName(n).includes(key));
}
