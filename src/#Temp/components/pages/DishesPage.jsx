/**
 * DishesPage.jsx — 4-tab layout:
 *   📖 Menu Planner (smart hub ranked by % completeness)
 *   🔥 In Progress (finalized)
 *   ✅ Cooked (done/fridge)
 *   📋 All (everything)
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { DishIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import { PriorityBadge } from '../ui/Badges';
import FilterBar from '../ui/FilterBar';
import { getDishTypeEmoji, getCountryFlag } from '../../config/emoji.js';

const STATUSES = ['Not planned', 'Planned', 'In Progress'];
const STATUS_STYLES = {
  'Not planned': 'bg-gray-100 text-gray-500',
  'Planned': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Cooked': 'bg-emerald-100 text-emerald-700',
};

// ─── Completeness Ring SVG ───
function CompletenessRing({ percent, size = 40, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent === 100 ? '#4ade80' : percent >= 70 ? '#fbbf24' : percent >= 40 ? '#fb923c' : '#f87171';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{percent}%</span>
    </div>
  );
}

// ─── Dish Card (shared across tabs) ───
function DishCard({ d, showRing, showStatusDropdown, showCook, onCook, onQuickStatus, onEdit, onDelete, onRecipe }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const av = d._availability || {};
  const isCooked = d.status === 'Cooked';

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  // ▶ NEW: Check if dish has recipe data
  const hasRecipe = d.recipe_data && (
    (d.recipe_data.ingredientGroups?.length > 0) ||
    (d.recipe_data.preparation?.length > 0) ||
    (d.recipe_data.cookingSteps?.length > 0) ||
    d.recipe_data.serve
  );

  return (
    <div className={`bg-white rounded-xl border p-4 fade ${isCooked ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        {showRing && !isCooked && !av.unlinked && (
          <div className="shrink-0 pt-0.5">
            <CompletenessRing percent={av.completeness || 0} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">
            {d.dish_type ? getDishTypeEmoji(d.dish_type) : '🍽️'} {d.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {/* Status badge (clickable dropdown) */}
            {showStatusDropdown && !isCooked ? (
              <div className="relative" ref={dropOpen ? dropRef : null}>
                <button onClick={() => setDropOpen(!dropOpen)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:ring-2 hover:ring-terracotta/30 ${STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-500'}`}>
                  {d.status} ▾
                </button>
                {dropOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[130px]">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => { onQuickStatus(d, s); setDropOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream ${d.status === s ? 'font-bold text-terracotta' : 'text-charcoal'}`}>
                        {s === 'Not planned' && '⏸️ '}{s === 'Planned' && '📋 '}{s === 'In Progress' && '🔥 '}{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
            )}
            <PriorityBadge priority={d.priority} />
            {d.country && <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30">{getCountryFlag(d.country)} {d.country}</span>}
            {d.dish_type && <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30">{getDishTypeEmoji(d.dish_type)} {d.dish_type}</span>}
          </div>
          {/* Availability info */}
          {!isCooked && (
            <div className="text-xs mt-2">
              {av.unlinked ? <span className="text-amber-600">⚠️ Unlinked — add ingredients</span>
                : av.canCook ? <span className="text-sage font-medium">✓ Ready to cook</span>
                : <span className="text-warm-gray">{av.haveIngs ?? 0}/{av.totalIngs ?? 0} ingredients · Missing: <span className="text-tomato">{[...av.missing?.map(m => m.name) || [], ...av.missingInts?.map(m => m.name) || []].join(', ')}</span></span>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 mt-3 pt-3 border-t items-center">
        {showCook && !isCooked && (
          <button onClick={() => onCook(d)} disabled={!av.canCook}
            className={`flex-1 py-1.5 rounded text-sm font-medium ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>
            {av.canCook ? '✅ Cook' : 'Cook'}
          </button>
        )}
        {/* Quick action buttons for Menu Planner */}
        {!showCook && !isCooked && d.status !== 'In Progress' && (
          <button onClick={() => onQuickStatus(d, 'In Progress')}
            className="flex-1 py-1.5 rounded text-sm font-medium text-amber-600 hover:bg-amber-50">
            🔥 Start
          </button>
        )}
        {!showCook && !isCooked && d.status === 'In Progress' && (
          <button onClick={() => onCook(d)} disabled={!av.canCook}
            className={`flex-1 py-1.5 rounded text-sm font-medium ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>
            ✅ Cook
          </button>
        )}
        {/* ▶ NEW: Recipe button */}
        <button onClick={() => onRecipe(d)}
          className={`p-1.5 rounded hover:bg-terracotta/10 ${hasRecipe ? 'text-terracotta' : 'text-warm-gray'}`}
          title={hasRecipe ? 'View recipe' : 'Add recipe'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </button>
        <button onClick={() => onEdit(d)} className="p-1.5 rounded text-warm-gray hover:bg-light-gray/20"><EditIcon /></button>
        <button onClick={() => onDelete(d)} className="p-1.5 rounded text-warm-gray hover:text-tomato"><DelIcon /></button>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function DishesPage({ dishes, onAdd, onEdit, onCook, onQuickStatus, onDelete, onManage, onRecipe }) {
  const [tab, setTab] = useState('planner');
  const [countryFilter, setCountryFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [minCompleteness, setMinCompleteness] = useState(0);

  const toggleFilter = (arr, setArr) => (val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const countryOptions = useMemo(() => {
    const countries = [...new Set(dishes.map(d => d.country).filter(Boolean))].sort();
    return countries.map(c => ({ value: c, label: c, emoji: getCountryFlag(c) }));
  }, [dishes]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(dishes.map(d => d.dish_type).filter(Boolean))].sort();
    return types.map(t => ({ value: t, label: t, emoji: getDishTypeEmoji(t) }));
  }, [dishes]);

  // Counts
  const counts = useMemo(() => ({
    planner: dishes.filter(d => d.status !== 'Cooked').length,
    progress: dishes.filter(d => d.status === 'In Progress').length,
    cooked: dishes.filter(d => d.status === 'Cooked').length,
    all: dishes.length,
  }), [dishes]);

  // Filtered list per tab
  const filtered = useMemo(() => {
    let list = dishes;

    // Tab filter
    if (tab === 'planner') list = list.filter(d => d.status !== 'Cooked');
    else if (tab === 'progress') list = list.filter(d => d.status === 'In Progress');
    else if (tab === 'cooked') list = list.filter(d => d.status === 'Cooked');

    // Country & Type
    if (countryFilter.length) list = list.filter(d => countryFilter.includes(d.country));
    if (typeFilter.length) list = list.filter(d => typeFilter.includes(d.dish_type));

    // Completeness threshold (Menu Planner only)
    if (tab === 'planner' && minCompleteness > 0) {
      list = list.filter(d => (d._availability?.completeness || 0) >= minCompleteness);
    }

    // Sort
    if (tab === 'planner') {
      // Sort by completeness desc, then priority asc
      return list.sort((a, b) => {
        const ca = a._availability?.completeness || 0;
        const cb = b._availability?.completeness || 0;
        if (cb !== ca) return cb - ca;
        return a.priority - b.priority;
      });
    } else if (tab === 'progress') {
      return list.sort((a, b) => a.priority - b.priority);
    } else if (tab === 'cooked') {
      return list.sort((a, b) => (b.last_cooked_on || '').localeCompare(a.last_cooked_on || ''));
    }
    // All tab: status order then priority
    const order = { 'In Progress': 0, 'Planned': 1, 'Not planned': 2, 'Cooked': 3 };
    return list.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.priority - b.priority);
  }, [dishes, tab, countryFilter, typeFilter, minCompleteness]);

  // Summary stats for Menu Planner
  const plannerStats = useMemo(() => {
    if (tab !== 'planner') return null;
    const ready = filtered.filter(d => d._availability?.canCook).length;
    const above70 = filtered.filter(d => (d._availability?.completeness || 0) >= 70).length;
    return { ready, above70, total: filtered.length };
  }, [filtered, tab]);

  const tabs = [
    { key: 'planner', label: '📖 Menu Planner', count: counts.planner },
    { key: 'progress', label: '🔥 In Progress', count: counts.progress },
    { key: 'cooked', label: '✅ Cooked', count: counts.cooked },
    { key: 'all', label: '📋 All', count: counts.all },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><DishIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">🍽️ Dishes</h1>
              <p className="text-sm text-warm-gray">{filtered.length} shown</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onManage} className="px-3 py-2 rounded-lg border text-sm font-medium text-warm-gray hover:bg-cream">📋 Manage</button>
            <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Tab bar */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setMinCompleteness(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.key ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border'
              }`}>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-cream'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Menu Planner summary & completeness filter */}
        {tab === 'planner' && plannerStats && (
          <div className="bg-white rounded-xl border p-4 mb-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-sage">{plannerStats.ready}</div>
                <div className="text-[10px] text-warm-gray">Ready to cook</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{plannerStats.above70}</div>
                <div className="text-[10px] text-warm-gray">Almost ready (70%+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warm-gray">{plannerStats.total}</div>
                <div className="text-[10px] text-warm-gray">Total dishes</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-gray whitespace-nowrap">Show ≥</span>
              {[0, 30, 50, 70, 100].map(v => (
                <button key={v} onClick={() => setMinCompleteness(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    minCompleteness === v ? 'bg-terracotta text-white' : 'bg-cream text-warm-gray border hover:border-gray-300'
                  }`}>{v === 0 ? 'All' : `${v}%`}</button>
              ))}
            </div>
          </div>
        )}

        {/* Country & Type filters */}
        {countryOptions.length > 0 && (
          <FilterBar label="Country" filters={countryOptions} active={countryFilter} onToggle={toggleFilter(countryFilter, setCountryFilter)} />
        )}
        {typeOptions.length > 0 && (
          <FilterBar label="Type" filters={typeOptions} active={typeFilter} onToggle={toggleFilter(typeFilter, setTypeFilter)} />
        )}
        {(countryFilter.length > 0 || typeFilter.length > 0) && (
          <button onClick={() => { setCountryFilter([]); setTypeFilter([]); }} className="text-xs text-terracotta font-medium mb-4 hover:underline">✕ Clear filters</button>
        )}

        {/* Empty state */}
        {!filtered.length ? (
          <div className="text-center py-16">
            <p className="text-warm-gray">
              {tab === 'planner' && 'No dishes yet — add some!'}
              {tab === 'progress' && 'No dishes in progress. Use 📖 Menu Planner to start dishes.'}
              {tab === 'cooked' && 'No cooked dishes yet.'}
              {tab === 'all' && 'No dishes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => (
              <DishCard
                key={d.id}
                d={d}
                showRing={tab === 'planner' || tab === 'all'}
                showStatusDropdown={tab === 'all'}
                showCook={tab === 'progress' || tab === 'cooked'}
                onCook={onCook}
                onQuickStatus={onQuickStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onRecipe={onRecipe}  /* ▶ NEW */
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
