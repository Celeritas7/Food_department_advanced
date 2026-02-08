/**
 * DishForm.jsx — Dish creation/edit with category-tabbed ingredient picker
 */
import { useState } from 'react';
import { DelIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';
import IngredientPicker from '../ui/IngredientPicker';

export default function DishForm({ initial, ingredients, intermediates, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [country, setCountry] = useState(initial?.country || '');
  const [type, setType] = useState(initial?.dish_type || '');
  const [recipeIngs, setRecipeIngs] = useState(initial?.recipeIngredients || []);
  const [recipeInts, setRecipeInts] = useState(initial?.recipeIntermediates || []);
  const [showIngPicker, setShowIngPicker] = useState(false);

  const addInt = () => {
    const unused = intermediates.filter(i => !recipeInts.some(x => x.intermediateId === i.id));
    if (unused.length) setRecipeInts([...recipeInts, { intermediateId: unused[0].id, qty: 1 }]);
  };

  const handlePickerConfirm = (items) => {
    setRecipeIngs(items.map(it => ({ ingredientId: it.id, qty: it.qty })));
    setShowIngPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), priority, country, type, recipeIngredients: recipeIngs, recipeIntermediates: recipeInts });
  };

  // Build initial selected for picker from current recipeIngs
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

        {/* Ingredients via picker */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">🥕 Ingredients ({recipeIngs.length})</span>
            <button type="button" onClick={() => setShowIngPicker(true)} className="text-sm font-medium text-white bg-terracotta px-3 py-1.5 rounded-lg">
              {recipeIngs.length > 0 ? '✏️ Edit' : '🥘 Pick'}
            </button>
          </div>
          {!recipeIngs.length ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl text-warm-gray">
              <p className="text-2xl mb-1">🥘</p>
              <p className="text-sm">Tap "Pick" to browse by category</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recipeIngs.map((x, i) => {
                const ig = ingredients.find(g => g.id === x.ingredientId);
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-terracotta/5 border border-terracotta/20">
                    <span className="text-sm font-medium truncate">{getCatEmoji(ig?.category)} {ig?.name || '?'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-terracotta">{x.qty} {ig?.unit}</span>
                      <button type="button" onClick={() => setRecipeIngs(recipeIngs.filter((_, j) => j !== i))} className="text-warm-gray hover:text-tomato"><DelIcon /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Intermediates (keep dropdown — small count) */}
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
                    <span className="text-xs text-warm-gray">{it?.unit}</span>
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

      {/* Picker modal */}
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
