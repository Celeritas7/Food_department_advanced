/**
 * RecipePage.jsx — Full recipe view & editor
 * 6 Notion-style collapsible sections (all optional):
 *   🍗🔥 Overview (description, key idea, flavor notes)
 *   🍎 Nutrition (calories, protein, etc.)
 *   🧾 Ingredients (grouped, collapsible)
 *   🥣 Preparation (checklist, collapsible)
 *   👨‍🍳 Step-by-Step Cooking (grouped steps + precautions)
 *   🍽️ Serve
 *
 * Section visibility is configurable per recipe via ⚙️ button.
 * Two import modes: AI (Claude API) and Quick Parse (offline).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { BackIcon } from '../ui/Icons';
import ANTHROPIC_API_KEY from '../../config/anthropic.js';

const uid = () => Math.random().toString(36).slice(2, 9);

const ALL_SECTIONS = [
  { key: 'overview', emoji: '🔥', label: 'Overview' },
  { key: 'nutrition', emoji: '🍎', label: 'Nutrition' },
  { key: 'ingredients', emoji: '🧾', label: 'Ingredients' },
  { key: 'preparation', emoji: '🥣', label: 'Preparation' },
  { key: 'cooking', emoji: '👨‍🍳', label: 'Step-by-Step Cooking' },
  { key: 'serve', emoji: '🍽️', label: 'Serve' },
];
const DEFAULT_VISIBLE = ['ingredients', 'preparation', 'cooking', 'serve'];


// ═══════════════════════════════════════════════════════════
// TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════

function Toggle({ open: defaultOpen = true, emoji, title, badge, rightSlot, editableTitle, onTitleChange, children, level = 1 }) {
  const [open, setOpen] = useState(defaultOpen);
  const isMain = level === 1;
  return (
    <div className={isMain ? 'mb-2' : 'mb-4'}>
      <div className={'flex items-center gap-2.5 py-2 px-1 rounded-lg hover:bg-black/[0.03] transition-colors ' + (isMain ? '' : 'pl-1')}>
        <button onClick={() => setOpen(!open)} className="shrink-0">
          <span className={'transition-transform duration-200 text-warm-gray inline-block ' + (open ? 'rotate-90' : '')} style={{ fontSize: isMain ? 16 : 13 }}>▶</span>
        </button>
        {emoji && <span className={isMain ? 'text-2xl' : 'text-lg'}>{emoji}</span>}
        {editableTitle ? (
          <input value={title} onChange={e => onTitleChange(e.target.value)}
            className={'font-bold flex-1 bg-transparent outline-none border-b border-dashed border-gray-300 focus:border-terracotta ' + (isMain ? 'text-xl' : 'text-[17px]')}
            placeholder="Name..." />
        ) : (
          <button onClick={() => setOpen(!open)} className={'font-bold flex-1 text-left ' + (isMain ? 'text-xl' : 'text-[17px]')}>{title}</button>
        )}
        {badge}
        {rightSlot}
      </div>
      {open && <div className={isMain ? 'pl-4 mt-2' : 'pl-5 mt-1'}>{children}</div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// SECTION VISIBILITY MANAGER
// ═══════════════════════════════════════════════════════════

function SectionManager({ visible, onChange, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggle = (key) => {
    if (visible.includes(key)) {
      onChange(visible.filter(k => k !== key));
    } else {
      // Insert in canonical order
      const ordered = ALL_SECTIONS.map(s => s.key).filter(k => visible.includes(k) || k === key);
      onChange(ordered);
    }
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border z-30 py-2 w-56">
      <p className="px-3 pb-2 text-xs font-semibold text-warm-gray border-b mb-1">Visible Sections</p>
      {ALL_SECTIONS.map(s => (
        <button key={s.key} onClick={() => toggle(s.key)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-cream text-left">
          <span className={'w-4 h-4 rounded border flex items-center justify-center text-[10px] ' +
            (visible.includes(s.key) ? 'bg-terracotta border-terracotta text-white' : 'border-gray-300')}>
            {visible.includes(s.key) && '✓'}
          </span>
          <span>{s.emoji}</span>
          <span className="flex-1">{s.label}</span>
        </button>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// OFFLINE PARSER
// ═══════════════════════════════════════════════════════════

function offlineParseNotionText(raw) {
  const lines = raw.split('\n');
  const sectionRegexes = {
    overview: /^#*\s*(?:🍗?🔥?|📝)?\s*\**overview\**/i,
    nutrition: /^#*\s*(?:🍎|🥗)?\s*\**nutrition\**/i,
    ingredients: /^#*\s*(?:🧾|📋|🍲)?\s*\**ingredients\**/i,
    preparation: /^#*\s*(?:🥣|🔪)?\s*\**preparation/i,
    cooking: /^#*\s*(?:👨‍🍳|🍳|👩‍🍳)?\s*\**(?:step[- ]by[- ]step|cooking|cook)\**/i,
    serve: /^#*\s*(?:🍽️?|🍽)?\s*\**serve\**/i,
  };
  const sections = [];
  lines.forEach((line, i) => {
    const t = line.trim(); if (!t) return;
    for (const [key, regex] of Object.entries(sectionRegexes)) {
      if (regex.test(t)) { sections.push({ key, start: i }); return; }
    }
  });
  if (sections.length === 0) {
    // Check if it's a standalone table (Notion database copy)
    const tabLines = lines.filter(l => l.includes('\t') && l.trim());
    if (tabLines.length >= 2) {
      return { overview: '', nutrition: [], ingredientGroups: parseIngredientTable(tabLines), preparation: [], cookingSteps: [], serve: '' };
    }
    const items = lines.filter(l => l.trim()).map(l => ({ text: cleanLine(l) })).filter(i => i.text);
    return { overview: '', nutrition: [], ingredientGroups: items.length ? [{ name: 'All Ingredients', items }] : [], preparation: [], cookingSteps: [], serve: '' };
  }
  const sectionLines = {};
  sections.forEach((sec, idx) => {
    const nextStart = idx < sections.length - 1 ? sections[idx + 1].start : lines.length;
    sectionLines[sec.key] = lines.slice(sec.start + 1, nextStart);
  });
  const detected = sections.map(s => s.key);
  return {
    overview: parseTextBlock(sectionLines.overview || []),
    nutrition: parseBulletList(sectionLines.nutrition || []),
    ingredientGroups: parseIngredients(sectionLines.ingredients || []),
    preparation: parseChecklist(sectionLines.preparation || []),
    cookingSteps: parseCookingSteps(sectionLines.cooking || []),
    serve: parseServe(sectionLines.serve || []),
    _detectedSections: detected,
  };
}

