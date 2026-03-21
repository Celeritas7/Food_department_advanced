/**
 * DishForm.jsx — Dish creation/edit with inline editing, picker, CSV + free-text import
 */
import { useState, useRef } from 'react';
import { DelIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';
import IngredientPicker from '../ui/IngredientPicker';

const UNIT_OPTIONS = ['g', 'ml', 'pcs', 'tbsp', 'tsp', 'cup', 'bunch', 'pack', 'pinch', 'slice', 'clove', 'stalk', 'can', 'sheet'];

// ─── Parsers ────────────────────────────────────────────

const KNOWN_UNITS = ['g', 'gm', 'gms', 'gram', 'grams', 'kg', 'ml', 'liter', 'litre', 'l',
  'tsp', 'tbsp', 'cup', 'cups', 'pcs', 'piece', 'pieces', 'bunch', 'pack', 'packs',
  'pinch', 'slice', 'slices', 'clove', 'cloves', 'stalk', 'stalks', 'can', 'cans',
  'sheet', 'sheets', 'inch', 'cm', 'bulb', 'bulbs', 'head', 'heads', 'sprig', 'sprigs',
  'handful', 'drop', 'drops', 'stick', 'sticks', 'pod', 'pods', 'leaf', 'leaves'];

const UNIT_NORMALIZE = {
  gm: 'g', gms: 'g', gram: 'g', grams: 'g',
  liter: 'l', litre: 'l',
  cups: 'cup', pieces: 'pcs', piece: 'pcs',
  packs: 'pack', slices: 'slice', cloves: 'clove',
  stalks: 'stalk', cans: 'can', sheets: 'sheet',
  bulbs: 'bulb', heads: 'head', sprigs: 'sprig',
  drops: 'drop', sticks: 'stick', pods: 'pod', leaves: 'leaf',
};

function parseFraction(s) {
  s = s.replace('½', '.5').replace('⅓', '.333').replace('⅔', '.667')
       .replace('¼', '.25').replace('¾', '.75').replace('⅛', '.125');
  // Handle "1½" → "1.5"
  const compound = s.match(/^(\d+)\.(\d+)$/);
  if (compound) return parseFloat(s);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 0;
}

function parseFreeTextLine(line) {
  // Clean up: remove bullets, dashes, numbers with dots/parens at start
  line = line.replace(/^[\s•\-\*·▪►→●○◦‣⁃]+/, '').trim();
  line = line.replace(/^\d+[\.\)]\s*/, '').trim();
  if (!line) return null;

  // Pattern 0: "1-inch ginger" or "2-cm piece" (hyphenated measurement)
  const p0 = line.match(/^([\d½⅓⅔¼¾⅛\/\.]+)-(inch|cm|mm)\s+(.+)$/i);
  if (p0) {
    return { name: p0[3].trim(), qty: parseFraction(p0[1]), unit: p0[2].toLowerCase() };
  }

  // Pattern 1: "150 g Unsalted butter" or "2 cups basmati rice" or "½ tsp vanilla"
  const p1 = line.match(/^([\d½⅓⅔¼¾⅛\/\.]+)\s+([\w]+)\s+(.+)$/);
  if (p1) {
    const qty = parseFraction(p1[1]);
    const maybeUnit = p1[2].toLowerCase();
    if (KNOWN_UNITS.includes(maybeUnit)) {
      return { name: p1[3].trim(), qty, unit: UNIT_NORMALIZE[maybeUnit] || maybeUnit };
    }
    // Not a unit — the whole thing after the number is the name
    return { name: (p1[2] + ' ' + p1[3]).trim(), qty, unit: 'pcs' };
  }

  // Pattern 2: "4 cloves" or "1 onion" (number + name, no separate unit)
  const p2 = line.match(/^([\d½⅓⅔¼¾⅛\/\.]+)\s+(.+)$/);
  if (p2) {
    const qty = parseFraction(p2[1]);
    const rest = p2[2].trim();
    // Check if first word of rest is a unit: "4 cloves garlic"
    const words = rest.split(/\s+/);
    if (words.length > 1 && KNOWN_UNITS.includes(words[0].toLowerCase())) {
      return { name: words.slice(1).join(' '), qty, unit: UNIT_NORMALIZE[words[0].toLowerCase()] || words[0].toLowerCase() };
    }
    return { name: rest, qty, unit: 'pcs' };
  }

  // Pattern 3: just a name (no qty): "Coriander/mint stems", "Salt to taste"
  return { name: line, qty: 0, unit: '' };
}

