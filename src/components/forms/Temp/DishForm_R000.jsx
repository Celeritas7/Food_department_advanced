import { useState } from 'react';
import { PlusIcon, DelIcon } from '../ui/Icons';

export default function DishForm({ initial, ingredients, intermediates, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [recipeIngs, setRecipeIngs] = useState(initial?.recipeIngredients || []);
  const [recipeInts, setRecipeInts] = useState(initial?.recipeIntermediates || []);

  const addIng = () => {
    const unused = ingredients.filter(i => !recipeIngs.some(x => x.ingredientId === i.id));
    if (unused.length) setRecipeIngs([...recipeIngs, { ingredientId: unused[0].id, qty: 1 }]);
  };

  const addInt = () => {
    const unused = intermediates.filter(i => !recipeInts.some(x => x.intermediateId === i.id));
    if (unused.length) setRecipeInts([...recipeInts, { intermediateId: unused[0].id, qty: 1 }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), priority, recipeIngredients: recipeIngs, recipeIntermediates: recipeInts });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Dish Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select value={priority} onChange={e => setPriority(+e.target.value)} className="w-full px-4 py-2 rounded-lg border">
          {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{['Urgent', 'High', 'Normal', 'Low', 'Someday'][p - 1]}</option>)}
        </select>
      </div>

      {/* Ingredients section */}
      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Ingredients</span>
          <button type="button" onClick={addIng} className="text-sm text-terracotta flex items-center gap-1"><PlusIcon />Add</button>
        </div>
        {!recipeIngs.length ? <p className="text-sm text-warm-gray">None</p> : (
          <div className="space-y-2">
            {recipeIngs.map((x, i) => {
              const ig = ingredients.find(g => g.id === x.ingredientId);
              return (
                <div key={i} className="flex gap-2 items-center">
                  <select value={x.ingredientId} onChange={e => { const u = [...recipeIngs]; u[i] = { ...u[i], ingredientId: e.target.value }; setRecipeIngs(u); }} className="flex-1 px-2 py-1.5 rounded border text-sm">
                    {ingredients.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <input type="number" value={x.qty} onChange={e => { const u = [...recipeIngs]; u[i] = { ...u[i], qty: +e.target.value || 0 }; setRecipeIngs(u); }} className="w-16 px-2 py-1.5 rounded border text-sm text-center" />
                  <span className="text-xs text-warm-gray">{ig?.unit}</span>
                  <button type="button" onClick={() => setRecipeIngs(recipeIngs.filter((_, j) => j !== i))} className="p-1 text-warm-gray hover:text-tomato"><DelIcon /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Intermediates section */}
      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Preparations</span>
          <button type="button" onClick={addInt} disabled={!intermediates.length} className="text-sm text-purple flex items-center gap-1 disabled:opacity-50"><PlusIcon />Add</button>
        </div>
        {!recipeInts.length ? <p className="text-sm text-warm-gray">{intermediates.length ? 'None' : 'Create preps first'}</p> : (
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
  );
}
