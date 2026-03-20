/**
 * RecipePage.jsx — Full recipe view & editor
 * 4 Notion-style sections:
 *   🧾 Ingredients (grouped)
 *   🥣 Preparation (checklist)
 *   👨‍🍳 Step-by-Step Cooking (grouped steps + precautions)
 *   🍽️ Serve
 */
import { useState, useCallback } from 'react';
import { BackIcon } from '../ui/Icons';

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Checkbox Item ───
function CheckItem({ text, checked, onChange, onTextChange, onDelete, editable }) {
  return (
    <div className="flex items-start gap-2.5 group py-1">
      <button onClick={onChange}
        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
          checked ? 'bg-terracotta border-terracotta' : 'bg-white border-gray-300 hover:border-terracotta'
        }`}>
        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
      </button>
      {editable ? (
        <input value={text} onChange={e => onTextChange(e.target.value)}
          className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-terracotta/30 outline-none py-0.5 ${checked ? 'line-through text-warm-gray' : 'text-charcoal'}`} />
      ) : (
        <span className={`flex-1 text-sm ${checked ? 'line-through text-warm-gray' : 'text-charcoal'}`}>{text}</span>
      )}
      {editable && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-tomato text-xs p-1">✕</button>
      )}
    </div>
  );
}

// ─── Ingredient Group ───
function IngredientGroup({ group, editable, onChange, onDelete }) {
  const updateItem = (idx, field, val) => {
    const items = [...group.items];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...group, items });
  };
  const removeItem = (idx) => {
    onChange({ ...group, items: group.items.filter((_, i) => i !== idx) });
  };
  const addItem = () => {
    onChange({ ...group, items: [...group.items, { id: uid(), text: '' }] });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-charcoal tracking-wide">▾</span>
        {editable ? (
          <input value={group.name} onChange={e => onChange({ ...group, name: e.target.value })}
            className="font-semibold text-sm bg-transparent border-b border-transparent focus:border-terracotta/30 outline-none flex-1" placeholder="Group name..." />
        ) : (
          <h4 className="font-semibold text-sm">{group.name}</h4>
        )}
        {editable && (
          <button onClick={onDelete} className="text-xs text-warm-gray hover:text-tomato px-1">🗑️</button>
        )}
      </div>
      <div className="pl-4 space-y-0.5">
        {group.items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-2 group py-0.5">
            <span className="text-warm-gray text-sm mt-0.5">•</span>
            {editable ? (
              <>
                <input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)}
                  className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-terracotta/30 outline-none" placeholder="e.g., 2 cups basmati rice" />
                <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-tomato text-xs p-1">✕</button>
              </>
            ) : (
              <span className="text-sm text-charcoal">{item.text}</span>
            )}
          </div>
        ))}
        {editable && (
          <button onClick={addItem} className="text-xs text-terracotta/70 hover:text-terracotta pl-4 py-1">+ Add item</button>
        )}
      </div>
    </div>
  );
}

