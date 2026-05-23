/**
 * UsedUpPopup — confirmation popup for the "✓ Used Up" action on expiring
 * ingredient cards. Two outcomes (used vs wasted) both zero the stock; the
 * distinction is preserved in food_department_ingredient_usage_log for
 * future "how much did we waste?" analytics.
 */
export default function UsedUpPopup({ ingredient, onConfirm, onCancel }) {
  if (!ingredient) return null;
  const { name, stock_qty, unit } = ingredient;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg fade px-5 py-5">
        <h3 className="text-base font-semibold text-charcoal text-center">
          Used up all {stock_qty}{unit ? ` ${unit}` : ''} of {name}?
        </h3>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onConfirm('used')}
            className="flex-1 py-2.5 rounded-xl bg-sage text-white text-sm font-bold"
          >Used it</button>
          <button
            onClick={() => onConfirm('wasted')}
            className="flex-1 py-2.5 rounded-xl bg-tomato text-white text-sm font-bold"
          >Wasted it</button>
        </div>
        <button
          onClick={onCancel}
          className="block mx-auto mt-3 text-xs text-warm-gray hover:text-charcoal underline"
        >Cancel</button>
      </div>
    </div>
  );
}
