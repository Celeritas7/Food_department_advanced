import { normalizeIngredientName, parseIngredientAliases, matchIngredientName, ingredientMatchesSearch } from '../ingredientIdentity.js';
const fish = { id: 'f', name: 'Fish sauce', aliases: ['nước mắm', 'ナンプラー'] };
const soy = { id: 's', name: 'Soy sauce', aliases: ['Shoyu'] };

test.each(['nước mắm', 'NUOC MAM', '  nuoc   mam ', 'ナンプラー', 'ﾅﾝﾌﾟﾗｰ', 'Fish-sauce'])('resolves a registered name %s to the same pantry identity', name => {
  expect(matchIngredientName(name, [fish, soy]).ingredient?.id).toBe('f');
});
test('duplicate aliases on different ingredients remain ambiguous even if one is a canonical name', () => {
  const result = matchIngredientName('fish sauce', [fish, { ...soy, aliases: ['fish sauce'] }]);
  expect(result.status).toBe('ambiguous'); expect(result.ingredient).toBeNull();
  expect(result.matches).toHaveLength(2);
});
test('never auto-matches a partial ingredient or an unregistered culinary alternative', () => {
  for (const name of ['sauce', 'chilli fish sauce', 'Fish sauce (sweet)', 'oyster sauce']) expect(matchIngredientName(name, [fish, soy]).status).toBe('unmatched');
  expect(matchIngredientName('salt', [{id:'b',name:'Unsalted butter'}]).ingredient).toBeNull();
});
test('search offers partial aliases for manual selection without changing auto-match semantics', () => {
  expect(ingredientMatchesSearch(fish, 'nuoc')).toBe(true);
  expect(matchIngredientName('nuoc', [fish]).ingredient).toBeNull();
  expect(ingredientMatchesSearch(fish, 'shoyu')).toBe(false);
});
test('Latin accent folding preserves Japanese voiced/unvoiced differences', () => {
  expect(normalizeIngredientName('ガーリック')).not.toBe(normalizeIngredientName('カーリック'));
  expect(normalizeIngredientName('nước mắm'.normalize('NFD'))).toBe('nuoc mam');
});
test('alias editor deduplicates alternate spellings while preserving display text', () => {
  expect(parseIngredientAliases('nước mắm, NUOC MAM\nナンプラー, ,')).toEqual(['nước mắm','ナンプラー']);
  expect(() => parseIngredientAliases('a'.repeat(121))).toThrow(/120/);
  expect(() => parseIngredientAliases(Array.from({length:51},(_,i)=>`alias${i}`).join(','))).toThrow(/50/);
});
