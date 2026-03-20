/**
 * RecipePage.jsx — Full recipe view & editor
 * Notion-style collapsible sections:
 *   🧾 Ingredients (grouped, collapsible)
 *   🥣 Preparation (checklist, collapsible)
 *   👨‍🍳 Step-by-Step Cooking (grouped steps + precautions, collapsible)
 *   🍽️ Serve (collapsible)
 *
 * Two import modes:
 *   🧠 AI Import (primary) — Claude API parses any text
 *   📋 Quick Parse (fallback) — offline, parses Notion markdown format
 */
import { useState, useCallback } from 'react';
import { BackIcon } from '../ui/Icons';
import ANTHROPIC_API_KEY from '../../config/anthropic.js';

const uid = () => Math.random().toString(36).slice(2, 9);


// ═══════════════════════════════════════════════════════════
// COLLAPSIBLE TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════

function Toggle({ open: defaultOpen = true, emoji, title, badge, rightSlot, children, level = 1 }) {
  const [open, setOpen] = useState(defaultOpen);
  const isMain = level === 1;
  return (
    <div className={isMain ? 'mb-1' : 'mb-3'}>
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 text-left group py-2 px-1 rounded-lg hover:bg-black/[0.03] transition-colors ${isMain ? '' : 'pl-2'}`}>
        <span className={`transition-transform duration-200 text-warm-gray ${open ? 'rotate-90' : ''}`} style={{ fontSize: isMain ? 14 : 12 }}>▶</span>
        {emoji && <span className={isMain ? 'text-xl' : 'text-base'}>{emoji}</span>}
        <span className={`font-semibold flex-1 ${isMain ? 'text-[15px]' : 'text-sm'}`}>{title}</span>
        {badge}
        {rightSlot}
      </button>
      {open && <div className={isMain ? 'pl-2 mt-1' : 'pl-4 mt-0.5'}>{children}</div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// OFFLINE PARSER — parses Notion copy/paste markdown format
// ═══════════════════════════════════════════════════════════

function offlineParseNotionText(raw) {
  const lines = raw.split('\n');
  const sectionRegexes = {
    ingredients: /^#*\s*(?:🧾|📋)?\s*\**ingredients\**/i,
    preparation: /^#*\s*(?:🥣|🔪)?\s*\**preparation/i,
    cooking: /^#*\s*(?:👨‍🍳|🍳|👩‍🍳)?\s*\**(?:step[- ]by[- ]step|cooking|cook)\**/i,
    serve: /^#*\s*(?:🍽️?|🍽)?\s*\**serve\**/i,
  };
  const sections = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    for (const [key, regex] of Object.entries(sectionRegexes)) {
      if (regex.test(trimmed)) { sections.push({ key, start: i }); return; }
    }
  });
  if (sections.length === 0) {
    const items = lines.filter(l => l.trim()).map(l => ({ text: cleanLine(l) })).filter(i => i.text);
    return { ingredientGroups: items.length ? [{ name: 'All Ingredients', items }] : [], preparation: [], cookingSteps: [], serve: '' };
  }
  const sectionLines = {};
  sections.forEach((sec, idx) => {
    const nextStart = idx < sections.length - 1 ? sections[idx + 1].start : lines.length;
    sectionLines[sec.key] = lines.slice(sec.start + 1, nextStart);
  });
  return {
    ingredientGroups: parseIngredients(sectionLines.ingredients || []),
    preparation: parseChecklist(sectionLines.preparation || []),
    cookingSteps: parseCookingSteps(sectionLines.cooking || []),
    serve: parseServe(sectionLines.serve || []),
  };
}

function cleanLine(line) {
  return line.replace(/^\s*[-•*]\s*/, '').replace(/^\[[ x]\]\s*/, '').replace(/^#+\s*/, '').replace(/^⚠️?\s*/, '').replace(/\*\*/g, '').trim();
}
function isBullet(line) { return /^\s*[-•*]\s/.test(line); }
function isCheckbox(line) { return /^\s*[-•*]\s*\[[ x]\]/.test(line) || /^\s*\[[ x]\]/.test(line); }
function isHeading(line) { return /^\s*#{2,}\s/.test(line); }

function parseIngredients(lines) {
  const groups = []; let cur = null;
  for (const line of lines) {
    const t = line.trim(); if (!t) continue;
    if (isHeading(line) || (!isBullet(line) && !isCheckbox(line) && t.length < 80)) {
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
// AI IMPORT: System prompt for Claude
// ═══════════════════════════════════════════════════════════

const AI_SYSTEM_PROMPT = `You are a recipe parser. You receive raw text copied from a Notion recipe page and must convert it into a structured JSON object. Return ONLY valid JSON, no markdown, no backticks, no explanation.

The JSON must have this exact structure:
{
  "ingredientGroups": [
    { "name": "Group Name", "items": [{ "text": "2 cups basmati rice" }] }
  ],
  "preparation": [
    { "text": "Wash rice gently" }
  ],
  "cookingSteps": [
    {
      "name": "Step 1: Make Yakhni",
      "items": [{ "text": "Add 4 cups water" }],
      "precautions": [{ "text": "Don't over-boil" }]
    }
  ],
  "serve": "Serve hot with raita."
}

Rules:
- Split ingredients into sub-groups if obvious (Rice, Spices, etc.), otherwise use "All Ingredients".
- preparation = individual prep tasks before cooking.
- Each cookingStep = a named stage with action items and optional precautions.
- serve = plain text string for plating/garnish.
- Empty sections = empty array [] or "".
- Parse faithfully — do not add or omit anything.
- Precautions are marked by ⚠️ or "Precautions" or warning-type phrases.`;


// ═══════════════════════════════════════════════════════════
// IMPORT MODAL
// ═══════════════════════════════════════════════════════════

function ImportModal({ onImport, onClose, notify }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseMethod, setParseMethod] = useState(null);
  const [apiError, setApiError] = useState(null);
  const apiKey = ANTHROPIC_API_KEY;
  const hasKey = apiKey && apiKey !== 'YOUR_ANTHROPIC_API_KEY';

  const handleAIParse = async () => {
    if (!text.trim()) return notify('Paste your Notion recipe text first');
    setApiError(null);
    if (!hasKey) { setApiError({ type: 'no_key', message: 'API key not configured', detail: 'Add your Anthropic API key in src/config/anthropic.js or as a GitHub secret.' }); return; }
    setParsing(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: 'Parse this Notion recipe into the JSON structure:\n\n' + text }] }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const status = response.status; const msg = err.error?.message || '';
        if (status === 401) setApiError({ type: 'auth', message: 'Invalid API key', detail: 'Check your key at console.anthropic.com.' });
        else if (status === 429 || status === 529) setApiError({ type: 'rate_limit', message: 'Rate limited', detail: 'Wait a minute and try again.' });
        else if (status === 403 || msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('billing')) setApiError({ type: 'credits', message: 'No API credits', detail: 'Add credits at console.anthropic.com/settings/billing.' });
        else setApiError({ type: 'api', message: 'API error (' + status + ')', detail: msg || 'Try again.' });
        setParsing(false); return;
      }
      const data = await response.json();
      const raw = data.content?.map(c => c.text || '').join('') || '';
      const parsed = JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
      if (!parsed.ingredientGroups && !parsed.preparation && !parsed.cookingSteps) throw new Error('Missing sections');
      setPreview(parsed); setParseMethod('ai'); notify('AI parsed successfully!', 'success');
    } catch (err) {
      if (err instanceof SyntaxError) setApiError({ type: 'parse', message: 'AI returned bad format', detail: 'Try Quick Parse instead.' });
      else if (!apiError) setApiError({ type: 'generic', message: 'Parse failed', detail: err.message });
    }
    setParsing(false);
  };

  const handleOfflineParse = () => {
    if (!text.trim()) return notify('Paste your Notion recipe text first');
    setApiError(null);
    try { const parsed = offlineParseNotionText(text); setPreview(parsed); setParseMethod('offline'); notify('Quick parse done!', 'success'); }
    catch (err) { notify('Parse failed: ' + err.message); }
  };

  const handleApply = () => {
    if (!preview) return;
    const withIds = {
      ingredientGroups: (preview.ingredientGroups || []).map(g => ({ id: uid(), name: g.name || '', items: (g.items || []).map(it => ({ id: uid(), text: it.text || '' })) })),
      preparation: (preview.preparation || []).map(p => ({ id: uid(), text: p.text || '', checked: false })),
      cookingSteps: (preview.cookingSteps || []).map(s => ({ id: uid(), name: s.name || '', items: (s.items || []).map(it => ({ id: uid(), text: it.text || '', checked: false })), precautions: (s.precautions || []).map(p => ({ id: uid(), text: p.text || '' })) })),
      serve: preview.serve || '',
    };
    onImport(withIds); onClose();
  };

  const ps = preview ? {
    groups: preview.ingredientGroups?.length || 0, items: (preview.ingredientGroups || []).reduce((a, g) => a + (g.items?.length || 0), 0),
    prep: preview.preparation?.length || 0, steps: preview.cookingSteps?.length || 0,
    stepItems: (preview.cookingSteps || []).reduce((a, s) => a + (s.items?.length || 0), 0),
    precautions: (preview.cookingSteps || []).reduce((a, s) => a + (s.precautions?.length || 0), 0), hasServe: !!preview.serve,
  } : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div><h2 className="font-bold text-base">📥 Recipe Import</h2><p className="text-xs text-warm-gray mt-0.5">Paste Notion recipe → parse into all 4 sections</p></div>
          <button onClick={onClose} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/20 text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">How to copy from Notion:</p>
            <p>1. Open recipe in Notion → Select all (Ctrl+A) → Copy (Ctrl+C)</p>
            <p>2. Paste below and choose a parse method</p>
          </div>
          <textarea value={text} onChange={e => { setText(e.target.value); setPreview(null); setApiError(null); setParseMethod(null); }}
            rows={12} placeholder={'Paste your recipe here...'}
            className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:border-terracotta/50 outline-none font-mono leading-relaxed" />
          {apiError && (
            <div className={'rounded-xl p-4 text-sm ' + (apiError.type === 'credits' ? 'bg-orange-50 border border-orange-200' : apiError.type === 'no_key' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200')}>
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{apiError.type === 'no_key' ? '🔑' : apiError.type === 'credits' ? '💳' : apiError.type === 'rate_limit' ? '⏳' : '⚠️'}</span>
                <div className="flex-1"><p className="font-semibold text-sm">{apiError.message}</p><p className="text-xs mt-1">{apiError.detail}</p>
                  <p className="text-xs mt-2 text-emerald-700 font-medium">👇 Use Quick Parse below — free & instant!</p></div>
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
                  <span>🧾 {ps.groups} group{ps.groups !== 1 ? 's' : ''} ({ps.items} items)</span><span>🥣 {ps.prep} prep steps</span>
                  <span>👨‍🍳 {ps.steps} stages ({ps.stepItems} actions)</span><span>⚠️ {ps.precautions} precautions</span>
                </div>
              </div>
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
// UI COMPONENTS — Notion-style with collapsible toggles
// ═══════════════════════════════════════════════════════════

function CheckItem({ text, checked, onChange, onTextChange, onDelete, editable }) {
  return (
    <div className="flex items-start gap-2.5 group py-1.5">
      <button onClick={onChange}
        className={'mt-0.5 w-[18px] h-[18px] rounded-[4px] flex-shrink-0 flex items-center justify-center border transition-all ' +
          (checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 hover:border-blue-400')}>
        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
      </button>
      {editable ? (
        <input value={text} onChange={e => onTextChange(e.target.value)}
          className={'flex-1 text-[14px] bg-transparent outline-none py-0 leading-snug ' + (checked ? 'line-through text-gray-400' : 'text-charcoal')}
          placeholder="Type here..." />
      ) : (
        <span className={'flex-1 text-[14px] leading-snug ' + (checked ? 'line-through text-gray-400' : 'text-charcoal')}>{text}</span>
      )}
      {editable && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>}
    </div>
  );
}

function IngredientGroup({ group, editable, onChange, onDelete }) {
  const updateItem = (idx, field, val) => { const items = [...group.items]; items[idx] = { ...items[idx], [field]: val }; onChange({ ...group, items }); };
  const removeItem = (idx) => onChange({ ...group, items: group.items.filter((_, i) => i !== idx) });
  const addItem = () => onChange({ ...group, items: [...group.items, { id: uid(), text: '' }] });
  return (
    <Toggle level={2} title={group.name || 'Untitled group'} emoji=""
      rightSlot={editable ? <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs text-gray-400 hover:text-tomato px-1">🗑️</button> : null}>
      {editable && (
        <input value={group.name} onChange={e => onChange({ ...group, name: e.target.value })}
          className="text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-terracotta outline-none mb-2 w-full font-medium" placeholder="Group name..." />
      )}
      <div className="space-y-0.5">
        {group.items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-2 group py-0.5 pl-1">
            <span className="text-gray-400 text-sm mt-0.5">•</span>
            {editable ? (
              <>
                <input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)}
                  className="flex-1 text-[14px] bg-transparent outline-none leading-snug" placeholder="e.g., 2 cups basmati rice" />
                <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>
              </>
            ) : <span className="text-[14px] text-charcoal leading-snug">{item.text}</span>}
          </div>
        ))}
        {editable && <button onClick={addItem} className="text-xs text-terracotta/60 hover:text-terracotta pl-5 py-1">+ Add item</button>}
      </div>
    </Toggle>
  );
}

function CookingStep({ step, editable, onChange, onDelete }) {
  const updateItem = (idx, field, val) => { const items = [...step.items]; items[idx] = { ...items[idx], [field]: val }; onChange({ ...step, items }); };
  const removeItem = (idx) => onChange({ ...step, items: step.items.filter((_, i) => i !== idx) });
  const addItem = () => onChange({ ...step, items: [...step.items, { id: uid(), text: '', checked: false }] });
  const updatePrec = (idx, field, val) => { const p = [...(step.precautions || [])]; p[idx] = { ...p[idx], [field]: val }; onChange({ ...step, precautions: p }); };
  const removePrec = (idx) => onChange({ ...step, precautions: step.precautions.filter((_, i) => i !== idx) });
  const addPrec = () => onChange({ ...step, precautions: [...(step.precautions || []), { id: uid(), text: '' }] });

  const done = step.items.filter(i => i.checked).length;
  const total = step.items.length;

  return (
    <Toggle level={2} title={step.name || 'Untitled step'} emoji=""
      badge={!editable && total > 0 ? (
        <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (done === total ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{done}/{total}</span>
      ) : null}
      rightSlot={editable ? <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs text-gray-400 hover:text-tomato px-1">🗑️</button> : null}>
      {editable && (
        <input value={step.name} onChange={e => onChange({ ...step, name: e.target.value })}
          className="text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-terracotta outline-none mb-2 w-full font-medium" placeholder="Step name..." />
      )}
      <div className="space-y-0.5">
        {step.items.map((item, i) => (
          <CheckItem key={item.id} text={item.text} checked={item.checked}
            onChange={() => updateItem(i, 'checked', !item.checked)}
            onTextChange={val => updateItem(i, 'text', val)}
            onDelete={() => removeItem(i)} editable={editable} />
        ))}
        {editable && <button onClick={addItem} className="text-xs text-terracotta/60 hover:text-terracotta pl-7 py-1">+ Add step</button>}
      </div>
      {((step.precautions || []).length > 0 || editable) && (
        <div className="mt-3 pt-2 border-t border-dashed">
          <p className="text-xs font-semibold text-amber-600 mb-1.5">⚠️ Precautions</p>
          <div className="space-y-0.5 pl-1">
            {(step.precautions || []).map((p, i) => (
              <div key={p.id} className="flex items-start gap-2 group py-0.5">
                <span className="text-amber-500 text-xs mt-1">⚡</span>
                {editable ? (
                  <>
                    <input value={p.text} onChange={e => updatePrec(i, 'text', e.target.value)}
                      className="flex-1 text-xs bg-transparent outline-none text-amber-700" placeholder="Precaution..." />
                    <button onClick={() => removePrec(i)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-tomato text-xs p-1">✕</button>
                  </>
                ) : <span className="text-xs text-amber-700">{p.text}</span>}
              </div>
            ))}
            {editable && <button onClick={addPrec} className="text-xs text-amber-400 hover:text-amber-600 pl-5 py-1">+ Add precaution</button>}
          </div>
        </div>
      )}
    </Toggle>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN RECIPE PAGE
// ═══════════════════════════════════════════════════════════

export default function RecipePage({ dish, onSave, onBack, notify }) {
  const empty = { ingredientGroups: [], preparation: [], cookingSteps: [], serve: '' };
  const [recipe, setRecipe] = useState(dish.recipe_data || empty);
  const [editing, setEditing] = useState(!dish.recipe_data);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const r = recipe;
  const set = (field, val) => setRecipe(prev => ({ ...prev, [field]: val }));

  const updateGroup = (idx, group) => { const g = [...r.ingredientGroups]; g[idx] = group; set('ingredientGroups', g); };
  const removeGroup = (idx) => set('ingredientGroups', r.ingredientGroups.filter((_, i) => i !== idx));
  const addGroup = () => set('ingredientGroups', [...r.ingredientGroups, { id: uid(), name: '', items: [{ id: uid(), text: '' }] }]);
  const updatePrep = (idx, field, val) => { const p = [...r.preparation]; p[idx] = { ...p[idx], [field]: val }; set('preparation', p); };
  const removePrep = (idx) => set('preparation', r.preparation.filter((_, i) => i !== idx));
  const addPrep = () => set('preparation', [...r.preparation, { id: uid(), text: '', checked: false }]);
  const updateStep = (idx, step) => { const s = [...r.cookingSteps]; s[idx] = step; set('cookingSteps', s); };
  const removeStep = (idx) => set('cookingSteps', r.cookingSteps.filter((_, i) => i !== idx));
  const addStep = () => set('cookingSteps', [...r.cookingSteps, { id: uid(), name: '', items: [{ id: uid(), text: '', checked: false }], precautions: [] }]);

  const handleImport = (parsed) => { setRecipe(parsed); setEditing(true); notify('Recipe imported! Review and Save.', 'success'); };

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
  const hasRecipe = r.ingredientGroups.length > 0 || r.preparation.length > 0 || r.cookingSteps.length > 0 || r.serve;

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
              <button onClick={() => { setRecipe(dish.recipe_data || empty); setEditing(false); }} className="px-3 py-1.5 rounded-lg border text-sm text-warm-gray">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium disabled:opacity-50">{saving ? '...' : '💾 Save'}</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium">✏️ Edit</button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {editing && !hasRecipe && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 text-center border border-violet-200/50 mb-4">
            <div className="text-4xl mb-3">📥</div>
            <h3 className="font-bold text-base text-charcoal mb-1">Import from Notion</h3>
            <p className="text-sm text-warm-gray mb-4">Paste your recipe and it'll be parsed into all 4 sections</p>
            <button onClick={() => setShowImport(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm">📥 Paste & Parse</button>
            <p className="text-xs text-warm-gray mt-3">Or add manually with + buttons</p>
          </div>
        )}

        {/* ─── Section 1: Ingredients ─── */}
        <Toggle emoji="🧾" title="Ingredients"
          rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addGroup(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Group</button> : null}>
          {r.ingredientGroups.length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No ingredients added yet</p>}
          {r.ingredientGroups.map((g, i) => (
            <IngredientGroup key={g.id} group={g} editable={editing} onChange={u => updateGroup(i, u)} onDelete={() => removeGroup(i)} />
          ))}
        </Toggle>

        {/* ─── Section 2: Preparation ─── */}
        <Toggle emoji="🥣" title="Preparation"
          badge={!editing && r.preparation.length > 0 ? (
            <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (prepDone === r.preparation.length ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}>{prepDone}/{r.preparation.length}</span>
          ) : null}
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

        {/* ─── Section 3: Step-by-Step Cooking ─── */}
        <Toggle emoji="👨‍🍳" title="Step-by-Step Cooking"
          badge={!editing && totalStepItems > 0 ? (
            <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (stepsDone === totalStepItems ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{stepsDone}/{totalStepItems}</span>
          ) : null}
          rightSlot={editing ? <button onClick={(e) => { e.stopPropagation(); addStep(); }} className="text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Step</button> : null}>
          {r.cookingSteps.length === 0 && !editing && <p className="text-sm text-gray-400 pl-4">No cooking steps yet</p>}
          {r.cookingSteps.map((step, i) => (
            <CookingStep key={step.id} step={step} editable={editing} onChange={u => updateStep(i, u)} onDelete={() => removeStep(i)} />
          ))}
        </Toggle>

        {/* ─── Section 4: Serve ─── */}
        <Toggle emoji="🍽️" title="Serve">
          {editing ? (
            <textarea value={r.serve || ''} onChange={e => set('serve', e.target.value)} rows={3} placeholder="How to serve, garnish, sides..."
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:border-terracotta/50 outline-none" />
          ) : (
            <p className="text-[14px] text-charcoal pl-1 whitespace-pre-wrap leading-relaxed">{r.serve || <span className="text-gray-400">No serve instructions yet</span>}</p>
          )}
        </Toggle>

        {/* ─── Reset Checkboxes ─── */}
        {!editing && (prepDone > 0 || stepsDone > 0) && (
          <button onClick={async () => {
            const reset = { ...recipe, preparation: recipe.preparation.map(p => ({ ...p, checked: false })), cookingSteps: recipe.cookingSteps.map(s => ({ ...s, items: s.items.map(i => ({ ...i, checked: false })) })) };
            setRecipe(reset); await onSave(dish.id, reset); notify('Checkboxes reset', 'success');
          }} className="w-full py-2.5 rounded-xl border text-sm text-warm-gray hover:border-terracotta hover:text-terracotta transition-colors mt-4">
            🔄 Reset all checkboxes
          </button>
        )}
      </main>

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} notify={notify} />}
    </div>
  );
}