// ─── Cooking Step Group ───
function CookingStep({ step, editable, onChange, onDelete }) {
  const updateItem = (idx, field, val) => {
    const items = [...step.items];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...step, items });
  };
  const removeItem = (idx) => {
    onChange({ ...step, items: step.items.filter((_, i) => i !== idx) });
  };
  const addItem = () => {
    onChange({ ...step, items: [...step.items, { id: uid(), text: '', checked: false }] });
  };
  const updatePrecaution = (idx, field, val) => {
    const prec = [...(step.precautions || [])];
    prec[idx] = { ...prec[idx], [field]: val };
    onChange({ ...step, precautions: prec });
  };
  const removePrecaution = (idx) => {
    onChange({ ...step, precautions: step.precautions.filter((_, i) => i !== idx) });
  };
  const addPrecaution = () => {
    onChange({ ...step, precautions: [...(step.precautions || []), { id: uid(), text: '' }] });
  };

  const completedCount = step.items.filter(i => i.checked).length;
  const progress = step.items.length > 0 ? Math.round((completedCount / step.items.length) * 100) : 0;

  return (
    <div className="mb-5 bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-charcoal">▾</span>
        {editable ? (
          <input value={step.name} onChange={e => onChange({ ...step, name: e.target.value })}
            className="font-semibold text-sm bg-transparent border-b border-transparent focus:border-terracotta/30 outline-none flex-1" placeholder="Step name..." />
        ) : (
          <h4 className="font-semibold text-sm flex-1">{step.name}</h4>
        )}
        {!editable && step.items.length > 0 && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            progress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>{completedCount}/{step.items.length}</span>
        )}
        {editable && (
          <button onClick={onDelete} className="text-xs text-warm-gray hover:text-tomato px-1">🗑️</button>
        )}
      </div>

      <div className="pl-2 space-y-0.5">
        {step.items.map((item, i) => (
          <CheckItem key={item.id}
            text={item.text} checked={item.checked}
            onChange={() => updateItem(i, 'checked', !item.checked)}
            onTextChange={(val) => updateItem(i, 'text', val)}
            onDelete={() => removeItem(i)}
            editable={editable} />
        ))}
        {editable && (
          <button onClick={addItem} className="text-xs text-terracotta/70 hover:text-terracotta pl-7 py-1">+ Add step</button>
        )}
      </div>

      {/* Precautions */}
      {((step.precautions || []).length > 0 || editable) && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-semibold text-amber-600 mb-1.5">⚠️ Precautions</p>
          <div className="pl-2 space-y-0.5">
            {(step.precautions || []).map((p, i) => (
              <div key={p.id} className="flex items-start gap-2 group py-0.5">
                <span className="text-amber-500 text-sm mt-0.5">⚡</span>
                {editable ? (
                  <>
                    <input value={p.text} onChange={e => updatePrecaution(i, 'text', e.target.value)}
                      className="flex-1 text-xs bg-transparent border-b border-transparent focus:border-amber-300 outline-none text-amber-700" />
                    <button onClick={() => removePrecaution(i)} className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-tomato text-xs p-1">✕</button>
                  </>
                ) : (
                  <span className="text-xs text-amber-700">{p.text}</span>
                )}
              </div>
            ))}
            {editable && (
              <button onClick={addPrecaution} className="text-xs text-amber-500/70 hover:text-amber-600 pl-5 py-1">+ Add precaution</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Recipe Page ───
export default function RecipePage({ dish, onSave, onBack, notify }) {
  const empty = {
    ingredientGroups: [],
    preparation: [],
    cookingSteps: [],
    serve: '',
  };
  const [recipe, setRecipe] = useState(dish.recipe_data || empty);
  const [editing, setEditing] = useState(!dish.recipe_data);
  const [saving, setSaving] = useState(false);

  const r = recipe;
  const set = (field, val) => setRecipe(prev => ({ ...prev, [field]: val }));

  // ─── Ingredient Groups ───
  const updateGroup = (idx, group) => {
    const g = [...r.ingredientGroups]; g[idx] = group; set('ingredientGroups', g);
  };
  const removeGroup = (idx) => set('ingredientGroups', r.ingredientGroups.filter((_, i) => i !== idx));
  const addGroup = () => set('ingredientGroups', [...r.ingredientGroups, { id: uid(), name: '', items: [{ id: uid(), text: '' }] }]);

  // ─── Preparation ───
  const updatePrep = (idx, field, val) => {
    const p = [...r.preparation]; p[idx] = { ...p[idx], [field]: val }; set('preparation', p);
  };
  const removePrep = (idx) => set('preparation', r.preparation.filter((_, i) => i !== idx));
  const addPrep = () => set('preparation', [...r.preparation, { id: uid(), text: '', checked: false }]);

  // ─── Cooking Steps ───
  const updateStep = (idx, step) => { const s = [...r.cookingSteps]; s[idx] = step; set('cookingSteps', s); };
  const removeStep = (idx) => set('cookingSteps', r.cookingSteps.filter((_, i) => i !== idx));
  const addStep = () => set('cookingSteps', [...r.cookingSteps, { id: uid(), name: '', items: [{ id: uid(), text: '', checked: false }], precautions: [] }]);

  // ─── Save ───
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(dish.id, recipe);
      setEditing(false);
      notify('Recipe saved!', 'success');
    } catch (err) {
      notify('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  // Toggle checkbox (works in view mode for live cooking)
  const togglePrepCheck = (idx) => {
    updatePrep(idx, 'checked', !r.preparation[idx].checked);
    // Auto-save checkbox state
    onSave(dish.id, { ...recipe, preparation: recipe.preparation.map((p, i) => i === idx ? { ...p, checked: !p.checked } : p) }).catch(() => {});
  };
  const toggleStepCheck = (stepIdx, itemIdx) => {
    const steps = [...r.cookingSteps];
    steps[stepIdx] = { ...steps[stepIdx], items: steps[stepIdx].items.map((item, i) => i === itemIdx ? { ...item, checked: !item.checked } : item) };
    set('cookingSteps', steps);
    onSave(dish.id, { ...recipe, cookingSteps: steps }).catch(() => {});
  };

  // Progress
  const prepDone = r.preparation.filter(p => p.checked).length;
  const totalStepItems = r.cookingSteps.reduce((a, s) => a + s.items.length, 0);
  const stepsDone = r.cookingSteps.reduce((a, s) => a + s.items.filter(i => i.checked).length, 0);
  const hasRecipe = r.ingredientGroups.length > 0 || r.preparation.length > 0 || r.cookingSteps.length > 0 || r.serve;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/20"><BackIcon /></button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg truncate">📖 {dish.name}</h1>
            <div className="flex gap-2 text-xs text-warm-gray">
              {dish.country && <span>{dish.country}</span>}
              {dish.dish_type && <span>· {dish.dish_type}</span>}
              {hasRecipe && !editing && (
                <span className="ml-auto text-sage font-medium">
                  {prepDone + stepsDone}/{r.preparation.length + totalStepItems} done
                </span>
              )}
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setRecipe(dish.recipe_data || empty); setEditing(false); }}
                className="px-3 py-1.5 rounded-lg border text-sm text-warm-gray">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-sm font-medium">✏️ Edit</button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">

        {/* ─── Section 1: Ingredients ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧾</span>
            <h2 className="font-bold text-base">Ingredients</h2>
            {editing && (
              <button onClick={addGroup} className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Group</button>
            )}
          </div>
          {r.ingredientGroups.length === 0 && !editing && (
            <p className="text-sm text-warm-gray pl-8">No ingredients added yet</p>
          )}
          {r.ingredientGroups.map((g, i) => (
            <IngredientGroup key={g.id} group={g} editable={editing}
              onChange={(updated) => updateGroup(i, updated)}
              onDelete={() => removeGroup(i)} />
          ))}
        </section>

        <hr className="border-light-gray" />

        {/* ─── Section 2: Preparation ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🥣</span>
            <h2 className="font-bold text-base">Preparation</h2>
            {!editing && r.preparation.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${
                prepDone === r.preparation.length ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>{prepDone}/{r.preparation.length}</span>
            )}
            {editing && (
              <button onClick={addPrep} className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Step</button>
            )}
          </div>
          {r.preparation.length === 0 && !editing && (
            <p className="text-sm text-warm-gray pl-8">No prep steps added yet</p>
          )}
          <div className="pl-2 space-y-0.5">
            {r.preparation.map((p, i) => (
              <CheckItem key={p.id}
                text={p.text} checked={p.checked}
                onChange={() => editing ? updatePrep(i, 'checked', !p.checked) : togglePrepCheck(i)}
                onTextChange={(val) => updatePrep(i, 'text', val)}
                onDelete={() => removePrep(i)}
                editable={editing} />
            ))}
          </div>
        </section>

        <hr className="border-light-gray" />

        {/* ─── Section 3: Step-by-Step Cooking ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">👨‍🍳</span>
            <h2 className="font-bold text-base">Step-by-Step Cooking</h2>
            {!editing && totalStepItems > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${
                stepsDone === totalStepItems ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>{stepsDone}/{totalStepItems}</span>
            )}
            {editing && (
              <button onClick={addStep} className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-terracotta/10 text-terracotta font-medium">+ Step</button>
            )}
          </div>
          {r.cookingSteps.length === 0 && !editing && (
            <p className="text-sm text-warm-gray pl-8">No cooking steps added yet</p>
          )}
          {r.cookingSteps.map((step, i) => (
            <CookingStep key={step.id} step={step} editable={editing}
              onChange={(updated) => updateStep(i, updated)}
              onDelete={() => removeStep(i)} />
          ))}
        </section>

        <hr className="border-light-gray" />

        {/* ─── Section 4: Serve ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🍽️</span>
            <h2 className="font-bold text-base">Serve</h2>
          </div>
          {editing ? (
            <textarea value={r.serve || ''} onChange={e => set('serve', e.target.value)}
              rows={3} placeholder="How to serve, garnish, sides..."
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:border-terracotta/50 outline-none" />
          ) : (
            <p className="text-sm text-charcoal pl-8 whitespace-pre-wrap">
              {r.serve || <span className="text-warm-gray">No serve instructions yet</span>}
            </p>
          )}
        </section>

        {/* ─── Reset Checkboxes ─── */}
        {!editing && (prepDone > 0 || stepsDone > 0) && (
          <button onClick={async () => {
            const reset = {
              ...recipe,
              preparation: recipe.preparation.map(p => ({ ...p, checked: false })),
              cookingSteps: recipe.cookingSteps.map(s => ({ ...s, items: s.items.map(i => ({ ...i, checked: false })) })),
            };
            setRecipe(reset);
            await onSave(dish.id, reset);
            notify('Checkboxes reset', 'success');
          }} className="w-full py-2.5 rounded-xl border text-sm text-warm-gray hover:border-terracotta hover:text-terracotta transition-colors">
            🔄 Reset all checkboxes
          </button>
        )}
      </main>
    </div>
  );
}
