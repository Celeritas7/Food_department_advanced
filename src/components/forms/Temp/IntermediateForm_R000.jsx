import { useState } from 'react';
import { PlusIcon, DelIcon } from '../ui/Icons';

export default function IntermediateForm({ initial, ingredients, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'portions');
  const [stock, setStock] = useState(initial?.stock_qty || 0);
  const [inputs, setInputs] = useState(initial?.inputIngredients || []);

  const addInput = () => {
    const unused = ingredients.filter(i => !inputs.some(x => x.ingredientId === i.id));
    if (unused.length) setInputs([...inputs, { ingredientId: unused[0].id, qtyPerUnit: 1 }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), unit, stockQty: stock, inputIngredients: inputs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Pizza Dough" className="w-full px-4 py-2 rounded-lg border" />
      </div>
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

      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Inputs (per 1 {unit})</span>
          <button type="button" onClick={addInput} className="text-sm text-purple flex items-center gap-1"><PlusIcon />Add</button>
        </div>
        {!inputs.length ? (
          <p className="text-sm text-amber-600">⚠ No inputs linked</p>
        ) : (
          <div className="space-y-2">
            {inputs.map((inp, i) => {
              const ig = ingredients.find(g => g.id === inp.ingredientId);
              return (
                <div key={i} className="flex gap-2 items-center">
                  <select value={inp.ingredientId} onChange={e => { const u = [...inputs]; u[i] = { ...u[i], ingredientId: e.target.value }; setInputs(u); }} className="flex-1 px-2 py-1.5 rounded border text-sm">
                    {ingredients.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <input type="number" value={inp.qtyPerUnit} onChange={e => { const u = [...inputs]; u[i] = { ...u[i], qtyPerUnit: +e.target.value || 0 }; setInputs(u); }} className="w-16 px-2 py-1.5 rounded border text-sm text-center" />
                  <span className="text-xs text-warm-gray">{ig?.unit}</span>
                  <button type="button" onClick={() => setInputs(inputs.filter((_, j) => j !== i))} className="p-1 text-warm-gray hover:text-tomato"><DelIcon /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
        <button type="submit" className="flex-1 py-2 rounded-lg bg-purple text-white">{initial ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
