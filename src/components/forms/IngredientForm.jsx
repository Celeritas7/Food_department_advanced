import { useState } from 'react';

export default function IngredientForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'g');
  const [stock, setStock] = useState(initial?.stock_qty || 0);
  const [shelfLife, setShelfLife] = useState(initial?.shelf_life_days || 7);
  const [category, setCategory] = useState(initial?.category || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      unit,
      stockQty: stock,
      shelfLifeDays: shelfLife,
      category,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Unit</label>
        <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-4 py-2 rounded-lg border">
          {['g', 'kg', 'ml', 'L', 'pieces', 'cups'].map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Stock</label>
        <input type="number" value={stock} onChange={e => setStock(+e.target.value || 0)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Shelf Life (days)</label>
        <input type="number" value={shelfLife} onChange={e => setShelfLife(+e.target.value || 1)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Spices, Vegetables" className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
        <button type="submit" className="flex-1 py-2 rounded-lg bg-terracotta text-white">{initial ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}
