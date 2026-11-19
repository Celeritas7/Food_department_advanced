import { useState } from 'react';
import { ingredientMatchesSearch } from '../../engines/ingredientIdentity.js';
import { recipeScale, scaleQuantity, formatQuantity } from '../../engines/scaling.js';

export default function RecipeSubstitutionControl({ dish, links, ingredients, onApply, disabled = false }) {
  const [originalId, setOriginalId] = useState('');
  const [replacementId, setReplacementId] = useState('');
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const original = links.find(l => l.ingredient_id === originalId);
  const history = Array.isArray(dish.recipe_data?.substitutionHistory) ? dish.recipe_data.substitutionHistory : [];
  const current = ingredients.find(i => i.id === originalId);
  const replacement = ingredients.find(i => i.id === replacementId);
  const candidates = ingredients.filter(i => i.id !== originalId && !links.some(l => l.ingredient_id === i.id) && ingredientMatchesSearch(i, search));
  const valid = original && replacement && Number.isFinite(Number(qty)) && Number(qty) > 0 && unit.trim() && confirmed;
  const resetChoice = () => { setReplacementId(''); setQty(''); setUnit(''); setConfirmed(false); setError(''); };
  const apply = async () => {
    if (!valid || busy) return;
    setBusy(true); setError('');
    try {
      await onApply({ originalId, replacementId, qty: Number(qty), unit: unit.trim(), note: note.trim() });
      setOriginalId(''); resetChoice(); setNote('');
    } catch (err) { setError(err.message || 'Substitution was not saved. Refresh the recipe before retrying.'); }
    finally { setBusy(false); }
  };
  return <details className="bg-white border rounded-xl p-4 mb-3">
    <summary className="font-semibold cursor-pointer">🔁 Recipe substitutions</summary>
    <p className="text-xs text-warm-gray my-2">Alternate names mean the same ingredient. A substitution changes this recipe and may change its taste or texture. Choose and confirm the replacement amount yourself.</p>
    <fieldset disabled={disabled || busy} className="space-y-3">
      <label className="block text-sm">Replace<select aria-label="Original recipe ingredient" value={originalId} onChange={e => { setOriginalId(e.target.value); resetChoice(); }} className="block w-full border rounded-lg p-2">
        <option value="">Choose recipe ingredient</option>{links.map(l => <option key={l.ingredient_id} value={l.ingredient_id}>{ingredients.find(i => i.id === l.ingredient_id)?.name || 'Unknown ingredient'}</option>)}
      </select></label>
      {original && <>
        <p className="text-sm">Original recipe: {original.qty} {original.recipe_unit || current?.unit} {current?.name}</p>
        <input aria-label="Search replacement ingredients" placeholder="Search names or alternate names" value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded-lg p-2" />
        <label className="block text-sm">Use instead<select aria-label="Replacement ingredient" value={replacementId} onChange={e => { const i = ingredients.find(i => i.id === e.target.value); setReplacementId(e.target.value); setUnit(i?.unit || ''); setQty(''); setConfirmed(false); }} className="block w-full border rounded-lg p-2">
          <option value="">Choose pantry ingredient</option>{candidates.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          {replacement && !candidates.some(i => i.id === replacement.id) && <option value={replacement.id}>{replacement.name}</option>}
        </select></label>
        <p className="text-xs text-warm-gray">Ingredients already in this recipe are excluded to avoid duplicate deductions.</p>
        {replacement && <>
          <div className="flex flex-wrap gap-2">
            <label className="text-sm">Amount for original 1× recipe<input aria-label="Replacement quantity" type="number" min="0" step="any" value={qty} onChange={e => { setQty(e.target.value); setConfirmed(false); }} className="block w-40 border rounded-lg p-2" /></label>
            <label className="text-sm">Unit<input aria-label="Replacement unit" value={unit} onChange={e => { setUnit(e.target.value); setConfirmed(false); }} className="block w-24 border rounded-lg p-2" /></label>
          </div>
          {qty && <p className="text-sm">Selected {formatQuantity(recipeScale(dish))}× batch will need {formatQuantity(scaleQuantity(qty, dish))} {unit} {replacement.name}.</p>}
          <textarea aria-label="Substitution note" placeholder="Optional taste or preparation note" maxLength={1000} value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full border rounded-lg p-2" />
          <label className="block text-sm"><input aria-label="Confirm recipe substitution" type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I checked this replacement and its amount for this recipe.</label>
          <button type="button" disabled={!valid} onClick={apply} className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50">{busy ? 'Saving substitution…' : 'Use replacement'}</button>
        </>}
      </>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-tomato mt-2">{error}</p>}
    {history.length > 0 && <ul aria-label="Substitution history" className="text-xs text-warm-gray mt-3 space-y-1">
      {history.map((h, i) => <li key={i}>{h.originalName} ({h.originalQty} {h.originalUnit}) → {h.replacementName} ({h.qty} {h.unit}){h.note ? ` · ${h.note}` : ''}</li>)}
    </ul>}
  </details>;
}
