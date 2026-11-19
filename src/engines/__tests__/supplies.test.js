import { validateSupplies, safePurchaseUrl, equipmentReadiness, equipmentShoppingRows, ingredientPurchaseNotes } from '../supplies.js';
import { aggregateRequirements } from '../quantity.js';
const jar = { id:'jar',name:'Glass jar',type:'container',status:'have',quantity:1,capacityMl:1000,baseFillMl:900,headspacePercent:20 };
const dish = (scale=1, equipment=[jar]) => ({id:'d',name:'Kimchi',status:'In Progress',priority:3,recipe_data:{batchScale:scale,supplies:{equipment}}});

test('capacity stays fixed while fill follows the batch; empty space affects usable volume', () => {
  expect(equipmentReadiness(dish(1))[0]).toMatchObject({state:'check',fillMl:900,requiredMl:1125,availableMl:1000});
  expect(equipmentReadiness(dish(0.5))[0]).toMatchObject({state:'ready',fillMl:450,requiredMl:562.5,availableMl:1000});
  expect(jar.capacityMl).toBe(1000);
});
test('multiple containers use combined capacity, without changing recorded count', () => {
  expect(equipmentReadiness(dish(1,[{...jar,quantity:2}]))[0]).toMatchObject({state:'ready',availableMl:2000,quantity:2});
});
test('unknown fill is never inferred from food weight and fit confirmation applies only to its selected batch', () => {
  const unknown = {...jar,baseFillMl:null,fitConfirmedScale:0.5};
  expect(equipmentReadiness(dish(0.5,[unknown]))[0].state).toBe('ready');
  expect(equipmentReadiness(dish(1,[unknown]))[0].state).toBe('check');
  expect(equipmentReadiness(dish(1,[{...jar,headspacePercent:null}]))[0].state).toBe('check');
});
test('manual fit confirmation does not hide a recorded capacity shortage', () => {
  expect(equipmentReadiness(dish(1,[{...jar,fitConfirmedScale:1}]))[0].state).toBe('check');
});
test('need/check are preserved and invalid equipment is flagged rather than treated as ready', () => {
  expect(equipmentReadiness(dish(0.5,[{...jar,status:'need'}]))[0].state).toBe('need');
  expect(equipmentReadiness(dish(1,[{id:'bad',name:'Unknown'}]))[0].state).toBe('check');
  expect(equipmentReadiness({recipe_data:{supplies:{equipment:{}}}})[0].state).toBe('check');
  expect(equipmentReadiness(dish(1000,[{...jar,baseFillMl:1e308}]))[0].state).toBe('check');
});
test.each([{quantity:1.5},{quantity:0},{capacityMl:-2},{headspacePercent:100},{purchase:{priceYen:-1}},{purchase:{checkedOn:'2026-02-30'}}])('rejects invalid recorded details %p', fields => {
  expect(()=>validateSupplies({equipment:[{...jar,...fields}]})).toThrow();
});
test('equipment count, zero price, material and care survive validation; old recipes default empty', () => {
  const clean=validateSupplies({equipment:[{...jar,material:'Glass',care:'Hand wash',compatibility:'Cold storage',purchase:{priceYen:0,checkedOn:'2026-11-19'}}]});
  expect(clean.equipment[0]).toMatchObject({quantity:1,material:'Glass',care:'Hand wash',purchase:{priceYen:0}});
  expect(validateSupplies({})).toMatchObject({equipment:[],shoppingNotes:[]});
});
test('unsafe or credential-bearing purchase links are rejected', () => {
  for (const url of ['javascript:alert(1)','data:text/html,x','https://name:secret@example.test/item']) expect(()=>safePurchaseUrl(url)).toThrow();
  expect(safePurchaseUrl('https://example.test/item')).toBe('https://example.test/item');
});
test('active recipe equipment stays per recipe rather than merging two jars', () => {
  const first=dish(),second={...dish(),id:'d2',name:'Quince'};
  expect(equipmentShoppingRows([first,second,{...dish(),id:'old',status:'Cooked'}])).toHaveLength(2);
});
test('shopping notes follow the current ingredient ID, not old substitution names or inactive recipes', () => {
  const d=dish();d.recipe_data.supplies.shoppingNotes=[{id:'note',ingredientId:'fish',name:'Fish sauce',purchase:{shop:'KALDI'}}];
  const links=[{dish_id:'d',ingredient_id:'fish'}];
  expect(ingredientPurchaseNotes([d],'fish',links)[0].purchase.shop).toBe('KALDI');
  expect(ingredientPurchaseNotes([d],'fish',[{dish_id:'d',ingredient_id:'soy'}])).toHaveLength(0);
  expect(ingredientPurchaseNotes([{...d,status:'Cooked'}],'fish',links)).toHaveLength(0);
});
test('equipment counts and purchase prices never enter food shopping quantities', () => {
  const d=dish(0.5,[{...jar,status:'need',quantity:10,purchase:{priceYen:220}}]);
  const result=aggregateRequirements([d],[{dish_id:'d',ingredient_id:'c',qty:800,recipe_unit:'g'}],[],[],[{id:'c',name:'Cabbage',unit:'g',stock_qty:100}],[]);
  expect(result.list[0]).toMatchObject({needed:400,deficit:300});
});
