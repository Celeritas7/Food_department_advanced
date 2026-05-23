/**
 * RevertPopup — confirmation popup for the "↩ Revert" action on dish cards.
 *
 * Shape depends on the from-status:
 *   Cooked    → Planned    : asks "Restore ingredient stock?"
 *   In Fridge → Cooked     : asks "Restore ingredient stock?"
 *   Eaten     → In Fridge  : no stock question (no stock change at this step)
 *
 * The caller passes the dish and resolves the target status from
 * REVERT_TARGET[dish.status]. The popup decides which button set to render
 * based on whether `target` falls into the stock-affecting transitions.
 */

// One-step-back mapping. Kept here so DishesPage and the popup agree.
export const REVERT_TARGET = {
  'Eaten':     'In Fridge',
  'In Fridge': 'Cooked',
  'Cooked':    'Planned',
};

export function canRevert(status) {
  return REVERT_TARGET[status] !== undefined;
}

export default function RevertPopup({ dish, onConfirm, onCancel }) {
  if (!dish) return null;
  const from = dish.status;
  const to = REVERT_TARGET[from];
  if (!to) return null;

  const stockAffecting = from === 'Cooked' || from === 'In Fridge';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg fade px-5 py-5">
        <h3 className="text-base font-semibold text-charcoal text-center">
          Revert {dish.name}?
        </h3>
        <p className="text-sm text-warm-gray text-center mt-1.5">
          Move from <span className="font-semibold text-charcoal">{from}</span> → <span className="font-semibold text-charcoal">{to}</span>.
        </p>

        {stockAffecting ? (
          <>
            <p className="text-sm font-semibold text-charcoal text-center mt-4">
              Restore ingredient stock?
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => onConfirm(true)}
                className="w-full py-2.5 rounded-xl bg-sage text-white text-sm font-bold"
              >Yes, restore stock</button>
              <button
                onClick={() => onConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-cream text-charcoal text-sm font-bold border border-charcoal/10"
              >No, just change status</button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <button
              onClick={() => onConfirm(false)}
              className="w-full py-2.5 rounded-xl bg-terracotta text-white text-sm font-bold"
            >Confirm revert</button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="block mx-auto mt-3 text-xs text-warm-gray hover:text-charcoal underline"
        >Cancel</button>
      </div>
    </div>
  );
}
