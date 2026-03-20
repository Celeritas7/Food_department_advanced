export function SpoilageBadge({ status, daysRemaining }) {
  const c = { Fresh: 'bg-sage/20 text-sage', NearExpiry: 'bg-butter/40 text-yellow-700', Expired: 'bg-tomato/20 text-tomato', Unknown: 'bg-light-gray/30 text-warm-gray' }[status] || 'bg-light-gray/30';
  const l = { Fresh: 'Fresh', NearExpiry: 'Soon', Expired: 'Expired', Unknown: '?' }[status] || '?';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{l}{daysRemaining !== null && ` ${daysRemaining}d`}</span>;
}

export function PriorityBadge({ priority }) {
  const c = { 1: 'bg-tomato/10 text-tomato', 2: 'bg-amber-100 text-amber-700' }[priority] || 'bg-light-gray/30';
  const l = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low', 5: 'Someday' }[priority] || 'Normal';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{l}</span>;
}
