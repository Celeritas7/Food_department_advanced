import { useState } from 'react';
import { parseBatchScale, recipeScale, scaleForIngredient, formatQuantity } from '../../engines/scaling.js';

export default function RecipeScaleControl({ dish, links, ingredients, onApply }) {
  const current = recipeScale(dish);
  const [multiplier, setMultiplier] = useState(String(current ?? ''));
  const [anchor, setAnchor] = useState('');
  const [target, setTarget] = useState('');
  const [baseServings, setBaseServings] = useState(String(dish.recipe_data?.baseServings || ''));
  const [targetServings, setTargetServings] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = links.find(l => l.ingredient_id === anchor);
  const ingredient = ingredients.find(i => i.id === anchor);
  const unit = selected?.recipe_unit || ingredient?.unit || '';
  const apply = async (value, servingCount) => {
    const factor = parseBatchScale(value);
    if (factor == null) { setError('Enter a batch multiplier greater than 0 and at most 1000.'); return; }
    setBusy(true); setError(''); setMultiplier(String(factor));
    try {
      await onApply(factor, servingCount == null ? {} : { baseServings: servingCount });
    } catch (e) { setError(e.message || 'Batch size was not saved. Try again.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Recipe batch size" className="bg-white border rounded-xl p-4 space-y-3 mb-3">
    <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">🍽️ Batch size</h2><span className="text-sm text-warm-gray">Selected: {formatQuantity(current)}× original</span></div>
    <fieldset disabled={busy} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[0.5, 1, 2].map(n => <button type="button" key={n} onClick={() => apply(n)} aria-pressed={current === n} className={`px-3 py-1.5 rounded-lg border text-sm ${current === n ? 'bg-terracotta text-white' : ''}`}>{n === 0.5 ? 'Half' : n === 1 ? 'Original' : 'Double'}</button>)}
      </div>
      <details className="border-t pt-3">
        <summary className="text-sm cursor-pointer">Scale by servings</summary>
        <div className="flex flex-wrap items-end gap-2 mt-2">
          <label className="text-sm">Original servings<input aria-label="Original servings" type="number" step="any" min="0" value={baseServings} onChange={e => setBaseServings(e.target.value)} className="block w-28 border rounded-lg px-2 py-1.5" /></label>
          <label className="text-sm">Wanted servings<input aria-label="Wanted servings" type="number" step="any" min="0" value={targetServings} onChange={e => setTargetServings(e.target.value)} className="block w-28 border rounded-lg px-2 py-1.5" /></label>
          <button type="button" onClick={() => apply(scaleForIngredient(baseServings, targetServings), Number(baseServings))} className="px-3 py-1.5 border rounded-lg text-sm">Scale servings</button>
        </div>
        {dish.recipe_data?.baseServings > 0 && current != null && <p className="text-xs mt-2">Selected batch serves {formatQuantity(dish.recipe_data.baseServings * current)}; original serves {dish.recipe_data.baseServings}.</p>}
      </details>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">Multiplier<input aria-label="Batch multiplier" type="number" step="any" min="0" max="1000" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="block w-28 border rounded-lg px-2 py-1.5" /></label>
        <button type="button" onClick={() => apply(multiplier)} className="px-3 py-1.5 border rounded-lg text-sm">Apply batch</button>
      </div>
      {links.length > 0 && <div className="border-t pt-3 space-y-2">
        <label className="block text-sm">Scale to an ingredient amount<select aria-label="Scale ingredient" value={anchor} onChange={e => { setAnchor(e.target.value); setTarget(''); }} className="block w-full border rounded-lg p-2 mt-1">
          <option value="">Choose ingredient</option>{links.map(l => <option key={l.ingredient_id} value={l.ingredient_id}>{ingredients.find(i => i.id === l.ingredient_id)?.name || 'Unknown ingredient'} — original {l.qty} {l.recipe_unit || ingredients.find(i => i.id === l.ingredient_id)?.unit}</option>)}
        </select></label>
        {selected && <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm">Amount ({unit})<input aria-label="Target ingredient amount" value={target} onChange={e => setTarget(e.target.value)} type="number" step="any" min="0" className="block w-32 border rounded-lg px-2 py-1.5" /></label>
          <button type="button" onClick={() => apply(scaleForIngredient(selected.qty, target))} className="px-3 py-1.5 border rounded-lg text-sm">Scale to amount</button>
        </div>}
      </div>}
    </fieldset>
    {busy && <p role="status" className="text-sm">Saving batch size…</p>}
    {error && <p role="alert" className="text-sm text-tomato">{error}</p>}
    <p className="text-xs text-warm-gray">Scales linked ingredient and preparation quantities. Original recipe amounts stay saved. Use the quantity badges for this batch; numbers in recipe text stay original. Instructions, cooking times, nutrition text and unlinked ingredients need your review. Fractional eggs or pieces are shown without rounding up.</p>
  </section>;
}