function parseFreeText(text) {
  return text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.match(/^(wash|soak|note|optional|adjust|to taste)/i))
    .map(parseFreeTextLine)
    .filter(Boolean);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV needs a header row + at least 1 data row');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const nameIdx = headers.findIndex(h => ['name', 'ingredient', 'ingredient_name'].includes(h));
  const qtyIdx = headers.findIndex(h => ['qty', 'quantity', 'amount', 'amount_quantity', 'amount_/_quantity'].includes(h));
  const unitIdx = headers.findIndex(h => h === 'unit');
  const notesIdx = headers.findIndex(h => ['notes', 'notes_/_purpose'].includes(h));
  if (nameIdx === -1) return null; // Not a CSV

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

    // Amount field may contain "150 g" or just "150"
    let qty = 0, unit = '';
    if (qtyIdx >= 0 && vals[qtyIdx]) {
      const amountStr = vals[qtyIdx].trim();
      const amountParts = amountStr.match(/^([\d½⅓⅔¼¾⅛\/\.]+)\s*(.*)$/);
      if (amountParts) {
        qty = parseFraction(amountParts[1]);
        unit = amountParts[2]?.trim() || '';
      }
    }
    if (unitIdx >= 0 && vals[unitIdx]) {
      unit = vals[unitIdx].trim();
    }
    if (unit) {
      const low = unit.toLowerCase();
      unit = UNIT_NORMALIZE[low] || low;
    }
    rows.push({ name, qty, unit });
  }
  return rows;
}

// Auto-detect format
function parseInput(text) {
  // If first line looks like CSV headers, use CSV parser
  const firstLine = text.split(/\r?\n/)[0]?.toLowerCase() || '';
  if (firstLine.includes('name') && firstLine.includes(',')) {
    const csvResult = parseCSV(text);
    if (csvResult && csvResult.length > 0) return { mode: 'csv', rows: csvResult };
  }
  // Otherwise treat as free text
  return { mode: 'text', rows: parseFreeText(text) };
}


// ─── Component ──────────────────────────────────────────

