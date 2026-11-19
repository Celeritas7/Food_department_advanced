import { parseBatchScale, recipeScale, scaleQuantity, scaleForIngredient } from '../scaling.js';
import { aggregateRequirements } from '../quantity.js';
import { computeQuantityAggregation } from '../quantityAggregation.js';
import { checkDishAvailability } from '../availability.js';
import { cookDish } from '../workflowActions.js';

const dish = { id: 'd', name: 'Kimchi', status: 'In Progress', priority: 3, recipe_data: { batchScale: 0.5 } };
const cabbage = { id: 'c', name: 'Cabbage', unit: 'g', stock_qty: 500 };
const links = [{ dish_id: 'd', ingredient_id: 'c', qty: 0.8, recipe_unit: 'kg' }];
const prep = { id: 'p', name: 'Paste', stock_qty: 1, unit: 'portions', input_ingredients: [{ ingredientId: 'c', qtyPerUnit: 100 }] };
const prepLinks = [{ dish_id: 'd', intermediate_id: 'p', qty: 2 }];

test('old recipes default to original batch; input supports half, double and precise custom amounts', () => {
  expect(recipeScale({})).toBe(1);
  expect(scaleQuantity(800, dish)).toBe(400);
  expect(scaleQuantity(0.1, { recipe_data: { batchScale: 3 } })).toBe(0.3);
  expect(scaleForIngredient(800, 400)).toBe(0.5);
  expect(scaleForIngredient(800, 600)).toBe(0.75);
});
test.each([0, -1, Infinity, NaN, '', null, false, true, {}, 'NaN', 1001])('rejects invalid multiplier %p', value => {
  expect(parseBatchScale(value)).toBeNull();
});
test('half batch agrees across availability, shopping, legacy aggregation and deductions', () => {
  const original = JSON.stringify(links);
  expect(checkDishAvailability(dish, links, prepLinks, [cabbage], [prep]).canCook).toBe(true);
  expect(aggregateRequirements([dish], links, prepLinks, [], [cabbage], [prep]).list[0]).toMatchObject({ needed: 400, deficit: 0 });
  expect(computeQuantityAggregation([dish], links, prepLinks, [cabbage], [prep]).ingredientRequirements.get('c')).toBe(400);
  const result = cookDish('d', [dish], links, prepLinks, [cabbage], [prep]);
  expect(result.updatedIngredients[0].stock_qty).toBe(100);
  expect(result.updatedIntermediates[0].stock_qty).toBe(0);
  expect(JSON.stringify(links)).toBe(original);
});
test('double batch includes only preparation deficit after scaling, and deducts stock once', () => {
  const doubled = { ...dish, recipe_data: { batchScale: 2 } };
  const inputs = [{ intermediate_id: 'p', ingredient_id: 'c', qty_per_unit: 100 }];
  // Direct 1600 g + (4 paste portions - 1 in stock) × 100 g = 1900 g.
  expect(aggregateRequirements([doubled], links, prepLinks, inputs, [cabbage], [prep]).list[0]).toMatchObject({ needed: 1900, deficit: 1400 });
  expect(checkDishAvailability(doubled, links, prepLinks, [cabbage], [prep]).canCook).toBe(false);
});
test('mixed batch multipliers add their requirements before subtracting pantry stock', () => {
  const second = { ...dish, id: 'd2', recipe_data: { batchScale: 0.25 } };
  const reqs = [...links, { ...links[0], dish_id: 'd2' }];
  expect(aggregateRequirements([dish, second], reqs, [], [], [cabbage], []).list[0]).toMatchObject({ needed: 600, deficit: 100 });
});
test('a conversion is ingredient-specific and applied once after scaling', () => {
  const sugar = { ...cabbage, unit_conversions: [{ unit: 'tbsp', stock_qty: 12, confirmed: true }] };
  const recipe = [{ ...links[0], qty: 2, recipe_unit: 'tbsp' }];
  expect(aggregateRequirements([dish], recipe, [], [], [sugar], []).list[0].needed).toBe(12);
  expect(aggregateRequirements([dish], recipe, [], [], [cabbage], []).list[0].deficit).toBeNull();
});
test('invalid saved scales block cooking and produce uncertain shopping quantities', () => {
  const invalid = { ...dish, recipe_data: { batchScale: -1 } };
  expect(checkDishAvailability(invalid, links, prepLinks, [cabbage], [prep]).canCook).toBe(false);
  expect(checkDishAvailability(invalid, [], prepLinks, [], [prep]).canCook).toBe(false);
  expect(aggregateRequirements([invalid], links, prepLinks, [{ intermediate_id: 'p', ingredient_id: 'c', qty_per_unit: 100 }], [cabbage], [prep]).list[0].requiresCheck).toBe(true);
});
test('fractional pieces remain explicit instead of rounding inventory deductions', () => {
  expect(scaleQuantity(3, dish)).toBe(1.5);
  expect(scaleForIngredient(0, 400)).toBeNull();
});
