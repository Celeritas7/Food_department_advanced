/**
 * UndoToast — page-level inline toast with a 5-second Undo window for the
 * "✓ Used Up" flow. Distinct from the global Toast component (which is
 * fire-and-forget): this one carries an action and is rendered by the page.
 *
 * After 5s the toast auto-dismisses and the action becomes permanent.
 */
import { useEffect } from 'react';

export default function UndoToast({ message, onUndo, onDismiss, duration = 5000 }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] fade">
      <div className="bg-charcoal text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-4 max-w-sm">
        <span>{message}</span>
        <button
          onClick={onUndo}
          className="text-butter font-bold underline shrink-0"
        >Undo</button>
      </div>
    </div>
  );
}
