/**
 * FilterBar.jsx — Reusable horizontally-scrollable filter chips
 */

export default function FilterBar({ label, filters, active, onToggle }) {
  return (
    <div className="mb-3">
      {label && <p className="text-xs font-semibold text-warm-gray uppercase tracking-wider mb-2">{label}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => {
          const isOn = active.includes(f.value);
          return (
            <button
              key={f.value}
              onClick={() => onToggle(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                isOn ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-charcoal border-light-gray hover:border-warm-gray'
              }`}
            >
              {f.emoji && <span className="text-sm">{f.emoji}</span>}
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${isOn ? 'bg-white/30 text-white' : 'bg-light-gray/50 text-warm-gray'}`}>
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
