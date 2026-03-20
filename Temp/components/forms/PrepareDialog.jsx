import { useState } from 'react';

export default function PrepareDialog({ intermediate, intIngredients, ingredients, onPrepare, onCancel }) {
  const [units, setUnits] = useState(1);

  const needs = intIngredients.map(inp => {
    const ig = ingredients.find(i => i.id === inp.ingredient_id);
    return { ...inp, ingredient: ig, totalNeeded: inp.qty_per_unit * units };
  });

  const canPrepare = needs.every(n => n.ingredient && n.ingredient.stock_qty >= n.totalNeeded) && units > 0;

  return (
    <div className="space-y-4">
      <div className="bg-purple/10 rounded-xl p-4">
        <h3 className="font-semibold">{intermediate.name}</h3>
        <p className="text-sm text-warm-gray">Stock: {intermediate.stock_qty} {intermediate.unit}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Units to prepare</label>
        <input type="number" value={units} onChange={e => setUnits(Math.max(1, +e.target.value || 1))} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border text-lg" autoFocus />
      </div>

      <div className="bg-cream rounded-xl p-4">
        <p className="text-sm text-warm-gray mb-2">Will deduct:</p>
        <ul className="text-sm space-y-1">
          {needs.map((n, i) => {
            const short = n.ingredient && n.ingredient.stock_qty < n.totalNeeded;
            return (
              <li key={i} className="flex justify-between">
                <span className={short ? 'text-tomato font-medium' : ''}>{n.ingredient?.name}{short && ' ⚠'}</span>
                <span className={short ? 'text-tomato' : 'text-warm-gray'}>
                  -{n.totalNeeded} {n.ingredient?.unit}{short && ` (have ${n.ingredient.stock_qty})`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-sage/10 rounded-xl p-4 flex justify-between">
        <div><span className="text-sm text-warm-gray">Now</span><div className="font-medium">{intermediate.stock_qty}</div></div>
        <div className="text-right"><span className="text-sm text-warm-gray">After</span><div className="font-medium text-purple">{intermediate.stock_qty + units}</div></div>
      </div>

      {!canPrepare && <p className="text-sm text-tomato text-center">⚠ Insufficient ingredients for {units} {intermediate.unit}</p>}

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
        <button onClick={() => canPrepare && onPrepare(units)} disabled={!canPrepare} className={`flex-1 py-2 rounded-lg text-white ${canPrepare ? 'bg-purple' : 'bg-light-gray cursor-not-allowed'}`}>Prepare</button>
      </div>
    </div>
  );
}