function cleanLine(line) {
  return line.replace(/^\s*[-•*]\s*/, '').replace(/^\[[ x]\]\s*/, '').replace(/^#+\s*/, '').replace(/^⚠️?\s*/, '').replace(/\*\*/g, '').trim();
}
function isBullet(line) { return /^\s*[-•*]\s/.test(line); }
function isCheckbox(line) { return /^\s*[-•*]\s*\[[ x]\]/.test(line) || /^\s*\[[ x]\]/.test(line); }
function isHeading(line) { return /^\s*#{2,}\s/.test(line); }

function parseTextBlock(lines) {
  return lines.filter(l => l.trim()).map(l => cleanLine(l)).filter(t => t).join('\n');
}

function parseBulletList(lines) {
  return lines.filter(l => l.trim() && (isBullet(l) || l.trim().length > 0)).map(l => ({ text: cleanLine(l) })).filter(i => i.text);
}

function parseIngredients(lines) {
  // ─── Detect table format (tab-separated, from Notion database copy) ───
  const tabLines = lines.filter(l => l.includes('\t') && l.trim());
  if (tabLines.length >= 2) {
    return parseIngredientTable(tabLines);
  }

  // ─── Standard bullet-list format ───
  const groups = []; let cur = null;
  for (const line of lines) {
    const t = line.trim(); if (!t) continue;
    if (isHeading(line) || (!isBullet(line) && !isCheckbox(line) && !line.includes('\t') && t.length < 80)) {
      if (cur && cur.items.length > 0) groups.push(cur);
      cur = { name: cleanLine(line), items: [] };
    } else if (isBullet(line) || isCheckbox(line)) {
      const text = cleanLine(line); if (!text) continue;
      if (!cur) cur = { name: 'All Ingredients', items: [] };
      cur.items.push({ text });
    }
  }
  if (cur && cur.items.length > 0) groups.push(cur);
  if (groups.length === 0) {
    const items = lines.filter(l => l.trim()).map(l => ({ text: cleanLine(l) })).filter(i => i.text);
    if (items.length) groups.push({ name: 'All Ingredients', items });
  }
  return groups;
}

// ─── Parse Notion database table (tab-separated) ───
function parseIngredientTable(tabLines) {
  // First line is likely the header
  const header = tabLines[0].split('\t').map(h => h.trim().toLowerCase());
  const dataLines = tabLines.slice(1);

  // Try to identify columns
  const nameCol = header.findIndex(h => /ingredient|name|item/i.test(h));
  const amtCol = header.findIndex(h => /amount|qty|quantity|measure/i.test(h));
  const notesCol = header.findIndex(h => /note|purpose|comment|tip/i.test(h));

  // If we can't identify a name column, treat first column as name
  const nIdx = nameCol >= 0 ? nameCol : 0;
  const aIdx = amtCol >= 0 ? amtCol : (header.length > 1 ? 1 : -1);
  const noteIdx = notesCol >= 0 ? notesCol : -1;

  // Check if first "data" line is actually a header (no tabs = not data)
  // or if there's no clear header row
  let startIdx = 0;
  if (nameCol < 0 && !tabLines[0].split('\t').some(c => /^\d/.test(c.trim()))) {
    // First row looks like a header, skip it
    startIdx = 0;
  }

  const items = [];
  for (let i = startIdx; i < dataLines.length; i++) {
    const cols = dataLines[i].split('\t').map(c => c.trim());
    const name = cols[nIdx] || '';
    if (!name) continue;

    const amount = aIdx >= 0 ? (cols[aIdx] || '') : '';
    const notes = noteIdx >= 0 ? (cols[noteIdx] || '') : '';

    // Build display text: "name amount" or "name amount (notes)"
    let text = name;
    if (amount) text += ' ' + amount;
    if (notes) text += ' — ' + notes;

    items.push({ text: text.trim() });
  }

  return items.length > 0 ? [{ name: 'All Ingredients', items }] : [];
}

function parseChecklist(lines) {
  return lines.filter(l => l.trim() && (isBullet(l) || isCheckbox(l))).map(l => ({ text: cleanLine(l) })).filter(i => i.text);
}

function parseCookingSteps(lines) {
  const steps = []; let cur = null; let inPrec = false;
  for (const line of lines) {
    const t = line.trim(); if (!t) continue;
    if (/precaution/i.test(t) && (/^#{2,}/.test(t) || /^⚠/.test(t) || /^\*\*⚠/.test(t) || /^\**precaution/i.test(t))) { inPrec = true; continue; }
    if ((isHeading(line) || (/^(?:step\s*\d|▾)/i.test(t) && !isBullet(line))) && !/precaution/i.test(t)) {
      inPrec = false; if (cur) steps.push(cur);
      cur = { name: cleanLine(line), items: [], precautions: [] }; continue;
    }
    if (isBullet(line) || isCheckbox(line)) {
      const text = cleanLine(line); if (!text) continue;
      if (!cur) cur = { name: 'Step 1', items: [], precautions: [] };
      if (inPrec) cur.precautions.push({ text }); else cur.items.push({ text });
    }
  }
  if (cur && (cur.items.length > 0 || cur.precautions.length > 0)) steps.push(cur);
  return steps;
}

function parseServe(lines) {
  return lines.filter(l => l.trim()).map(l => cleanLine(l)).filter(t => t).join('\n');
}


// ═══════════════════════════════════════════════════════════
// AI SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════

const AI_SYSTEM_PROMPT = `You are a recipe parser. Convert raw recipe text into structured JSON. Return ONLY valid JSON.

Structure:
{
  "overview": "Plain text overview/description of the dish",
  "nutrition": [{ "text": "Calories: 350 kcal" }, { "text": "Protein: 25g" }],
  "ingredientGroups": [{ "name": "Group", "items": [{ "text": "2 cups rice" }] }],
  "preparation": [{ "text": "Wash rice" }],
  "cookingSteps": [{ "name": "Step 1: Make Stock", "items": [{ "text": "Add water" }], "precautions": [{ "text": "Don't over-boil" }] }],
  "serve": "Serve hot with raita.",
  "structuredIngredients": [
    { "name": "basmati rice", "qty": 2, "unit": "cups" },
    { "name": "onion", "qty": 1, "unit": "piece" },
    { "name": "garlic", "qty": 0.5, "unit": "bulb" },
    { "name": "salt", "qty": 1, "unit": "tsp" }
  ]
}

Rules:
- overview = description, flavor notes, key ideas. Plain text, newline separated.
- nutrition = array of bullet items (Calories, Protein, Fat, Carbs, Serving size, Yield, etc.)
- Split ingredients into sub-groups if obvious, otherwise "All Ingredients".
- preparation = prep tasks before cooking. cookingSteps = named stages with items + precautions.
- serve = plating/garnish text. Empty sections = [] or "".
- Parse faithfully. Precautions marked by ⚠️ or warning phrases.
- structuredIngredients: extract EVERY ingredient across all groups into a flat list with normalized name (lowercase, singular, no qty/unit in name), numeric qty, and unit. This powers stock tracking. Include even small items like salt, oil, spices. If qty is unspecified, use 1. If unit is unclear, use "piece".`;


// ═══════════════════════════════════════════════════════════
// IMPORT MODAL
// ═══════════════════════════════════════════════════════════

function ImportModal({ onImport, onClose, notify, stockIngredients = [] }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseMethod, setParseMethod] = useState(null);
  const [apiError, setApiError] = useState(null);
  const apiKey = ANTHROPIC_API_KEY;
  const hasKey = apiKey && apiKey !== 'YOUR_ANTHROPIC_API_KEY';

  // Build stock names for AI context
  const stockNamesStr = stockIngredients.length > 0
    ? '\n\nAvailable stock ingredients (match structuredIngredients names to these when possible): ' + stockIngredients.map(s => s.name).join(', ')
    : '';

  const handleAIParse = async () => {
    if (!text.trim()) return notify('Paste your Notion recipe text first');
    setApiError(null);
    if (!hasKey) { setApiError({ type: 'no_key', message: 'API key not configured', detail: 'Add key in src/config/anthropic.js or GitHub secret.' }); return; }
    setParsing(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: 'Parse this recipe:' + stockNamesStr + '\n\n' + text }] }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const status = response.status; const msg = err.error?.message || '';
        if (status === 401) setApiError({ type: 'auth', message: 'Invalid API key', detail: 'Check at console.anthropic.com.' });
        else if (status === 429 || status === 529) setApiError({ type: 'rate_limit', message: 'Rate limited', detail: 'Wait and retry.' });
        else if (status === 403 || msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('billing')) setApiError({ type: 'credits', message: 'No API credits', detail: 'Add at console.anthropic.com/settings/billing.' });
        else setApiError({ type: 'api', message: 'API error (' + status + ')', detail: msg || 'Try again.' });
        setParsing(false); return;
      }
      const data = await response.json();
      const raw = data.content?.map(c => c.text || '').join('') || '';
      const parsed = JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
      setPreview(parsed); setParseMethod('ai'); notify('AI parsed!', 'success');
    } catch (err) {
      if (err instanceof SyntaxError) setApiError({ type: 'parse', message: 'Bad AI format', detail: 'Try Quick Parse.' });
      else setApiError({ type: 'generic', message: 'Failed', detail: err.message });
    }
    setParsing(false);
  };

  const handleOfflineParse = () => {
    if (!text.trim()) return notify('Paste recipe text first');
    setApiError(null);
    try { const parsed = offlineParseNotionText(text); setPreview(parsed); setParseMethod('offline'); notify('Quick parse done!', 'success'); }
    catch (err) { notify('Parse failed: ' + err.message); }
  };

  // Match AI's structuredIngredients to stock
  const matchedLinks = preview?.structuredIngredients && stockIngredients.length > 0
    ? (preview.structuredIngredients || []).map(si => {
        const siNorm = si.name.toLowerCase().trim();
        let best = null; let bestScore = 0;
        for (const s of stockIngredients) {
          const sNorm = s.name.toLowerCase().trim();
          if (siNorm === sNorm || siNorm.includes(sNorm) || sNorm.includes(siNorm)) {
            const score = Math.max(siNorm.length, sNorm.length);
            if (score > bestScore) { best = s; bestScore = score; }
          }
        }
        return best ? { ingredientId: best.id, name: best.name, qty: si.qty || 1, recipeUnit: si.unit, stockUnit: best.unit, stockQty: best.stock_qty } : { name: si.name, qty: si.qty || 1, recipeUnit: si.unit, unmatched: true };
      })
    : [];

  const handleApply = () => {
    if (!preview) return;
    const detected = preview._detectedSections || [];
    const autoVisible = [...DEFAULT_VISIBLE];
    if (preview.overview && !autoVisible.includes('overview')) autoVisible.unshift('overview');
    if ((preview.nutrition || []).length > 0 && !autoVisible.includes('nutrition')) {
      const idx = autoVisible.indexOf('ingredients');
      autoVisible.splice(idx >= 0 ? idx : 1, 0, 'nutrition');
    }

    const withIds = {
      visibleSections: autoVisible,
      overview: preview.overview || '',
      nutrition: (preview.nutrition || []).map(n => ({ id: uid(), text: n.text || '' })),
      ingredientGroups: (preview.ingredientGroups || []).map(g => ({ id: uid(), name: g.name || '', items: (g.items || []).map(it => ({ id: uid(), text: it.text || '' })) })),
      preparation: (preview.preparation || []).map(p => ({ id: uid(), text: p.text || '', checked: false })),
      cookingSteps: (preview.cookingSteps || []).map(s => ({ id: uid(), name: s.name || '', items: (s.items || []).map(it => ({ id: uid(), text: it.text || '', checked: false })), precautions: (s.precautions || []).map(p => ({ id: uid(), text: p.text || '' })) })),
      serve: preview.serve || '',
      // Pass matched dish-ingredient links (only matched ones)
      _dishLinks: matchedLinks.filter(l => !l.unmatched).map(l => ({ ingredientId: l.ingredientId, qty: l.qty, unit: l.recipeUnit || null })),
    };
    onImport(withIds); onClose();
  };

  const matchedCount = matchedLinks.filter(l => !l.unmatched).length;
  const totalStructured = preview?.structuredIngredients?.length || 0;

  const ps = preview ? {
    hasOverview: !!preview.overview,
    nutritionCount: (preview.nutrition || []).length,
    groups: preview.ingredientGroups?.length || 0, items: (preview.ingredientGroups || []).reduce((a, g) => a + (g.items?.length || 0), 0),
    prep: preview.preparation?.length || 0, steps: preview.cookingSteps?.length || 0,
    stepItems: (preview.cookingSteps || []).reduce((a, s) => a + (s.items?.length || 0), 0),
    precautions: (preview.cookingSteps || []).reduce((a, s) => a + (s.precautions?.length || 0), 0), hasServe: !!preview.serve,
  } : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div><h2 className="font-bold text-base">📥 Recipe Import</h2><p className="text-xs text-warm-gray mt-0.5">Paste Notion recipe → parse into sections</p></div>
          <button onClick={onClose} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/20 text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Copy from Notion → Select all (Ctrl+A) → Copy (Ctrl+C) → Paste below</p>
          </div>
          <textarea value={text} onChange={e => { setText(e.target.value); setPreview(null); setApiError(null); setParseMethod(null); }}
            rows={12} placeholder={'Paste your recipe here...'}
            className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:border-terracotta/50 outline-none font-mono leading-relaxed" />
          {apiError && (
            <div className={'rounded-xl p-4 text-sm ' + (apiError.type === 'credits' || apiError.type === 'no_key' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200')}>
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{apiError.type === 'no_key' ? '🔑' : apiError.type === 'credits' ? '💳' : '⚠️'}</span>
                <div className="flex-1"><p className="font-semibold text-sm">{apiError.message}</p><p className="text-xs mt-1">{apiError.detail}</p>
                  <p className="text-xs mt-2 text-emerald-700 font-medium">👇 Use Quick Parse — free & instant!</p></div>
                <button onClick={() => setApiError(null)} className="text-warm-gray text-xs p-1">✕</button>
              </div>
            </div>
          )}
          {!preview && (
            <div className="space-y-2">
              <button onClick={handleAIParse} disabled={parsing || !text.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {parsing ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Parsing...</>) : '🧠 Parse with AI'}
              </button>
              <div className="flex items-center gap-3"><hr className="flex-1 border-light-gray" /><span className="text-xs text-warm-gray">or</span><hr className="flex-1 border-light-gray" /></div>
              <button onClick={handleOfflineParse} disabled={!text.trim()}
                className="w-full py-3 rounded-xl bg-white border-2 border-emerald-300 text-emerald-700 font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-emerald-50">
                📋 Quick Parse (Offline — free, instant)
              </button>
            </div>
          )}
          {preview && (
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="font-semibold text-sm text-emerald-800 mb-2">✅ Parsed {parseMethod === 'ai' ? 'with AI' : 'offline'}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700">
                  {ps.hasOverview && <span>🔥 Overview: Yes</span>}
                  {ps.nutritionCount > 0 && <span>🍎 {ps.nutritionCount} nutrition items</span>}
                  <span>🧾 {ps.groups} group{ps.groups !== 1 ? 's' : ''} ({ps.items} items)</span>
                  <span>🥣 {ps.prep} prep steps</span>
                  <span>👨‍🍳 {ps.steps} stages ({ps.stepItems} actions)</span>
                  <span>⚠️ {ps.precautions} precautions</span>
                </div>
              </div>

              {/* Stock matching summary (AI parse only) */}
              {parseMethod === 'ai' && totalStructured > 0 && (
                <div className={'rounded-xl p-4 text-sm ' + (matchedCount > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200')}>
                  <p className="font-semibold text-sm mb-2">
                    📦 Stock Linking: {matchedCount}/{totalStructured} ingredients matched
                  </p>
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {matchedLinks.map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={l.unmatched ? 'text-amber-500' : 'text-emerald-600'}>{l.unmatched ? '○' : '●'}</span>
                        <span className={l.unmatched ? 'text-amber-700' : 'text-emerald-800'}>
                          {l.name} — {l.qty} {l.recipeUnit || ''}
                        </span>
                        {!l.unmatched && <span className="text-gray-400 ml-auto">({l.stockQty} {l.stockUnit} in stock)</span>}
                      </div>
                    ))}
                  </div>
                  {matchedCount > 0 && (
                    <p className="text-xs text-blue-600 mt-2">✓ Matched ingredients will auto-link to your dish — powers availability % and shopping list</p>
                  )}
                </div>
              )}
              <details className="bg-gray-50 rounded-xl overflow-hidden"><summary className="px-4 py-2.5 text-xs font-semibold cursor-pointer hover:bg-gray-100">🔍 Preview raw data</summary>
                <pre className="px-4 py-3 text-[10px] text-gray-600 overflow-x-auto max-h-48">{JSON.stringify(preview, null, 2)}</pre></details>
              <div className="flex gap-2">
                <button onClick={() => { setPreview(null); setParseMethod(null); }} className="flex-1 py-2.5 rounded-xl border text-sm text-warm-gray font-medium hover:bg-cream">← Re-parse</button>
                <button onClick={handleApply} className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-sm font-semibold">✅ Apply to Recipe</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// INGREDIENT AUTO-MATCHING
// ═══════════════════════════════════════════════════════════

const UNITS_REGEX = /^\s*[\d½¼¾⅓⅔.,/\s-]+\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|gm?|grams?|kg|ml|l|liters?|litres?|oz|lbs?|inch|pieces?|bunch|bulb|cloves?|stalks?|sprigs?|pinch|handful)\s*/i;

function normalizeForMatch(text) {
  return text.toLowerCase().replace(UNITS_REGEX, '').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
}

function autoMatchIngredients(ingredientGroups, stockIngredients) {
  if (!stockIngredients?.length) return ingredientGroups;

  const stockNorm = stockIngredients.map(s => ({
    id: s.id,
    name: s.name,
    norm: s.name.toLowerCase().trim(),
    unit: s.unit,
    stock_qty: s.stock_qty,
  }));

  return ingredientGroups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.ingredientId) return item; // already linked
      const norm = normalizeForMatch(item.text);
      if (!norm) return item;

      // Try to find best match
      let best = null;
      let bestScore = 0;
      for (const s of stockNorm) {
        // Check if stock name appears in recipe text or vice versa
        const sWords = s.norm.split(' ');
        const nWords = norm.split(' ');

        // Full name match
        if (norm.includes(s.norm) || s.norm.includes(norm)) {
          const score = s.norm.length;
          if (score > bestScore) { best = s; bestScore = score; }
        }
        // Word overlap: count how many stock name words appear in recipe text
        else {
          const overlap = sWords.filter(w => w.length > 2 && nWords.some(nw => nw.includes(w) || w.includes(nw))).length;
          const score = overlap / sWords.length;
          if (score >= 0.5 && overlap > 0 && (overlap > bestScore || (overlap === bestScore && s.norm.length > (best?.norm?.length || 0)))) {
            best = s;
            bestScore = overlap;
          }
        }
      }

      if (best) {
        return { ...item, ingredientId: best.id, linkedName: best.name, linkedUnit: best.unit, linkedStock: best.stock_qty };
      }
      return item;
    }),
  }));
}

