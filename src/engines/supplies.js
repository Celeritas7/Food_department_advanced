import { recipeScale } from './scaling.js';
const TYPES = ['container','pan','tool','appliance'];
const STATES = ['have','need','check'];
const text = (value, max, label, required = false) => {
  const s = String(value ?? '').trim();
  if ((required && !s) || s.length > max) throw new Error(`${label}: ${required ? 'enter a value, ' : ''}up to ${max} characters.`);
  return s;
};
const number = (value, label, allowZero = false) => {
  if (value == null || value === '') return null;
  if (!['string','number'].includes(typeof value)) throw new Error(`${label} must be a number.`);
  const n = Number(value);
  if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) throw new Error(`${label} must be a finite ${allowZero ? 'non-negative' : 'positive'} number.`);
  return n;
};
export function safePurchaseUrl(value) {
  const s = text(value, 2000, 'Shop link');
  if (!s) return '';
  try {
    const url = new URL(s);
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new Error('Use an http or https shop link without login details.'); }
}
export function validatePurchase(value = {}) {
  value = value ?? {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Review the purchase record.');
  const date = text(value.checkedOn, 10, 'Price date');
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) throw new Error('Enter a valid price date.');
  return { shop: text(value.shop, 120, 'Shop'), priceYen: number(value.priceYen, 'Recorded price', true),
    packSize: text(value.packSize, 120, 'Pack size'), checkedOn: date, url: safePurchaseUrl(value.url) };
}
export function validateSupplies(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Supplies must contain equipment and shopping notes.');
  const equipment = value.equipment ?? [], notes = value.shoppingNotes ?? [];
  if (!Array.isArray(equipment) || equipment.length > 100 || !Array.isArray(notes) || notes.length > 200) throw new Error('Use at most 100 equipment entries and 200 shopping notes.');
  const unique = (rows, label) => {
    const ids = rows.map(r => text(r?.id, 100, `${label} ID`, true));
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label} entry.`);
  };
  unique(equipment,'equipment'); unique(notes,'shopping note');
  return { ...value, equipment: equipment.map(e => {
    if (!TYPES.includes(e.type) || !STATES.includes(e.status)) throw new Error('Choose an equipment type and availability.');
    const quantity = number(e.quantity ?? 1, 'Equipment count');
    if (!Number.isInteger(quantity) || quantity > 100) throw new Error('Equipment count must be a whole number from 1 to 100.');
    const headspacePercent = number(e.headspacePercent, 'Empty space percentage', true);
    if (headspacePercent != null && headspacePercent >= 100) throw new Error('Empty space must be below 100%.');
    const confirmed = number(e.fitConfirmedScale, 'Confirmed batch size');
    if (confirmed != null && confirmed > 1000) throw new Error('Confirmed batch size is too large.');
    return { ...e, id: text(e.id,100,'Equipment ID',true), name: text(e.name,120,'Equipment name',true), quantity,
      capacityMl: number(e.capacityMl,'Capacity per item'), baseFillMl: number(e.baseFillMl,'Original-batch fill volume'), headspacePercent,
      fitConfirmedScale: confirmed, material: text(e.material,120,'Material'), compatibility: text(e.compatibility,300,'Heat source / compatibility'),
      care: text(e.care,300,'Care instructions'), notes: text(e.notes,1000,'Equipment notes'), purchase: validatePurchase(e.purchase) };
  }), shoppingNotes: notes.map(n => ({ ...n, id: text(n.id,100,'Shopping note ID',true), ingredientId: text(n.ingredientId,100,'Ingredient',true),
    name: text(n.name,120,'Ingredient name',true), note: text(n.note,1000,'Shopping note'), purchase: validatePurchase(n.purchase) })) };
}
export function equipmentReadiness(dish) {
  const raw = dish?.recipe_data?.supplies?.equipment;
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [{ id:'invalid', name:'Equipment data needs review', state:'check', reason:'Review equipment entries' }];
  return raw.map(item => {
    let e;
    try { e = validateSupplies({equipment:[item]}).equipment[0]; }
    catch { return { id:item?.id || 'invalid',name:typeof item?.name==='string'?item.name:'Equipment data needs review',state:'check',reason:'Review equipment details' }; }
    const row = { ...e, state:e.status === 'have' ? 'ready' : e.status, reason:e.status === 'need' ? 'Need to get this' : 'Check availability' };
    if (e.status !== 'have') return row;
    if (e.type !== 'container') return {...row,reason:'Have for this recipe'};
    const scale = recipeScale(dish);
    if (scale == null) return {...row,state:'check',reason:'Set a valid batch size'};
    const fillMl = e.baseFillMl == null ? null : e.baseFillMl * scale;
    const requiredMl = fillMl == null || e.headspacePercent == null ? null : fillMl / (1-e.headspacePercent/100);
    const availableMl = e.capacityMl == null ? null : e.capacityMl * e.quantity;
    if ((requiredMl != null && !Number.isFinite(requiredMl)) || (availableMl != null && !Number.isFinite(availableMl))) return {...row,state:'check',reason:'Review the recorded volume values'};
    if (requiredMl != null && availableMl != null) return {...row,fillMl,requiredMl,availableMl,
      state:availableMl + 1e-7 >= requiredMl ? 'ready' : 'check',
      reason:availableMl + 1e-7 >= requiredMl ? 'Recorded volume fits' : 'Recorded volume exceeds container capacity'};
    return {...row,fillMl,requiredMl,availableMl,state:e.fitConfirmedScale === scale ? 'ready' : 'check',
      reason:e.fitConfirmedScale === scale ? 'Fit confirmed for this batch' : 'Confirm fit for the selected batch'};
  });
}
export function equipmentShoppingRows(dishes) {
  return dishes.filter(d => d.status === 'In Progress').flatMap(d => equipmentReadiness(d).map(e => ({...e,dishId:d.id,dishName:d.name})));
}
export function ingredientPurchaseNotes(dishes, ingredientId, dishIngs) {
  return dishes.filter(d => d.status === 'In Progress' && dishIngs.some(l=>l.dish_id===d.id && l.ingredient_id===ingredientId)).flatMap(d => {
    const notes = d.recipe_data?.supplies?.shoppingNotes;
    return Array.isArray(notes) ? notes.filter(n=>n?.ingredientId===ingredientId).map(n=>({...n,dishId:d.id,dishName:d.name})) : [];
  });
}
