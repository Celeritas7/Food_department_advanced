import { convertToStock, evaluateNeed, stockStatus } from '../pantry.js';
import { aggregateRequirements } from '../quantity.js';
import { checkDishAvailability, checkIntermediateAvailability } from '../availability.js';
import { cookDish, prepareIntermediate } from '../workflowActions.js';
import { computeQuantityAggregation } from '../quantityAggregation.js';

const sugar = { id: 's', name: 'Sugar', stock_qty: 100, unit: 'g' };
const dish = { id: 'd', name: 'Cake', status: 'In Progress', priority: 3 };
const link = (qty, recipe_unit) => ({ dish_id: 'd', ingredient_id: 's', qty, recipe_unit });
const confirmed = { ...sugar, unit_conversions: [{ unit: 'tbsp', stock_qty: 12, confirmed: true }] };

test.each([[0.2, 'kg', 200], [2, 'GRAMS', 2], [2, '', 2]])('mass and legacy links: %s %s', (qty, unit, expected) => {
  expect(convertToStock(qty, unit, sugar)).toBe(expected);
});
test('volume conversion and count aliases', () => {
  expect(convertToStock(0.5, 'L', { unit: 'ml' })).toBe(500);
  expect(convertToStock(3, 'pcs', { unit: 'pieces' })).toBe(3);
});
test('no guessed density, cup size, bulb/clove equivalence, or unconfirmed conversion', () => {
  for (const unit of ['ml', 'cup', 'bulb', 'clove', 'tbsp']) expect(convertToStock(2, unit, sugar)).toBeNull();
  expect(convertToStock(2, 'tbsp', { ...confirmed, unit_conversions: [{ unit: 'tbsp', stock_qty: 12, confirmed: false }] })).toBeNull();
  expect(convertToStock(2, 'tablespoons', confirmed)).toBe(24);
});
test.each([null, '', -2, 0, NaN, Infinity])('invalid quantity %s never produces availability', qty => {
  expect(evaluateNeed(sugar, qty, 'g').sufficient).toBe(false);
});
test('presence flags never override positive stock; zero present is unknown', () => {
  expect(stockStatus({ stock_qty: 100, in_stock: false })).toBe('known');
  expect(stockStatus({ stock_qty: 0, in_stock: true })).toBe('have_unknown');
  for (const stock_status of ['have_unknown', 'check']) {
    const row = { ...sugar, stock_status };
    expect(evaluateNeed(row, 2, 'g')).toMatchObject({ sufficient: false, available: null, deficit: null });
    expect(checkDishAvailability(dish, [link(2, 'g')], [], [row], []).canCook).toBe(false);
  }
});
test('availability, shopping and actual deduction agree on 2 tablespoons = 24 g', () => {
  const links = [link(2, 'tbsp')];
  expect(checkDishAvailability(dish, links, [], [confirmed], []).canCook).toBe(true);
  expect(aggregateRequirements([dish], links, [], [], [confirmed], []).list[0]).toMatchObject({ needed: 24, deficit: 0, requiresCheck: false });
  expect(cookDish('d', [dish], links, [], [confirmed], []).updatedIngredients[0].stock_qty).toBe(76);
});
test('mixed recipes sum in stock units and subtract stock once', () => {
  const second = { ...dish, id: 'd2' };
  const links = [link(0.1, 'kg'), { ...link(25, 'g'), dish_id: 'd2' }];
  const result = aggregateRequirements([dish, second], links, [], [], [sugar], []);
  expect(result.list[0]).toMatchObject({ needed: 125, deficit: 25 });
});
test('one unconvertible row keeps the entire shopping amount uncertain', () => {
  const second = { ...dish, id: 'd2' };
  const links = [link(20, 'g'), { ...link(2, 'tbsp'), dish_id: 'd2' }];
  expect(aggregateRequirements([dish, second], links, [], [], [sugar], []).list[0]).toMatchObject({ needed: null, deficit: null, requiresCheck: true });
  const compatibility = computeQuantityAggregation([dish, second], links, [], [sugar], []);
  expect(compatibility.ingredientDeficits.get('s')).toBeNull();
});
test('unknown stock is a check, not a numeric buy suggestion', () => {
  expect(aggregateRequirements([dish], [link(20, 'g')], [], [], [{ ...sugar, stock_status: 'check' }], []).list[0])
    .toMatchObject({ needed: 20, stock: null, deficit: null, requiresCheck: true });
});
test('direct and preparation deficit requirements share one stock balance', () => {
  const prep = { id: 'p', stock_qty: 1, name: 'Syrup', unit: 'portions' };
  const inputs = [{ intermediate_id: 'p', ingredient_id: 's', qty_per_unit: 0.05, recipe_unit: 'kg' }];
  const ints = [{ dish_id: 'd', intermediate_id: 'p', qty: 3 }];
  expect(aggregateRequirements([dish], [link(20, 'g')], ints, inputs, [sugar], [prep]).list[0]).toMatchObject({ needed: 120, deficit: 20 });
  expect(checkIntermediateAvailability(prep, inputs, [sugar]).canPrepare).toBe(true);
  const enriched = { ...prep, input_ingredients: inputs };
  expect(prepareIntermediate('p', 1, [enriched], [sugar]).updatedIngredients[0].stock_qty).toBe(50);
  expect(() => prepareIntermediate('p', 1, [enriched], [{ ...sugar, stock_status: 'check' }])).toThrow();
});

test('deducting the last measured stock does not turn zero into quantity unknown', () => {
  const row = { ...sugar, stock_qty: 24, in_stock: true };
  const cooked = cookDish('d', [dish], [link(24, 'g')], [], [row], []).updatedIngredients[0];
  expect(cooked.stock_qty).toBe(0);
  expect(stockStatus(cooked)).toBe('known');
  expect(cooked.in_stock).toBe(false);
});