export default function DishForm({ initial, ingredients, intermediates, onSave, onCancel, onCreateIngredient }) {
  const [name, setName] = useState(initial?.name || '');
  const [status, setStatus] = useState(initial?.status || 'Not planned');
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [country, setCountry] = useState(initial?.country || '');
  const [type, setType] = useState(initial?.dish_type || '');
  const [recipeIngs, setRecipeIngs] = useState(initial?.recipeIngredients || []);
  const [recipeInts, setRecipeInts] = useState(initial?.recipeIntermediates || []);
  const [showIngPicker, setShowIngPicker] = useState(false);
  const [importMode, setImportMode] = useState(null); // null | 'input' | 'preview'
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const addInt = () => {
    const unused = intermediates.filter(i => !recipeInts.some(x => x.intermediateId === i.id));
    if (unused.length) setRecipeInts([...recipeInts, { intermediateId: unused[0].id, qty: 1 }]);
  };

  const handlePickerConfirm = (items) => {
    setRecipeIngs(items.map(it => ({ ingredientId: it.id, qty: it.qty })));
    setShowIngPicker(false);
  };

  const updateIngQty = (idx, qty) => {
    setRecipeIngs(prev => prev.map((r, i) => i === idx ? { ...r, qty: parseFloat(qty) || 0 } : r));
  };

  const updateIngUnit = (idx, unit) => {
    setRecipeIngs(prev => prev.map((r, i) => i === idx ? { ...r, unitOverride: unit } : r));
  };

  // ─── Import matching ───────────────────
  const matchToIngredients = (parsedRows) => {
    return parsedRows.map(row => {
      const rawName = row.name.toLowerCase().trim();
      const csvName = rawName.replace(/\(.*?\)/g, '').trim();
      const csvWords = csvName.split(/\s+/);

      // 1. Exact full name match
      let match = ingredients.find(i => i.name.toLowerCase() === rawName);
      // 2. Exact match after stripping parenthetical
      if (!match) match = ingredients.find(i => i.name.toLowerCase() === csvName);
      // 3. Whole-word match: all words of shorter name appear as whole words in longer name
      if (!match) match = ingredients.find(i => {
        const stockWords = i.name.toLowerCase().split(/\s+/);
        const shorter = csvWords.length <= stockWords.length ? csvWords : stockWords;
        const longer = csvWords.length <= stockWords.length ? stockWords : csvWords;
        return shorter.length > 0 && shorter.every(sw => sw.length > 1 && longer.some(lw => lw === sw));
      });
      return { ...row, matched: match || null };
    });
  };

  const handleParse = () => {
    try {
      const { mode, rows } = parseInput(importText);
      if (!rows.length) {
        setImportResult({ rows: [], error: 'No ingredients found. Check the format.', mode });
        return;
      }
      const matched = matchToIngredients(rows);
      setImportResult({ rows: matched, error: null, mode });
      setImportMode('preview');
    } catch (err) {
      setImportResult({ rows: [], error: err.message, mode: null });
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importResult) return;
    const matched = importResult.rows.filter(r => r.matched);
    const existing = new Map(recipeIngs.map(ri => [ri.ingredientId, ri]));
    matched.forEach(r => {
      existing.set(r.matched.id, {
        ingredientId: r.matched.id,
        qty: r.qty || existing.get(r.matched.id)?.qty || 0,
        unitOverride: r.unit || existing.get(r.matched.id)?.unitOverride || '',
      });
    });
    setRecipeIngs(Array.from(existing.values()));
    setImportMode(null);
    setImportText('');
    setImportResult(null);
  };

  const handleManualMatch = (rowIdx, ingredientId) => {
    setImportResult(prev => {
      const updated = [...prev.rows];
      const ing = ingredients.find(i => i.id === ingredientId);
      updated[rowIdx] = { ...updated[rowIdx], matched: ing };
      return { ...prev, rows: updated };
    });
  };

  const handleCreateAndMatch = async (rowIdx) => {
    if (!onCreateIngredient) return;
    const row = importResult.rows[rowIdx];
    if (!row || row.matched) return;
    try {
      const created = await onCreateIngredient({
        name: row.name.trim(),
        unit: row.unit || 'g',
        stockQty: 0,
        shelfLifeDays: 30,
        category: '',
        country: '',
      });
      // Auto-match the row to the newly created ingredient
      setImportResult(prev => {
        const updated = [...prev.rows];
        updated[rowIdx] = { ...updated[rowIdx], matched: created };
        return { ...prev, rows: updated };
      });
    } catch (err) {
      console.error('Create ingredient failed:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), status, priority, country, type, recipeIngredients: recipeIngs, recipeIntermediates: recipeInts });
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
            <label className="block text-sm font-medium mb-1">Cook Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg border">
              <option value="Not planned">Not planned</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(+e.target.value)} className="w-full px-4 py-2 rounded-lg border">
              {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{['Urgent', 'High', 'Normal', 'Low', 'Someday'][p - 1]}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., Japanese" className="w-full px-4 py-2 rounded-lg border" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input value={type} onChange={e => setType(e.target.value)} placeholder="e.g., Curry, Salad, Soup" className="w-full px-4 py-2 rounded-lg border" />
        </div>

        {/* ─── Ingredients section ─── */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">🥕 Ingredients ({recipeIngs.length})</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setImportMode('input'); setImportResult(null); }}
                className="text-sm font-medium text-terracotta border border-terracotta px-3 py-1.5 rounded-lg hover:bg-terracotta/5">
                📋 Paste
              </button>
              <button type="button" onClick={() => setShowIngPicker(true)}
                className="text-sm font-medium text-white bg-terracotta px-3 py-1.5 rounded-lg">
                {recipeIngs.length > 0 ? '✏️ Edit' : '🥘 Pick'}
              </button>
            </div>
          </div>

          {/* ─── Import Input ─── */}
          {importMode === 'input' && (
            <div className="mb-3 p-3 rounded-xl border-2 border-terracotta/30 bg-terracotta/5">
              <p className="text-xs font-semibold text-charcoal mb-1">Paste ingredient list or CSV</p>
              <p className="text-[10px] text-warm-gray mb-2">Auto-detects format: bullet lists, plain text, or CSV</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-cream rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-charcoal mb-1">Free text:</p>
                  <p className="text-[10px] font-mono text-warm-gray">2 cups basmati rice</p>
                  <p className="text-[10px] font-mono text-warm-gray">• 150 g butter</p>
                  <p className="text-[10px] font-mono text-warm-gray">½ tsp vanilla</p>
                  <p className="text-[10px] font-mono text-warm-gray">4 cloves</p>
                </div>
                <div className="bg-cream rounded-lg p-2">
                  <p className="text-[10px] font-semibold text-charcoal mb-1">CSV:</p>
                  <p className="text-[10px] font-mono text-warm-gray">name,qty,unit</p>
                  <p className="text-[10px] font-mono text-warm-gray">Chicken,200,g</p>
                  <p className="text-[10px] font-mono text-warm-gray">Onion,2,pcs</p>
                </div>
              </div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={'Paste your ingredient list here...\ne.g.:\n2 cups basmati rice\n150 g butter\n½ tsp vanilla essence\n4 cloves\nSalt to taste'}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono min-h-[100px] mb-2"
              />
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-xs font-medium text-terracotta border border-terracotta/40 px-3 py-1.5 rounded-lg">
                  📂 File
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => { setImportMode(null); setImportText(''); setImportResult(null); }}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleParse} disabled={!importText.trim()}
                  className={`text-xs font-medium px-4 py-1.5 rounded-lg text-white ${importText.trim() ? 'bg-terracotta' : 'bg-light-gray'}`}>
                  Match
                </button>
              </div>
              {importResult?.error && <p className="text-xs text-tomato mt-2">{importResult.error}</p>}
            </div>
          )}

          {/* ─── Import Preview ─── */}
          {importMode === 'preview' && importResult && (
            <div className="mb-3 p-3 rounded-xl border-2 border-terracotta/30 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-charcoal">
                  {importResult.rows.filter(r => r.matched).length}/{importResult.rows.length} matched
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-warm-gray">
                  {importResult.mode === 'csv' ? '📄 CSV' : '📝 Free text'}
                </span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {importResult.rows.map((row, i) => (
                  <div key={i} className={`px-2.5 py-2 rounded-lg text-xs ${row.matched ? 'bg-sage/10' : 'bg-tomato/5'}`}>
                    <div className="flex items-center gap-2">
                      <span>{row.matched ? '✅' : '❌'}</span>
                      <span className="font-medium truncate flex-1">{row.name}</span>
                      {row.qty > 0 && (
                        <span className="text-warm-gray font-mono whitespace-nowrap">{row.qty}{row.unit ? ` ${row.unit}` : ''}</span>
                      )}
                    </div>
                    {row.matched ? (
                      <div className="text-[10px] text-warm-gray ml-5 mt-0.5">
                        → {getCatEmoji(row.matched.category)} {row.matched.name}
                      </div>
                    ) : (
                      <div className="ml-5 mt-1 flex gap-1.5 items-center">
                        <select
                          onChange={e => { if (e.target.value) handleManualMatch(i, e.target.value); }}
                          className="text-xs px-1.5 py-1 rounded border border-tomato/30 bg-white flex-1"
                          defaultValue=""
                        >
                          <option value="">— pick ingredient —</option>
                          {ingredients.map(ig => <option key={ig.id} value={ig.id}>{getCatEmoji(ig.category)} {ig.name}</option>)}
                        </select>
                        {onCreateIngredient && (
                          <button type="button" onClick={() => handleCreateAndMatch(i)}
                            className="text-[10px] font-medium px-2 py-1 rounded-lg bg-blue-500 text-white whitespace-nowrap hover:bg-blue-600">
                            + Create
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setImportMode('input')}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">← Back</button>
                <div className="flex-1" />
                <button type="button" onClick={() => { setImportMode(null); setImportText(''); setImportResult(null); }}
                  className="text-xs font-medium text-warm-gray px-3 py-1.5">Cancel</button>
                <button type="button" onClick={handleImportConfirm}
                  disabled={!importResult.rows.some(r => r.matched)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-lg text-white ${
                    importResult.rows.some(r => r.matched) ? 'bg-sage' : 'bg-light-gray'
                  }`}>
                  Add {importResult.rows.filter(r => r.matched).length} Ingredients
                </button>
              </div>
            </div>
          )}

          {/* ─── Ingredient list — inline editable ─── */}
          {!recipeIngs.length && importMode === null ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl text-warm-gray">
              <p className="text-2xl mb-1">🥘</p>
              <p className="text-sm">Tap "Pick" to browse or "Paste" to import</p>
            </div>
          ) : importMode === null && (
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

        {/* ─── Intermediates ─── */}
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
