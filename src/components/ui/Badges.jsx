export function SpoilageBadge({ status, daysRemaining }) {
  if (status === 'Fresh') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-sage/20 text-sage">🟢 Fresh</span>;
  }
  if (status === 'NearExpiry') {
    const d = daysRemaining ?? 0;
    const label = d === 0 ? 'today' : d === 1 ? '1 day left' : `${d} days left`;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-butter/40 text-yellow-700">🟡 {label}</span>;
  }
  if (status === 'Expired') {
    const d = Math.abs(daysRemaining ?? 0);
    const label = d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-tomato/20 text-tomato">🔴 Expired {label}</span>;
  }
  // Unknown / null
  return <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30 text-warm-gray">⬜ Unknown</span>;
}

export function PriorityBadge({ priority }) {
  const c = { 1: 'bg-tomato/10 text-tomato', 2: 'bg-amber-100 text-amber-700' }[priority] || 'bg-light-gray/30';
  const l = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low', 5: 'Someday' }[priority] || 'Normal';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{l}</span>;
}

// Inherited priority — propagated from planned dishes onto an ingredient.
// Lower number = more urgent (1 = highest). Returns null when no dish refs it.
export function InheritedPriorityBadge({ priority }) {
  if (priority == null) return null;
  const c = {
    1: 'bg-tomato/15 text-tomato',
    2: 'bg-amber-100 text-amber-700',
    3: 'bg-butter/50 text-yellow-800',
  }[priority] || 'bg-light-gray/30 text-warm-gray';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${c}`}>
      P{priority}
    </span>
  );
}