// ─── Link Picker (inline search dropdown) ───
function LinkPicker({ stockIngredients, currentId, onLink, onUnlink }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const filtered = stockIngredients.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  if (currentId) {
    return (
      <button onClick={(e) => { e.stopPropagation(); onUnlink(); }}
        className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
        title="Click to unlink">
        🔗 linked
      </button>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
        title="Link to stock ingredient">
        🔗
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-30 w-52 overflow-hidden">
          <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
            placeholder="Search ingredient..."
            className="w-full px-3 py-2 text-xs border-b outline-none" />
          <div className="max-h-40 overflow-y-auto">
            {filtered.map(s => (
              <button key={s.id} onClick={() => { onLink(s.id, s.name, s.unit, s.stock_qty); setOpen(false); setSearch(''); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-cream flex items-center justify-between">
                <span>{s.name}</span>
                <span className="text-gray-400">{s.stock_qty} {s.unit}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No match</p>}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════

function CheckItem({ text, checked, onChange, onTextChange, onDelete, editable }) {
  return (
    <div className="flex items-start gap-3 group py-2">
      <button onClick={onChange}
        className={'mt-0.5 w-5 h-5 rounded-[4px] flex-shrink-0 flex items-center justify-center border-2 transition-all ' +
          (checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 hover:border-blue-400')}>
        {checked && <span className="text-white text-[11px] font-bold">✓</span>}
      </button>
      {editable ? (
        <input value={text} onChange={e => onTextChange(e.target.value)}
          className={'flex-1 text-base bg-transparent outline-none leading-normal ' + (checked ? 'line-through text-gray-400' : 'text-charcoal')} placeholder="Type here..." />
      ) : (
        <span className={'flex-1 text-base leading-normal ' + (checked ? 'line-through text-gray-400' : 'text-charcoal')}>{text}</span>
      )}
      {editable && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>}
    </div>
  );
}

function BulletItem({ text, editable, onChange, onDelete, linked, linkedName, linkedStock, linkedUnit, stockIngredients, dishIngs = [], onUpdateStock, onLink, onUnlink }) {
  const [editingStock, setEditingStock] = useState(false);
  const [tempQty, setTempQty] = useState('');
  const [tempUnit, setTempUnit] = useState('');
  const popRef = useRef(null);
  const UNITS = ['g', 'kg', 'ml', 'l', 'piece', 'tsp', 'tbsp', 'cup', 'pinch', 'bunch', 'bulb', 'clove'];

  const liveStock = linked && stockIngredients ? stockIngredients.find(s => s.id === linked) : null;
  const stockQty = liveStock ? liveStock.stock_qty : 0;
  const stockUnit = liveStock ? liveStock.unit : (linkedUnit || '');
  const dishLink = linked && dishIngs ? dishIngs.find(di => di.ingredient_id === linked) : null;
  const neededQty = dishLink ? dishLink.qty : 0;
  const recipeUnit = dishLink?.recipe_unit || stockUnit; // AI-provided unit or fallback to stock unit
  const sameUnit = recipeUnit === stockUnit || !dishLink?.recipe_unit;
  const remaining = sameUnit ? stockQty - neededQty : null; // only compare if same unit
  const sufficient = sameUnit ? (stockQty >= neededQty && neededQty > 0) : stockQty > 0;
  const runningLow = sameUnit && sufficient && remaining < neededQty;

  useEffect(() => {
    if (!editingStock) return;
    const h = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setEditingStock(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [editingStock]);

  const openStockEdit = () => { setTempQty(String(stockQty)); setTempUnit(stockUnit); setEditingStock(true); };
  const saveStock = () => {
    const val = parseFloat(tempQty);
    if (!isNaN(val) && val >= 0 && onUpdateStock && linked) onUpdateStock(linked, val, tempUnit || stockUnit);
    setEditingStock(false);
  };

  return (
    <div className="flex items-start gap-2.5 group py-1 pl-1">
      <span className="text-gray-400 text-base mt-0.5">•</span>
      {editable ? (
        <>
          <input value={text} onChange={e => onChange(e.target.value)}
            className="flex-1 text-base bg-transparent outline-none leading-normal" placeholder="..." />
          {stockIngredients && (
            <LinkPicker stockIngredients={stockIngredients} currentId={linked} onLink={onLink} onUnlink={onUnlink} />
          )}
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-base text-charcoal leading-normal">{text}</span>
          {linked && (
            <div className="relative shrink-0" ref={popRef}>
              <button onClick={openStockEdit}
                className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ' +
                  (sufficient ? (runningLow ? 'bg-amber-100 text-amber-700 hover:ring-amber-300' : 'bg-emerald-100 text-emerald-700 hover:ring-emerald-300') : 'bg-red-100 text-red-600 hover:ring-red-300')}
                title={`Need ${neededQty} ${recipeUnit} · Have ${stockQty} ${stockUnit} · Tap to update`}>
                {neededQty > 0 && <span className="opacity-60">{neededQty} {recipeUnit}→</span>}
                📦 {stockQty} {stockUnit}
              </button>
              {editingStock && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-30 p-3 w-52">
                  <p className="text-xs font-semibold text-charcoal mb-1.5 truncate">{liveStock?.name || linkedName}</p>
                  <p className="text-[10px] text-warm-gray mb-2">Recipe needs {neededQty} {recipeUnit}</p>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={tempQty} onChange={e => setTempQty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveStock()}
                      autoFocus min="0" step="any"
                      className="flex-1 px-2 py-1.5 rounded-lg border text-sm outline-none focus:border-terracotta w-16" />
                    <select value={tempUnit} onChange={e => setTempUnit(e.target.value)}
                      className="px-1.5 py-1.5 rounded-lg border text-sm outline-none focus:border-terracotta bg-white">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      {!UNITS.includes(tempUnit) && tempUnit && <option value={tempUnit}>{tempUnit}</option>}
                    </select>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => setEditingStock(false)} className="flex-1 text-xs py-1.5 rounded-lg border text-warm-gray">Cancel</button>
                    <button onClick={saveStock} className="flex-1 text-xs py-1.5 rounded-lg bg-terracotta text-white font-medium">Update</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IngredientGroup({ group, editable, onChange, onDelete, stockIngredients, dishIngs = [], onUpdateStock }) {
  const updateItem = (idx, val) => { const items = [...group.items]; items[idx] = { ...items[idx], text: val }; onChange({ ...group, items }); };
  const removeItem = (idx) => onChange({ ...group, items: group.items.filter((_, i) => i !== idx) });
  const addItem = () => onChange({ ...group, items: [...group.items, { id: uid(), text: '' }] });
  const linkItem = (idx, ingId, name, unit, stock) => {
    const items = [...group.items];
    items[idx] = { ...items[idx], ingredientId: ingId, linkedName: name, linkedUnit: unit, linkedStock: stock };
    onChange({ ...group, items });
  };
  const unlinkItem = (idx) => {
    const items = [...group.items];
    items[idx] = { ...items[idx], ingredientId: null, linkedName: null, linkedUnit: null, linkedStock: null };
    onChange({ ...group, items });
  };
  return (
    <Toggle level={2} title={group.name || 'Untitled group'}
      editableTitle={editable} onTitleChange={name => onChange({ ...group, name })}
      rightSlot={editable ? <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs text-gray-400 hover:text-tomato px-1">🗑️</button> : null}>
      <div className="space-y-1">
        {group.items.map((item, i) => (
          <BulletItem key={item.id} text={item.text} editable={editable}
            onChange={val => updateItem(i, val)} onDelete={() => removeItem(i)}
            linked={item.ingredientId} linkedName={item.linkedName} linkedStock={item.linkedStock} linkedUnit={item.linkedUnit}
            stockIngredients={stockIngredients} dishIngs={dishIngs} onUpdateStock={onUpdateStock}
            onLink={(id, name, unit, stock) => linkItem(i, id, name, unit, stock)}
            onUnlink={() => unlinkItem(i)} />
        ))}
        {editable && <button onClick={addItem} className="text-sm text-terracotta/60 hover:text-terracotta pl-6 py-1">+ Add item</button>}
      </div>
    </Toggle>
  );
}

function CookingStep({ step, editable, onChange, onDelete }) {
  const updateItem = (idx, field, val) => { const items = [...step.items]; items[idx] = { ...items[idx], [field]: val }; onChange({ ...step, items }); };
  const removeItem = (idx) => onChange({ ...step, items: step.items.filter((_, i) => i !== idx) });
  const addItem = () => onChange({ ...step, items: [...step.items, { id: uid(), text: '', checked: false }] });
  const updatePrec = (idx, val) => { const p = [...(step.precautions || [])]; p[idx] = { ...p[idx], text: val }; onChange({ ...step, precautions: p }); };
  const removePrec = (idx) => onChange({ ...step, precautions: step.precautions.filter((_, i) => i !== idx) });
  const addPrec = () => onChange({ ...step, precautions: [...(step.precautions || []), { id: uid(), text: '' }] });
  const done = step.items.filter(i => i.checked).length;
  const total = step.items.length;
  return (
    <Toggle level={2} title={step.name || 'Untitled step'}
      editableTitle={editable} onTitleChange={name => onChange({ ...step, name })}
      badge={!editable && total > 0 ? <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + (done === total ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{done}/{total}</span> : null}
      rightSlot={editable ? <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs text-gray-400 hover:text-tomato px-1">🗑️</button> : null}>
      <div className="space-y-0.5">
        {step.items.map((item, i) => (
          <CheckItem key={item.id} text={item.text} checked={item.checked}
            onChange={() => updateItem(i, 'checked', !item.checked)}
            onTextChange={val => updateItem(i, 'text', val)}
            onDelete={() => removeItem(i)} editable={editable} />
        ))}
        {editable && <button onClick={addItem} className="text-sm text-terracotta/60 hover:text-terracotta pl-8 py-1">+ Add step</button>}
      </div>
      {((step.precautions || []).length > 0 || editable) && (
        <div className="mt-3 pt-2 border-t border-dashed">
          <p className="text-sm font-semibold text-amber-600 mb-2">⚠️ Precautions</p>
          <div className="space-y-1 pl-1">
            {(step.precautions || []).map((p, i) => (
              <div key={p.id} className="flex items-start gap-2 group py-0.5">
                <span className="text-amber-500 text-sm mt-0.5">⚡</span>
                {editable ? (
                  <>
                    <input value={p.text} onChange={e => updatePrec(i, e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-amber-700" placeholder="Precaution..." />
                    <button onClick={() => removePrec(i)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>
                  </>
                ) : <span className="text-sm text-amber-700">{p.text}</span>}
              </div>
            ))}
            {editable && <button onClick={addPrec} className="text-sm text-amber-400 hover:text-amber-600 pl-6 py-1">+ Add precaution</button>}
          </div>
        </div>
      )}
    </Toggle>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN RECIPE PAGE
// ═══════════════════════════════════════════════════════════

export default function RecipePage({ dish, ingredients: stockIngredients = [], dishIngs = [], onSave, onLinkIngredients, onUpdateStock, onBack, notify }) {
  const empty = { visibleSections: [...DEFAULT_VISIBLE], overview: '', nutrition: [], ingredientGroups: [], preparation: [], cookingSteps: [], serve: '' };
  const [recipe, setRecipe] = useState(() => {
    const data = dish.recipe_data || empty;
    return { ...empty, ...data, visibleSections: data.visibleSections || [...DEFAULT_VISIBLE] };
  });
  const [editing, setEditing] = useState(!dish.recipe_data);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSectionMgr, setShowSectionMgr] = useState(false);

  const r = recipe;
  const vis = r.visibleSections || DEFAULT_VISIBLE;
  const isVisible = (key) => vis.includes(key);
  const set = (field, val) => setRecipe(prev => ({ ...prev, [field]: val }));

  // Section data mutators
  const updateGroup = (idx, group) => { const g = [...r.ingredientGroups]; g[idx] = group; set('ingredientGroups', g); };
  const removeGroup = (idx) => set('ingredientGroups', r.ingredientGroups.filter((_, i) => i !== idx));
  const addGroup = () => set('ingredientGroups', [...r.ingredientGroups, { id: uid(), name: '', items: [{ id: uid(), text: '' }] }]);
  const updatePrep = (idx, field, val) => { const p = [...r.preparation]; p[idx] = { ...p[idx], [field]: val }; set('preparation', p); };
  const removePrep = (idx) => set('preparation', r.preparation.filter((_, i) => i !== idx));
  const addPrep = () => set('preparation', [...r.preparation, { id: uid(), text: '', checked: false }]);
  const updateStep = (idx, step) => { const s = [...r.cookingSteps]; s[idx] = step; set('cookingSteps', s); };
  const removeStep = (idx) => set('cookingSteps', r.cookingSteps.filter((_, i) => i !== idx));
  const addStep = () => set('cookingSteps', [...r.cookingSteps, { id: uid(), name: '', items: [{ id: uid(), text: '', checked: false }], precautions: [] }]);
  const updateNutrition = (idx, val) => { const n = [...r.nutrition]; n[idx] = { ...n[idx], text: val }; set('nutrition', n); };
  const removeNutrition = (idx) => set('nutrition', r.nutrition.filter((_, i) => i !== idx));
  const addNutrition = () => set('nutrition', [...r.nutrition, { id: uid(), text: '' }]);

  const handleImport = (parsed) => {
    // Extract dish links before cleaning
    const dishLinks = parsed._dishLinks || [];
    delete parsed._dishLinks;

    // Auto-match recipe ingredients to stock (fuzzy match for display)
    const matched = { ...empty, ...parsed, ingredientGroups: autoMatchIngredients(parsed.ingredientGroups || [], stockIngredients) };
    const linkedCount = matched.ingredientGroups.reduce((a, g) => a + g.items.filter(i => i.ingredientId).length, 0);
    const totalCount = matched.ingredientGroups.reduce((a, g) => a + g.items.length, 0);
    setRecipe(matched);
    setEditing(true);

    // Save dish ingredient links if AI provided them (powers availability %, shopping)
    if (dishLinks.length > 0 && onLinkIngredients) {
      onLinkIngredients(dish.id, dishLinks).then(() => {
        notify(`Imported! ${dishLinks.length} ingredients linked to dish stock.`, 'success');
      }).catch(err => {
        notify(`Imported recipe, but linking failed: ${err.message}`);
      });
    } else {
      notify(`Imported! ${linkedCount}/${totalCount} ingredients matched.`, 'success');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(dish.id, recipe); setEditing(false); notify('Recipe saved!', 'success'); }
    catch (err) { notify('Save failed: ' + err.message); }
    setSaving(false);
  };

  const togglePrepCheck = (idx) => {
    updatePrep(idx, 'checked', !r.preparation[idx].checked);
    onSave(dish.id, { ...recipe, preparation: recipe.preparation.map((p, i) => i === idx ? { ...p, checked: !p.checked } : p) }).catch(() => {});
  };
  const toggleStepCheck = (stepIdx, itemIdx) => {
    const steps = [...r.cookingSteps];
    steps[stepIdx] = { ...steps[stepIdx], items: steps[stepIdx].items.map((item, i) => i === itemIdx ? { ...item, checked: !item.checked } : item) };
    set('cookingSteps', steps);
    onSave(dish.id, { ...recipe, cookingSteps: steps }).catch(() => {});
  };

  const prepDone = r.preparation.filter(p => p.checked).length;
  const totalStepItems = r.cookingSteps.reduce((a, s) => a + s.items.length, 0);
  const stepsDone = r.cookingSteps.reduce((a, s) => a + s.items.filter(i => i.checked).length, 0);
  const hasRecipe = r.ingredientGroups.length > 0 || r.preparation.length > 0 || r.cookingSteps.length > 0 || r.serve || r.overview || (r.nutrition || []).length > 0;

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/20"><BackIcon /></button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg truncate">📖 {dish.name}</h1>
            <div className="flex gap-2 text-xs text-warm-gray">
              {dish.country && <span>{dish.country}</span>}
              {dish.dish_type && <span>· {dish.dish_type}</span>}
              {hasRecipe && !editing && <span className="ml-auto text-sage font-medium">{prepDone + stepsDone}/{r.preparation.length + totalStepItems} done</span>}
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setShowImport(true)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-medium">📥</button>
              <div className="relative">
                <button onClick={() => setShowSectionMgr(!showSectionMgr)} className="px-3 py-1.5 rounded-lg border text-sm text-warm-gray hover:bg-cream">⚙️</button>
                {showSectionMgr && <SectionManager visible={vis} onChange={v => set('visibleSections', v)} onClose={() => setShowSectionMgr(false)} />}
              </div>
              <button onClick={() => { setRecipe(dish.recipe_data ? { ...empty, ...dish.recipe_data } : empty); setEditing(false); }} className="px-3 py-1.5 rounded-lg border text-sm text-warm-gray">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium disabled:opacity-50">{saving ? '...' : '💾 Save'}</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative">
                <button onClick={() => setShowSectionMgr(!showSectionMgr)} className="px-3 py-1.5 rounded-lg border text-sm text-warm-gray hover:bg-cream">⚙️</button>
                {showSectionMgr && <SectionManager visible={vis} onChange={async v => { set('visibleSections', v); await onSave(dish.id, { ...recipe, visibleSections: v }).catch(() => {}); }} onClose={() => setShowSectionMgr(false)} />}
              </div>
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium">✏️ Edit</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {editing && !hasRecipe && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 text-center border border-violet-200/50 mb-4">
            <div className="text-4xl mb-3">📥</div>
            <h3 className="font-bold text-base text-charcoal mb-1">Import from Notion</h3>
            <p className="text-sm text-warm-gray mb-4">Paste your recipe text → parsed into sections</p>
            <button onClick={() => setShowImport(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm">📥 Paste & Parse</button>
            <p className="text-xs text-warm-gray mt-3">Or add manually with + buttons. Use ⚙️ to show/hide sections.</p>
          </div>
        )}

        {/* ─── Overview ─── */}
        {isVisible('overview') && (
          <Toggle emoji="🔥" title="Overview">
            {editing ? (
              <textarea value={r.overview || ''} onChange={e => set('overview', e.target.value)} rows={4} placeholder="Dish description, flavor notes, key idea..."
                className="w-full px-3 py-2 rounded-lg border text-base resize-none focus:border-terracotta/50 outline-none leading-relaxed" />
            ) : (
              <p className="text-base text-charcoal pl-1 whitespace-pre-wrap leading-relaxed">{r.overview || <span className="text-gray-400">No overview yet</span>}</p>
            )}
          </Toggle>
        )}

        {/* ─── Nutrition ─── */}
        {isVisible('nutrition') && (
          <Toggle emoji="🍎" title="Nutrition"
            rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addNutrition(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Item</button> : null}>
            {(r.nutrition || []).length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No nutrition info yet</p>}
            <div className="space-y-1">
              {(r.nutrition || []).map((n, i) => (
                <BulletItem key={n.id} text={n.text} editable={editing} onChange={val => updateNutrition(i, val)} onDelete={() => removeNutrition(i)} />
              ))}
            </div>
          </Toggle>
        )}

        {/* ─── Ingredients ─── */}
        {isVisible('ingredients') && (
          <Toggle emoji="🧾" title="Ingredients"
            rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addGroup(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Group</button> : null}>
            {r.ingredientGroups.length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No ingredients yet</p>}
            {r.ingredientGroups.map((g, i) => (
              <IngredientGroup key={g.id} group={g} editable={editing} onChange={u => updateGroup(i, u)} onDelete={() => removeGroup(i)} stockIngredients={stockIngredients} dishIngs={dishIngs} onUpdateStock={onUpdateStock} />
            ))}
          </Toggle>
        )}

        {/* ─── Preparation ─── */}
        {isVisible('preparation') && (
          <Toggle emoji="🥣" title="Preparation"
            badge={!editing && r.preparation.length > 0 ? <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + (prepDone === r.preparation.length ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}>{prepDone}/{r.preparation.length}</span> : null}
            rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addPrep(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Step</button> : null}>
            {r.preparation.length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No prep steps yet</p>}
            <div className="space-y-0.5">
              {r.preparation.map((p, i) => (
                <CheckItem key={p.id} text={p.text} checked={p.checked}
                  onChange={() => editing ? updatePrep(i, 'checked', !p.checked) : togglePrepCheck(i)}
                  onTextChange={val => updatePrep(i, 'text', val)}
                  onDelete={() => removePrep(i)} editable={editing} />
              ))}
            </div>
          </Toggle>
        )}

        {/* ─── Cooking ─── */}
        {isVisible('cooking') && (
          <Toggle emoji="👨‍🍳" title="Step-by-Step Cooking"
            badge={!editing && totalStepItems > 0 ? <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + (stepsDone === totalStepItems ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{stepsDone}/{totalStepItems}</span> : null}
            rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addStep(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Step</button> : null}>
            {r.cookingSteps.length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No cooking steps yet</p>}
            {r.cookingSteps.map((step, i) => (
              <CookingStep key={step.id} step={step} editable={editing} onChange={u => updateStep(i, u)} onDelete={() => removeStep(i)} />
            ))}
          </Toggle>
        )}

        {/* ─── Serve ─── */}
        {isVisible('serve') && (
          <Toggle emoji="🍽️" title="Serve">
            {editing ? (
              <textarea value={r.serve || ''} onChange={e => set('serve', e.target.value)} rows={3} placeholder="How to serve, garnish, sides..."
                className="w-full px-3 py-2 rounded-lg border text-base resize-none focus:border-terracotta/50 outline-none leading-relaxed" />
            ) : (
              <p className="text-base text-charcoal pl-1 whitespace-pre-wrap leading-relaxed">{r.serve || <span className="text-gray-400">No serve instructions yet</span>}</p>
            )}
          </Toggle>
        )}

        {/* Reset */}
        {!editing && (prepDone > 0 || stepsDone > 0) && (
          <button onClick={async () => {
            const reset = { ...recipe, preparation: recipe.preparation.map(p => ({ ...p, checked: false })), cookingSteps: recipe.cookingSteps.map(s => ({ ...s, items: s.items.map(i => ({ ...i, checked: false })) })) };
            setRecipe(reset); await onSave(dish.id, reset); notify('Checkboxes reset', 'success');
          }} className="w-full py-2.5 rounded-xl border text-sm text-warm-gray hover:border-terracotta hover:text-terracotta transition-colors mt-4">
            🔄 Reset all checkboxes
          </button>
        )}
      </main>

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} notify={notify} stockIngredients={stockIngredients} />}
    </div>
  );
}
