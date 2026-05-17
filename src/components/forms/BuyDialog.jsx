import { useState } from 'react';

// Tap-to-set quantity presets per unit (no typing needed).
const QTY_CHIPS = {
  g:     [100, 200, 500, 1000],
  ml:    [100, 250, 500, 1000],
  piece: [1, 2, 5, 10],
  pack:  [1, 2, 3, 5],
};

// Local YYYY-MM-DD for the <input type="date"> control.
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function BuyDialog({ ingredient, suggestedQty, onBuy, onCancel }) {
  const [qty, setQty] = useState(suggestedQty || 1);
  const today = todayStr();
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [remindDays, setRemindDays] = useState('');
  const chips = QTY_CHIPS[ingredient.unit] || null;

  const handleBuy = () => {
    if (qty <= 0) return;
    // Backdate only if the user picked a date earlier than today; for today,
    // pass null so the RPC's `now()` keeps its hour-level precision.
    const purchasedAt = purchaseDate && purchaseDate !== today
      ? new Date(purchaseDate + 'T00:00:00').toISOString()
      : null;
    // Blank field → leave any existing reminder untouched.
    const days = Number(remindDays);
    const remindInDays = remindDays !== '' && days > 0 ? days : null;
    onBuy(qty, purchasedAt, remindInDays);
  };

  return (
    <div className="space-y-4">
      <div className="bg-cream rounded-xl p-4">
        <h3 className="font-semibold">{ingredient.name}</h3>
        <p className="text-sm text-warm-gray">Current: {ingredient.stock_qty} {ingredient.unit}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Qty ({ingredient.unit})</label>
        <input type="number" value={qty} onChange={e => setQty(+e.target.value || 0)} onFocus={e => e.target.select()} className="w-full px-4 py-2 rounded-lg border text-lg" autoFocus />
        {chips && (
          <div className="flex gap-2 mt-2">
            {chips.map(c => {
              const isSuggested = suggestedQty && c === suggestedQty;
              const isActive = c === qty;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQty(c)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border ${
                    isActive
                      ? 'bg-terracotta text-white border-terracotta'
                      : isSuggested
                        ? 'bg-sage/10 text-sage border-sage/40'
                        : 'bg-white text-warm-gray border-light-gray hover:bg-cream'
                  }`}
                >{c}</button>
              );
            })}
          </div>
        )}
        {suggestedQty && <p className="text-xs text-sage mt-1">Suggested: {suggestedQty} {ingredient.unit}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Remind me in <span className="text-warm-gray font-normal">(days — optional)</span></label>
        <input
          type="number"
          min="1"
          value={remindDays}
          onChange={e => setRemindDays(e.target.value)}
          placeholder="Leave blank to keep current reminder"
          className="w-full px-4 py-2 rounded-lg border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Purchase Date <span className="text-warm-gray font-normal">(optional — backdate if needed)</span></label>
        <input
          type="date"
          value={purchaseDate}
          max={today}
          onChange={e => setPurchaseDate(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border"
        />
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
        <button onClick={handleBuy} disabled={qty <= 0} className={`flex-1 py-2 rounded-lg text-white ${qty > 0 ? 'bg-terracotta' : 'bg-light-gray cursor-not-allowed'}`}>Buy</button>
      </div>
    </div>
  );
}
