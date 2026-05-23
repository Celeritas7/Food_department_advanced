/**
 * CookDialog — Phase E1 cook-with-overrides confirmation dialog.
 *
 * Replaces the immediate-commit Cook tap. Shows every recipe row with
 * an editable qty pre-filled from the recipe, the current stock for
 * context, a "Use all" shortcut, and per-row validation. Confirm calls
 * the override-aware cook handler with whatever the user actually used.
 *
 * Validation gates the Confirm button:
 *   - qty must parse as a positive number
 *   - qty must be ≤ current stock (you cannot overdraw)
 * Bad rows render with a red tint + inline error message.
 */
import { useState, useMemo } from 'react';
import { getIngredientEmoji } from '../../config/emoji.js';

// Build a stable initial row list so "Reset to recipe" can put it back.
function buildInitialRows(recipeIngs, recipeInts, ingredients, intermediates) {
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const intMap = new Map(intermediates.map(i => [i.id, i]));

  const ingRows = (recipeIngs || []).map(di => {
    const ig = ingMap.get(di.ingredient_id);
    return {
      kind: 'ingredient',
      id: di.ingredient_id,
      name: ig?.name || 'Unknown ingredient',
      emoji: ig ? getIngredientEmoji(ig) : '🥕',
      recipeQty: Number(di.qty) || 0,
      unit: di.recipe_unit || ig?.unit || '',
      stock: Number(ig?.stock_qty) || 0,
    };
  });

  const intRows = (recipeInts || []).map(di => {
    const it = intMap.get(di.intermediate_id);
    return {
      kind: 'intermediate',
      id: di.intermediate_id,
      name: it?.name || 'Unknown preparation',
      emoji: '🍲',
      recipeQty: Number(di.qty) || 0,
      unit: it?.unit || 'portions',
      stock: Number(it?.stock_qty) || 0,
    };
  });

  return [...ingRows, ...intRows];
}

// Parse the user's input. Returns NaN on bad input so validation can flag it.
function parseQty(raw) {
  if (raw === '' || raw == null) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export default function CookDialog({ dish, recipeIngs, recipeInts, ingredients, intermediates, onConfirm, onCancel }) {
  const rows = useMemo(
    () => buildInitialRows(recipeIngs, recipeInts, ingredients, intermediates),
    [recipeIngs, recipeInts, ingredients, intermediates]
  );

  // qtys is keyed by `${kind}:${id}` so an ingredient and an intermediate
  // sharing a uuid (won't happen, but safe) can't collide.
  const buildDefaults = () => {
    const o = {};
    for (const r of rows) o[`${r.kind}:${r.id}`] = String(r.recipeQty);
    return o;
  };
  const [qtys, setQtys] = useState(buildDefaults);
  const [submitting, setSubmitting] = useState(false);

  const setRow = (r, value) => setQtys(prev => ({ ...prev, [`${r.kind}:${r.id}`]: value }));
  const reset = () => setQtys(buildDefaults());

  // Compute per-row validation + an overall flag for the Confirm button.
  const validation = useMemo(() => {
    const map = {};
    let anyError = false;
    for (const r of rows) {
      const raw = qtys[`${r.kind}:${r.id}`];
      const q = parseQty(raw);
      let error = null;
      if (Number.isNaN(q)) error = 'Enter a number';
      else if (q <= 0) error = 'Must be > 0';
      else if (q > r.stock) error = 'Exceeds available stock';
      map[`${r.kind}:${r.id}`] = error;
      if (error) anyError = true;
    }
    return { map, anyError };
  }, [rows, qtys]);

  const confirm = async () => {
    if (validation.anyError || submitting) return;
    const ingredientOverrides = [];
    const intermediateOverrides = [];
    for (const r of rows) {
      const q = Number(qtys[`${r.kind}:${r.id}`]);
      if (r.kind === 'ingredient') ingredientOverrides.push({ ingredient_id: r.id, qty: q });
      else intermediateOverrides.push({ intermediate_id: r.id, qty: q });
    }
    setSubmitting(true);
    try {
      await onConfirm(ingredientOverrides, intermediateOverrides);
    } finally {
      setSubmitting(false);
    }
  };

  if (!dish) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg fade max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-base text-charcoal">Cook: {dish.name}</h2>
          <button
            onClick={reset}
            className="text-xs text-warm-gray hover:text-charcoal underline"
            type="button"
          >↺ Reset to recipe</button>
        </div>

        <div className="px-5 py-3 overflow-y-auto flex-1">
          {rows.length === 0 ? (
            <p className="text-sm text-warm-gray text-center py-6">
              This dish has no linked ingredients or preparations.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map(r => {
                const key = `${r.kind}:${r.id}`;
                const raw = qtys[key];
                const err = validation.map[key];
                const overStock = r.recipeQty > r.stock;
                const tint = err
                  ? 'bg-tomato/5 border-tomato/30'
                  : overStock
                    ? 'bg-amber-50 border-amber-300/60'
                    : 'bg-white border-light-gray';
                return (
                  <div key={key} className={`rounded-xl border p-3 ${tint}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{r.emoji}</span>
                      <span className="text-sm font-semibold text-charcoal flex-1 truncate">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        value={raw}
                        onChange={e => setRow(r, e.target.value)}
                        className={`w-24 px-2 py-1.5 rounded-lg border text-sm text-right ${
                          err ? 'border-tomato' : 'border-light-gray'
                        }`}
                        aria-label={`Quantity for ${r.name}`}
                      />
                      <span className="text-sm text-warm-gray">{r.unit}</span>
                      <button
                        type="button"
                        onClick={() => setRow(r, String(r.stock))}
                        className="ml-auto text-[11px] font-semibold text-terracotta hover:underline"
                      >Use all</button>
                    </div>
                    <p className={`text-[11px] mt-1.5 ${overStock ? 'text-amber-700' : 'text-warm-gray'}`}>
                      {overStock
                        ? `Only ${r.stock} ${r.unit} available`
                        : `You have ${r.stock} ${r.unit} in stock`}
                    </p>
                    {err && (
                      <p className="text-[11px] mt-1 text-tomato font-semibold">{err}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={confirm}
            disabled={validation.anyError || submitting || rows.length === 0}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white ${
              validation.anyError || submitting || rows.length === 0
                ? 'bg-light-gray cursor-not-allowed'
                : 'bg-terracotta hover:bg-terracotta/90'
            }`}
          >{submitting ? 'Cooking…' : 'Confirm cook'}</button>
          <button
            type="button"
            onClick={onCancel}
            className="block mx-auto mt-3 text-xs text-warm-gray hover:text-charcoal underline"
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
