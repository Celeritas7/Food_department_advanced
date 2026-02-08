/**
 * IntermediateForm.jsx — Preparation form with category-tabbed ingredient picker
 */
import { useState } from 'react';
import { DelIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';
import IngredientPicker from '../ui/IngredientPicker';

export default function IntermediateForm({ initial, ingredients, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'portions');
  const [stock, setStock] = useState(initial?.stock_qty || 0);
  const [category, setCategory] = useState(initial?.category || '');
  const [inputs, setInputs] = useState(initial?.inputIngredients || []);
  const [showPicker, setShowPicker] = useState(false);

  const handlePickerConfirm = (items) => {
    setInputs(items.map(it => ({ ingredientId: it.id, qtyPerUnit: it.qty })));
    setShowPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), unit, stockQty: stock, category, inputIngredients: inputs });
  };

  const pickerInitial = inputs.map(inp => ({ id: inp.ingredientId, qty: inp.qtyPerUnit }));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Pizza Dough" className="w-full px-4 py-2 rounded-lg border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-4 py-2 rounded-lg border">
              {['portions', 'batches', 'cups', 'g', 'ml'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input type="number" value={stock} onChange={e => setStock(+e.target.value || 0)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Sauce, Dough" className="w-full px-4 py-2 rounded-lg border" />
        </div>

        {/* Inputs via picker */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">🥕 Inputs per 1 {unit} ({inputs.length})</span>
            <button type="button" onClick={() => setShowPicker(true)} className="text-sm font-medium text-white bg-purple px-3 py-1.5 rounded-lg">
              {inputs.length > 0 ? '✏️ Edit' : '🥘 Pick'}
            </button>
          </div>
          {!inputs.length ? (
            <div className="text-center py-6 border-2 border-dashed rounded-xl text-warm-gray">
              <p className="text-2xl mb-1">🥘</p>
              <p className="text-sm">Tap "Pick" to browse by category</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {inputs.map((inp, i) => {
                const ig = ingredients.find(g => g.id === inp.ingredientId);
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-purple/5 border border-purple/20">
                    <span className="text-sm font-medium truncate">{getCatEmoji(ig?.category)} {ig?.name || '?'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple">{inp.qtyPerUnit} {ig?.unit}/unit</span>
                      <button type="button" onClick={() => setInputs(inputs.filter((_, j) => j !== i))} className="text-warm-gray hover:text-tomato"><DelIcon /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!inputs.length && <p className="text-sm text-amber-600">⚠ No inputs linked</p>}
        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-purple text-white">{initial ? 'Update' : 'Add'}</button>
        </div>
      </form>

      {showPicker && (
        <IngredientPicker
          ingredients={ingredients}
          initialSelected={pickerInitial}
          onClose={() => setShowPicker(false)}
          onConfirm={handlePickerConfirm}
          title="Pick Inputs for Preparation"
          qtyLabel="per unit"
        />
      )}
    </>
  );
}
