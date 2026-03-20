import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = { error: 'bg-tomato', success: 'bg-sage', warn: 'bg-amber-500' }[type] || 'bg-charcoal';
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] fade">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm text-center`}>{message}</div>
    </div>
  );
}
