/**
 * DishForm.jsx — Dish creation/edit with inline editing, picker + CSV import
 */
import { useState, useRef } from 'react';
import { DelIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';
import IngredientPicker from '../ui/IngredientPicker';

const UNIT_OPTIONS = ['g', 'ml', 'pcs', 'tbsp', 'tsp', 'cup', 'bunch', 'pack', 'pinch', 'slice', 'clove', 'stalk', 'can', 'sheet'];

function parseIngredientCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV needs a header row + at least 1 data row');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'ingredient' || h === 'ingredient_name');
  const qtyIdx = headers.findIndex(h => h === 'qty' || h === 'quantity' || h === 'amount');
  const unitIdx = headers.findIndex(h => h === 'unit');
  if (nameIdx === -1) throw new Error('CSV must have a "name" or "ingredient" column');

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    vals.push(current.trim());
    const name = vals[nameIdx];
    if (!name || name === '(no ingredients linked)') continue;
    const qty = qtyIdx >= 0 ? (parseFloat(vals[qtyIdx]) || 0) : 0;
    const unit = unitIdx >= 0 ? (vals[unitIdx] || '') : '';
    rows.push({ name, qty, unit });
  }
  return rows;
}

export default function DishForm({ initial, ingredients, intermediates, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [country, setCountry] = useState(initial?.country || '');
  const [type, setType] = useState(initial?.dish_type || '');
  const [recipeIngs, setRecipeIngs] = useState(initial?.recipeIngredients || []);
  const [recipeInts, setRecipeInts] = useState(initial?.recipeIntermediates || []);
  const [showIngPicker, setShowIngPicker] = useState(false);
  const [csvMode, setCsvMode] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState(null);
  const csvFileRef = useRef(null);

  const addInt = () => {
    const unused = intermediates.filter(i => !recipeInts.some(x => x.intermediateId === i.id));
    if (unused.length) setRecipeInts([...recipeInts, { intermediateId: unused[0].id, qty: 1 }]);
  };

  const handlePickerConfirm = (items) => {
    setRecipeIngs(items.map(it => ({ ingredientId: it.id, qty: it.qty })));
    setShowIngPicker(false);
  };

  // Inline edit qty
  const updateIngQty = (idx, qty) => {
    setRecipeIngs(prev => prev.map((r, i) => i === idx ? { ...r, qty: parseFloat(qty) || 0 } : r));
  };

  // Inline edit unit override (stored per-recipe-link, falls back to ingredient.unit)
  const updateIngUnit = (idx, unit) => {
    setRecipeIngs(prev => prev.map((r, i) => i === idx ? { ...r, unitOverride: unit } : r));
  };

  // CSV matching
  const matchCsvToIngredients = (csvRows) => {
    return csvRows.map(row => {
      const csvName = row.name.toLowerCase().trim();
      let match = ingredients.find(i => i.name.toLowerCase() === csvName);
      if (!match) match = ingredients.find(i => i.name.toLowerCase().includes(csvName) || csvName.includes(i.name.toLowerCase()));
      return { csvName: row.name, qty: row.qty, unit: row.unit, matched: match || null, status: match ? 'matched' : 'unmatched' };
    });
  };

  const handleCsvParse = () => {
    try {
      const rows = parseIngredientCSV(csvText);
      const results = matchCsvToIngredients(rows);
      setCsvResult({ rows: results, error: null });
      setCsvMode('preview');
    } catch (err) {
      setCsvResult({ rows: [], error: err.message });
    }
  };

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvConfirm = () => {
    if (!csvResult) return;
    const matched = csvResult.rows.filter(r => r.matched);
    const existing = new Map(recipeIngs.map(ri => [ri.ingredientId, ri]));
    matched.forEach(r => {
      existing.set(r.matched.id, {
        ingredientId: r.matched.id,
        qty: r.qty || existing.get(r.matched.id)?.qty || 0,
        unitOverride: r.unit || existing.get(r.matched.id)?.unitOverride || '',
      });
    });
    setRecipeIngs(Array.from(existing.values()));
    setCsvMode(null);
    setCsvText('');
    setCsvResult(null);
  };

  const handleManualMatch = (rowIdx, ingredientId) => {
    setCsvResult(prev => {
      const updated = [...prev.rows];
      const ing = ingredients.find(i => i.id === ingredientId);
      updated[rowIdx] = { ...updated[rowIdx], matched: ing, status: 'matched' };
      return { ...prev, rows: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), priority, country, type, recipeIngredients: recipeIngs, recipeIntermediates: recipeInts });
  };

  const pickerInitial = recipeIngs.map(ri => ({ id: ri.ingredientId, qty: ri.qty }));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Dish Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(+e.target.value)} className="w-full px-4 py-2 rounded-lg border">
              {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{['Urgent', 'High', 'Normal', 'Low', 'Someday'][p - 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., Japanese" className="w-full px-4 py-2 rounded-lg border" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input value={type} onChange={e => setType(e.target.value)} placeholder="e.g., Curry, Salad, Soup" className="w-full px-4 py-2 rounded-lg border" />
        </div>

        {/* Ingredients — inline editable */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">🥕 Ingredients ({recipeIngs.length})</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setCsvMode('input'); setCsvResult(null); }}
                className="text-sm font-medium text-terracotta border border-terracotta px-3 py-1.5 rounded-lg hover:bg-terracotta/5">
                📄 CSV
              </button>
              <button type="button" onClick={() => setShowIngPicker(true)}
                className="text-sm font-medium text-white bg-terracotta px-3 py-1.5 rounded-lg">
                {recipeIngs.length > 0 ? '✏️ Edit' : '🥘 Pick'}
              </button>
            </div>
          </div>

          {/* CSV Input Mode */}
          {csvMode === 'input' && (
            <div className="mb-3 p-3 rounded-xl border-2 border-terracotta/30 bg-terracotta/5">
              <p className="text-xs font-semibold text-charcoal mb-2">Paste or upload CSV with ingredient names + quantities</p>
              <div className="bg-cream rounded-lg p-2 mb-2">
                <p className="text-[10px] font-mono text-warm-gray">name,qty,unit</p>
                <p className="text-[10px] font-mono text-warm-gray">Chicken (もも肉),200,g</p>
                <p className="text-[10px] font-mono text-warm-gray">Onion,2,pcs</p>
                <p className="text-[10px] font-mono text-warm-gray">Garlic,3,clove</p>
              </div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={'name,qty,unit\nChicken,200,g\nOnion,2,pcs'}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono min-h-[80px] mb-2"
              />
              <div className="flex gap-2">
                <input ref={csvFileRef} type="file" accept=".csv,.txt" onChange={handleCsvFile} className="hidden" />
                <button type="button" onClick={() => csvFileRef.current?.click()}
                  className="text-xs font-medium text-terracotta border border-terracotta/40 px-3 py-1.5 rounded-lg">
                  📂 File
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => { setCsvMode(null); setCsvText(''); setCsvResult(null); }}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleCsvParse} disabled={!csvText.trim()}
                  className={`text-xs font-medium px-4 py-1.5 rounded-lg text-white ${csvText.trim() ? 'bg-terracotta' : 'bg-light-gray'}`}>
                  Match
                </button>
              </div>
              {csvResult?.error && <p className="text-xs text-tomato mt-2">{csvResult.error}</p>}
            </div>
          )}

          {/* CSV Match Preview */}
          {csvMode === 'preview' && csvResult && (
            <div className="mb-3 p-3 rounded-xl border-2 border-terracotta/30 bg-white">
              <p className="text-xs font-semibold text-charcoal mb-2">
                Match Results — {csvResult.rows.filter(r => r.matched).length}/{csvResult.rows.length} matched
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {csvResult.rows.map((row, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${
                    row.matched ? 'bg-sage/10' : 'bg-tomato/5'
                  }`}>
                    <span>{row.matched ? '✅' : '❌'}</span>
                    <span className="font-medium flex-1 truncate">{row.csvName}</span>
                    {row.matched ? (
                      <span className="text-warm-gray truncate">{getCatEmoji(row.matched.category)} {row.matched.name} · {row.qty || 0}{row.unit ? ` ${row.unit}` : ''}</span>
                    ) : (
                      <select
                        onChange={e => { if (e.target.value) handleManualMatch(i, e.target.value); }}
                        className="text-xs px-1.5 py-1 rounded border border-tomato/30 bg-white max-w-[140px]"
                        defaultValue=""
                      >
                        <option value="">— pick —</option>
                        {ingredients.map(ig => <option key={ig.id} value={ig.id}>{ig.name}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setCsvMode('input')}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">← Back</button>
                <div className="flex-1" />
                <button type="button" onClick={() => { setCsvMode(null); setCsvText(''); setCsvResult(null); }}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleCsvConfirm}
                  disabled={!csvResult.rows.some(r => r.matched)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-lg text-white ${
                    csvResult.rows.some(r => r.matched) ? 'bg-sage' : 'bg-light-gray'
                  }`}>
                  Add {csvResult.rows.filter(r => r.matched).length} Ingredients
                </button>
              </div>
            </div>
          )}

          {/* Ingredient list — inline editable qty + unit */}
          {!recipeIngs.length && csvMode === null ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl text-warm-gray">
              <p className="text-2xl mb-1">🥘</p>
              <p className="text-sm">Tap "Pick" to browse or "CSV" to paste</p>
            </div>
          ) : csvMode === null && (
            <div className="space-y-1.5">
              {recipeIngs.map((x, i) => {
                const ig = ingredients.find(g => g.id === x.ingredientId);
                const displayUnit = x.unitOverride || ig?.unit || 'g';
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terracotta/5 border border-terracotta/20">
                    <span className="text-sm font-medium truncate flex-1 min-w-0">
                      {getCatEmoji(ig?.category)} {ig?.name || '?'}
                    </span>
                    <input
                      type="number"
                      value={x.qty}
                      onChange={e => updateIngQty(i, e.target.value)}
                      className="w-16 px-2 py-1 rounded border border-terracotta/30 text-sm text-center bg-white"
                      min="0"
                      step="any"
                    />
                    <select
                      value={displayUnit}
                      onChange={e => updateIngUnit(i, e.target.value)}
                      className="w-16 px-1 py-1 rounded border border-terracotta/30 text-xs bg-white"
                    >
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      {!UNIT_OPTIONS.includes(displayUnit) && <option value={displayUnit}>{displayUnit}</option>}
                    </select>
                    <button type="button" onClick={() => setRecipeIngs(recipeIngs.filter((_, j) => j !== i))}
                      className="text-warm-gray hover:text-tomato p-0.5"><DelIcon /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Intermediates */}
        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">🧑‍🍳 Preparations ({recipeInts.length})</span>
            <button type="button" onClick={addInt} disabled={!intermediates.length} className="text-sm text-purple font-medium disabled:opacity-50">+ Add</button>
          </div>
          {!recipeInts.length ? (
            <p className="text-sm text-warm-gray">{intermediates.length ? 'None' : 'Create preps first'}</p>
          ) : (
            <div className="space-y-2">
              {recipeInts.map((x, i) => {
                const it = intermediates.find(t => t.id === x.intermediateId);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={x.intermediateId} onChange={e => { const u = [...recipeInts]; u[i] = { ...u[i], intermediateId: e.target.value }; setRecipeInts(u); }} className="flex-1 px-2 py-1.5 rounded border border-purple/30 bg-purple/5 text-sm">
                      {intermediates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="number" value={x.qty} onChange={e => { const u = [...recipeInts]; u[i] = { ...u[i], qty: +e.target.value || 0 }; setRecipeInts(u); }} className="w-16 px-2 py-1.5 rounded border border-purple/30 text-sm text-center" />
                    <span className="text-xs text-warm-gray">portions</span>
                    <button type="button" onClick={() => setRecipeInts(recipeInts.filter((_, j) => j !== i))} className="p-1 text-warm-gray hover:text-tomato"><DelIcon /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!recipeIngs.length && !recipeInts.length && <p className="text-sm text-amber-600">⚠ Will be unlinked</p>}
        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-terracotta text-white">{initial ? 'Update' : 'Add'}</button>
        </div>
      </form>

      {showIngPicker && (
        <IngredientPicker
          ingredients={ingredients}
          initialSelected={pickerInitial}
          onClose={() => setShowIngPicker(false)}
          onConfirm={handlePickerConfirm}
          title="Pick Ingredients for Dish"
        />
      )}
    </>
  );
}
