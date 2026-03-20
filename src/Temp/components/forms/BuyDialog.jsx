import { useState } from 'react';

export default function BuyDialog({ ingredient, suggestedQty, onBuy, onCancel }) {
  const [qty, setQty] = useState(suggestedQty || 1);

  return (
    <div className="space-y-4">
      <div className="bg-cream rounded-xl p-4">
        <h3 className="font-semibold">{ingredient.name}</h3>
        <p className="text-sm text-warm-gray">Current: {ingredient.stock_qty} {ingredient.unit}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Qty ({ingredient.unit})</label>
        <input type="number" value={qty} onChange={e => setQty(+e.target.value || 0)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border text-lg" autoFocus />
        {suggestedQty && <p className="text-xs text-sage mt-1">Suggested: {suggestedQty} {ingredient.unit}</p>}
      </div>

      <div className="bg-sage/10 rounded-xl p-4 flex justify-between">
        <div>
          <span className="text-sm text-warm-gray">Now</span>
          <div className="font-medium">{ingredient.stock_qty} {ingredient.unit}</div>
        </div>
        <div className="text-right">
          <span className="text-sm text-warm-gray">After</span>
          <div className="font-medium text-sage">{(ingredient.stock_qty + qty).toFixed(1)} {ingredient.unit}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border">Cancel</button>
        <button onClick={() => qty > 0 && onBuy(qty)} disabled={qty <= 0} className={`flex-1 py-2 rounded-lg text-white ${qty > 0 ? 'bg-terracotta' : 'bg-light-gray cursor-not-allowed'}`}>Buy</button>
      </div>
    </div>
  );
}
