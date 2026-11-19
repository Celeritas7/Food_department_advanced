import { parseIngredientAliases } from '../../engines/ingredientIdentity.js';
/**
 * IngredientForm.jsx — Ingredient add/edit with category dropdown
 */
import { stockStatus, normalizeUnit } from '../../engines/pantry.js';
import { useState } from 'react';
import { ALL_CATEGORIES, getCatEmoji } from '../../config/emoji.js';

export default function IngredientForm({ initial, onSave, onCancel }) {
  const [aliasText, setAliasText] = useState((initial?.aliases || []).join(', '));
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'g');
  const [stock, setStock] = useState(initial?.stock_qty || 0);
  const [shelfLife, setShelfLife] = useState(initial?.shelf_life_days || 7);
  const [category, setCategory] = useState(initial?.category || '');
  const [status, setStatus] = useState(stockStatus(initial));
  const [conversions, setConversions] = useState(initial?.unit_conversions || []);
  const [error, setError] = useState('');
  const [emoji, setEmoji] = useState(initial?.emoji || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    let aliases;
    try { aliases = parseIngredientAliases(aliasText); } catch (err) { setError(err.message); return; }
    const seen = new Set();
    for (const c of conversions) {
      const key = normalizeUnit(c.unit);
      if (!key || seen.has(key) || !(Number(c.stock_qty) > 0) || !Number.isFinite(Number(c.stock_qty)) || !c.confirmed) {
        setError('Enter unique conversion units, positive amounts, and confirm each conversion.'); return;
      }
      seen.add(key);
    }
    if (!Number.isFinite(Number(stock)) || Number(stock) < 0) { setError('Stock must be zero or more.'); return; }
    onSave({ aliases, stockStatus: status, unitConversions: conversions.map(c => ({ ...c, unit: normalizeUnit(c.unit), stock_qty: Number(c.stock_qty) })), name: name.trim(), unit, stockQty: stock, shelfLifeDays: shelfLife, category, emoji: emoji.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Alternate names</label>
        <textarea aria-label="Ingredient alternate names" value={aliasText} onChange={e => setAliasText(e.target.value)} placeholder="nước mắm, nuoc mam, ナンプラー" className="w-full border rounded-lg p-3" rows={2} />
        <p className="text-xs text-warm-gray">Names for the same ingredient, separated by commas or new lines. Different ingredients belong in recipe substitutions.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select value={unit} onChange={e => { setUnit(e.target.value); setConversions([]); }} className="w-full px-4 py-2 rounded-lg border">
            {[...new Set(['g', 'kg', 'ml', 'L', 'pieces', 'cups', 'clove', 'bulb', 'pack', 'tsp', 'tbsp', initial?.unit].filter(Boolean))].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Shelf Life (days)</label>
          <input type="number" value={shelfLife} onChange={e => setShelfLife(+e.target.value || 1)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Pantry quantity</label>
        <select aria-label="Pantry quantity status" value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg border mb-2">
          <option value="known">Measured quantity</option>
          <option value="have_unknown">Have it, quantity unknown</option>
          <option value="check">Check stock</option>
        </select>
        <input type="number" min="0" step="any" disabled={status !== 'known'} value={stock} onChange={e => setStock(+e.target.value || 0)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <fieldset className="border rounded-xl p-3 space-y-2">
        <legend className="text-sm font-medium">Confirmed conversions for this ingredient</legend>
        <p className="text-xs text-warm-gray">Example: 1 tbsp = 12 g for this ingredient. Check the amount yourself. Changing the pantry unit clears these conversions.</p>
        {conversions.map((c, index) => <div key={index} className="space-y-1 border-b pb-2">
          <div className="flex items-center gap-2 text-sm">
            <span>1</span><input aria-label={`Conversion unit ${index + 1}`} placeholder="tbsp" value={c.unit} className="border rounded p-1 w-20" onChange={e => setConversions(prev => prev.map((v, j) => j === index ? { ...v, unit: e.target.value, confirmed: false } : v))} />
            <span>=</span><input aria-label={`Conversion amount ${index + 1}`} type="number" min="0" step="any" value={c.stock_qty} className="border rounded p-1 w-20" onChange={e => setConversions(prev => prev.map((v, j) => j === index ? { ...v, stock_qty: e.target.value, confirmed: false } : v))} /><span>{unit}</span>
            <button type="button" aria-label={`Remove conversion ${index + 1}`} onClick={() => setConversions(prev => prev.filter((_, j) => j !== index))}>×</button>
          </div>
          <label className="text-xs"><input type="checkbox" checked={c.confirmed} onChange={e => setConversions(prev => prev.map((v, j) => j === index ? { ...v, confirmed: e.target.checked } : v))} /> I checked this conversion</label>
        </div>)}
        <button type="button" className="text-sm underline" onClick={() => setConversions(prev => [...prev, { unit: '', stock_qty: '', confirmed: false }])}>+ Add conversion</button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-tomato">{error}</p>}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border">
          <option value="">— Select —</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{getCatEmoji(c)} {c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Emoji (optional)</label>
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="e.g. 🧄"
          maxLength={4}
          className="w-full px-4 py-2 rounded-lg border text-lg"
        />
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
        <button type="submit" className="flex-1 py-2 rounded-lg bg-terracotta text-white">{initial ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
