/**
 * DishesPage.jsx — 4-tab layout:
 *   📖 Menu Planner (smart hub ranked by % completeness)
 *   🔥 In Progress (finalized)
 *   ✅ Cooked (done/fridge)
 *   📋 All (everything)
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { DishIcon, PlusIcon, EditIcon } from '../ui/Icons';
import FilterBar from '../ui/FilterBar';
import { getDishTypeEmoji, getCountryFlag } from '../../config/emoji.js';

const STATUSES = ['Not planned', 'Planned', 'In Progress'];
const STATUS_STYLES = {
  'Not planned': 'bg-gray-100 text-gray-500',
  'Planned': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Cooked': 'bg-emerald-100 text-emerald-700',
  'In Fridge': 'bg-cyan-100 text-cyan-700',
};

// Priority-as-color tokens (priority 1/2 = high, 3 = normal, 4/5 = low).
const PRIORITY_COLORS = {
  high:   { bg: '#FFF1EA', border: '#D97757', text: '#B05A38', label: 'High' },
  normal: { bg: '#FAF4E8', border: '#C4B697', text: '#8A7A53', label: 'Normal' },
  low:    { bg: '#F0F7F1', border: '#7AAD89', text: '#4A7C58', label: 'Low' },
};
function priorityVariant(p) {
  if (p == null) return 'normal';
  if (p <= 2) return 'high';
  if (p === 3) return 'normal';
  return 'low';
}

// Days between an ISO timestamp and now, floored.
function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000);
}

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
function DishCard({ d, tab, layout = 'grid', showRing, showStatusChip, showStatusDropdown, showCook, showStoreInFridge, showMarkEaten, onCook, onQuickStatus, onEdit, onRecipe, onStoreInFridge, onMarkEaten, onMarkWasted }) {
  const [dropOpen, setDropOpen] = useState(false);
  const [eatenOpen, setEatenOpen] = useState(false);
  const [eatenNotes, setEatenNotes] = useState('');
  const dropRef = useRef(null);
  const av = d._availability || {};
  const isCooked = d.status === 'Cooked';
  const isInFridge = d.status === 'In Fridge';
  const fridgeDays = isInFridge ? daysSince(d.stored_at) : null;
  const fridgeStale = fridgeDays != null && fridgeDays > 3;
  const isGrid = layout === 'grid';
  const pc = PRIORITY_COLORS[priorityVariant(d.priority)];
  const cardStyle = { backgroundColor: pc.bg, borderLeft: `4px solid ${pc.border}` };

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
    <div
      style={cardStyle}
      className={`rounded-xl border border-l-0 ${isGrid ? 'p-3' : 'p-4'} fade ${isCooked ? 'opacity-60' : ''} ${isInFridge && fridgeStale ? 'ring-1 ring-tomato/40' : ''}`}
    >
      <div className={`flex ${isGrid ? 'gap-2' : 'gap-3'}`}>
        {showRing && !isCooked && !isInFridge && !av.unlinked && (
          <div className="shrink-0 pt-0.5">
            <CompletenessRing percent={av.completeness || 0} size={isGrid ? 34 : 40} stroke={isGrid ? 3 : 4} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold leading-tight ${isGrid ? 'text-[14px] line-clamp-2' : 'text-sm'}`}
            title={d.name}
          >
            {d.dish_type ? getDishTypeEmoji(d.dish_type) : '🍽️'} {d.name}
          </h3>
          {/* Fridge-tab specific: days stored + stale warning */}
          {isInFridge && fridgeDays != null && (
            <div className="mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fridgeStale ? 'bg-tomato/15 text-tomato' : 'bg-cyan-100 text-cyan-700'}`}>
                {fridgeStale ? '⚠️ ' : '🧊 '}
                {fridgeDays === 0 ? 'Stored today' : `${fridgeDays} day${fridgeDays === 1 ? '' : 's'} in fridge`}
                {fridgeStale ? ' — eat soon' : ''}
              </span>
            </div>
          )}
          <div className={`flex flex-wrap ${isGrid ? 'gap-1 mt-1' : 'gap-1.5 mt-1.5'}`}>
            {/* Status badge (clickable dropdown) — hidden on tabs where the tab itself signals status */}
            {showStatusChip && showStatusDropdown && !isCooked && !isInFridge ? (
              <div className="relative" ref={dropOpen ? dropRef : null}>
                <button onClick={() => setDropOpen(!dropOpen)}
                  className={`${isGrid ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full font-medium cursor-pointer hover:ring-2 hover:ring-terracotta/30 ${STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-500'}`}>
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
            ) : showStatusChip ? (
              <span className={`${isGrid ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full font-medium ${STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
            ) : null}
            {!isCooked && !isInFridge && !av.unlinked && (
              av.canCook
                ? <span className={`${isGrid ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-sage/15 text-sage font-medium`}>🟢 Ready</span>
                : <span className={`${isGrid ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-tomato/10 text-tomato font-medium`}>
                    🔴 Missing {(av.missing?.length || 0) + (av.missingInts?.length || 0)}
                  </span>
            )}
            {d.country && <span className={`${isGrid ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-light-gray/30`}>{getCountryFlag(d.country)} {d.country}</span>}
            {!isGrid && d.dish_type && <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30">{getDishTypeEmoji(d.dish_type)} {d.dish_type}</span>}
          </div>
          {/* Availability info (compact in grid; only "missing names" hidden in grid to save space) */}
          {!isCooked && !isInFridge && (
            <div className={`${isGrid ? 'text-[11px] mt-1.5' : 'text-xs mt-2'}`}>
              {av.unlinked ? <span className="text-amber-600">⚠️ Unlinked — add ingredients</span>
                : av.canCook ? <span className="text-sage font-medium">✓ Ready to cook</span>
                : isGrid
                  ? <span className="text-warm-gray">{av.haveIngs ?? 0}/{av.totalIngs ?? 0} ingredients</span>
                  : <span className="text-warm-gray">{av.haveIngs ?? 0}/{av.totalIngs ?? 0} ingredients · Missing: <span className="text-tomato">{[...av.missing?.map(m => m.name) || [], ...av.missingInts?.map(m => m.name) || []].join(', ')}</span></span>}
            </div>
          )}
        </div>
      </div>

      {/* Mark-as-eaten notes input (Fridge tab) */}
      {showMarkEaten && isInFridge && eatenOpen && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <textarea value={eatenNotes} onChange={e => setEatenNotes(e.target.value)} rows={2}
            placeholder="Notes (optional)... How was it? Any tweaks for next time?"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:border-terracotta/50 outline-none" />
          <div className="flex gap-2">
            <button onClick={() => { setEatenOpen(false); setEatenNotes(''); }}
              className="flex-1 py-1.5 rounded border text-sm text-warm-gray hover:bg-cream">Cancel</button>
            <button onClick={() => { onMarkEaten(d, eatenNotes.trim() || null); setEatenOpen(false); setEatenNotes(''); }}
              className="flex-1 py-1.5 rounded bg-terracotta text-white text-sm font-medium">🍴 Confirm Eaten</button>
          </div>
        </div>
      )}

      {/* Actions — icon-only pills in grid mode, labeled buttons in list mode */}
      <div className={`flex ${isGrid ? 'gap-1 flex-wrap' : 'gap-1'} mt-3 pt-3 border-t border-charcoal/10 items-center`}>
        {showCook && !isCooked && !isInFridge && (
          isGrid
            ? <button onClick={() => onCook(d)} disabled={!av.canCook} title="Cook" aria-label="Cook"
                className={`px-2 py-1 rounded-full text-sm bg-white/60 ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>✅</button>
            : <button onClick={() => onCook(d)} disabled={!av.canCook}
                className={`flex-1 py-1.5 rounded text-sm font-medium ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>
                {av.canCook ? '✅ Cook' : 'Cook'}
              </button>
        )}
        {/* Cooked tab: Store in Fridge */}
        {showStoreInFridge && isCooked && (
          isGrid
            ? <button onClick={() => onStoreInFridge(d)} title="Store in fridge" aria-label="Store in fridge"
                className="px-2 py-1 rounded-full text-sm bg-white/60 text-cyan-700 hover:bg-cyan-50">🧊</button>
            : <button onClick={() => onStoreInFridge(d)}
                className="flex-1 py-1.5 rounded text-sm font-medium text-cyan-700 hover:bg-cyan-50">
                🧊 Store in Fridge
              </button>
        )}
        {/* Fridge tab: Mark as Eaten (toggles inline notes input) */}
        {showMarkEaten && isInFridge && !eatenOpen && (
          isGrid
            ? <button onClick={() => setEatenOpen(true)} title="Eaten" aria-label="Eaten"
                className="px-2 py-1 rounded-full text-sm bg-white/60 text-terracotta hover:bg-terracotta/10">✅</button>
            : <button onClick={() => setEatenOpen(true)}
                className="flex-1 py-1.5 rounded text-sm font-medium text-terracotta hover:bg-terracotta/10">
                ✅ Eaten
              </button>
        )}
        {/* Fridge tab: Mark as Wasted (no notes, logs notes='wasted' server-side) */}
        {showMarkEaten && isInFridge && !eatenOpen && (
          isGrid
            ? <button onClick={() => onMarkWasted(d)} title="Wasted" aria-label="Wasted"
                className="px-2 py-1 rounded-full text-sm bg-white/60 text-tomato hover:bg-tomato/10">🗑️</button>
            : <button onClick={() => onMarkWasted(d)}
                className="flex-1 py-1.5 rounded text-sm font-medium text-tomato hover:bg-tomato/10">
                🗑️ Wasted
              </button>
        )}
        {/* Quick action buttons for Menu Planner / All */}
        {!showCook && !showStoreInFridge && !showMarkEaten && !isCooked && !isInFridge && d.status !== 'In Progress' && (
          isGrid
            ? <button onClick={() => onQuickStatus(d, 'In Progress')} title="Start cooking" aria-label="Start cooking"
                className="px-2 py-1 rounded-full text-sm bg-white/60 text-amber-600 hover:bg-amber-50">🍳</button>
            : <button onClick={() => onQuickStatus(d, 'In Progress')}
                className="flex-1 py-1.5 rounded text-sm font-medium text-amber-600 hover:bg-amber-50">
                🔥 Start
              </button>
        )}
        {!showCook && !showStoreInFridge && !showMarkEaten && !isCooked && !isInFridge && d.status === 'In Progress' && (
          isGrid
            ? <button onClick={() => onCook(d)} disabled={!av.canCook} title="Mark cooked" aria-label="Mark cooked"
                className={`px-2 py-1 rounded-full text-sm bg-white/60 ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>✓</button>
            : <button onClick={() => onCook(d)} disabled={!av.canCook}
                className={`flex-1 py-1.5 rounded text-sm font-medium ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>
                ✅ Cook
              </button>
        )}
        {/* Recipe button */}
        <button onClick={() => onRecipe(d)}
          className={`${isGrid ? 'px-2 py-1 rounded-full bg-white/60' : 'p-1.5 rounded'} hover:bg-terracotta/10 ${hasRecipe ? 'text-terracotta' : 'text-warm-gray'}`}
          title={hasRecipe ? 'View recipe' : 'Add recipe'} aria-label="Recipe">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(d); }}
          className={`${isGrid ? 'px-2 py-1 rounded-full bg-white/60' : 'px-2.5 py-1.5 rounded'} text-sm font-medium text-charcoal/70 hover:bg-light-gray/30 hover:text-charcoal flex items-center gap-1`}
          title="Edit dish"
          aria-label="Edit dish"
        ><EditIcon />{!isGrid && ' Edit'}</button>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function DishesPage({ dishes, onAdd, onEdit, onCook, onQuickStatus, onManage, onRecipe, onStoreInFridge, onMarkEaten, onMarkWasted }) {
  const [tab, setTabRaw] = useState(() => sessionStorage.getItem('fd_dishTab') || 'planner');
  const [countryFilter, setCountryFilterRaw] = useState(() => { try { return JSON.parse(sessionStorage.getItem('fd_dishCountry')) || []; } catch { return []; } });
  const [typeFilter, setTypeFilterRaw] = useState(() => { try { return JSON.parse(sessionStorage.getItem('fd_dishType')) || []; } catch { return []; } });
  const [minCompleteness, setMinCompletenessRaw] = useState(() => parseInt(sessionStorage.getItem('fd_dishMin')) || 0);
  const [layout, setLayoutRaw] = useState(() => {
    try { return localStorage.getItem('fd_dishes_layout') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
  });
  const setLayout = (v) => { setLayoutRaw(v); try { localStorage.setItem('fd_dishes_layout', v); } catch {} };

  const setTab = (v) => { setTabRaw(v); sessionStorage.setItem('fd_dishTab', v); };
  const setCountryFilter = (v) => { const val = typeof v === 'function' ? v(countryFilter) : v; setCountryFilterRaw(val); sessionStorage.setItem('fd_dishCountry', JSON.stringify(val)); };
  const setTypeFilter = (v) => { const val = typeof v === 'function' ? v(typeFilter) : v; setTypeFilterRaw(val); sessionStorage.setItem('fd_dishType', JSON.stringify(val)); };
  const setMinCompleteness = (v) => { setMinCompletenessRaw(v); sessionStorage.setItem('fd_dishMin', String(v)); };

  const toggleFilter = (arr, setArr) => (val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  // Source for filter options. The Planned tab restricts options to
  // countries/types that actually appear among planned dishes.
  const filterSource = useMemo(() => {
    if (tab === 'planned') return dishes.filter(d => d.status === 'Planned');
    return dishes;
  }, [dishes, tab]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(filterSource.map(d => d.country).filter(Boolean))].sort();
    return countries.map(c => ({ value: c, label: c, emoji: getCountryFlag(c) }));
  }, [filterSource]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(filterSource.map(d => d.dish_type).filter(Boolean))].sort();
    return types.map(t => ({ value: t, label: t, emoji: getDishTypeEmoji(t) }));
  }, [filterSource]);

  // Counts
  const counts = useMemo(() => ({
    planner: dishes.filter(d => d.status !== 'Cooked' && d.status !== 'In Fridge').length,
    planned: dishes.filter(d => d.status === 'Planned').length,
    progress: dishes.filter(d => d.status === 'In Progress').length,
    cooked: dishes.filter(d => d.status === 'Cooked').length,
    fridge: dishes.filter(d => d.status === 'In Fridge').length,
    all: dishes.length,
  }), [dishes]);

  // Filtered list per tab
  const filtered = useMemo(() => {
    let list = dishes;

    // Tab filter
    if (tab === 'planner') list = list.filter(d => d.status !== 'Cooked' && d.status !== 'In Fridge');
    else if (tab === 'planned') list = list.filter(d => d.status === 'Planned');
    else if (tab === 'progress') list = list.filter(d => d.status === 'In Progress');
    else if (tab === 'cooked') list = list.filter(d => d.status === 'Cooked');
    else if (tab === 'fridge') list = list.filter(d => d.status === 'In Fridge');

    // Country & Type (skip on tabs where the filter UI is hidden)
    if (tab !== 'progress' && tab !== 'cooked' && tab !== 'fridge') {
      if (countryFilter.length) list = list.filter(d => countryFilter.includes(d.country));
      if (typeFilter.length) list = list.filter(d => typeFilter.includes(d.dish_type));
    }

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
    } else if (tab === 'planned') {
      // Mirror Menu Planner: completeness desc, priority asc.
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
    } else if (tab === 'fridge') {
      // Oldest stored first so stale items are at the top.
      return list.sort((a, b) => (a.stored_at || '').localeCompare(b.stored_at || ''));
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
    { key: 'planned', label: '📋 Planned', count: counts.planned },
    { key: 'progress', label: '🔥 In Progress', count: counts.progress },
    { key: 'cooked', label: '✅ Cooked', count: counts.cooked },
    { key: 'fridge', label: '🧊 Fridge', count: counts.fridge },
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
          <div className="flex gap-2 items-center">
            <div className="flex rounded-lg border overflow-hidden" role="group" aria-label="Layout">
              <button
                onClick={() => setLayout('grid')}
                className={`px-2.5 py-2 text-sm font-medium ${layout === 'grid' ? 'bg-terracotta text-white' : 'bg-white text-warm-gray hover:bg-cream'}`}
                title="Grid view" aria-label="Grid view" aria-pressed={layout === 'grid'}
              >⊞</button>
              <button
                onClick={() => setLayout('list')}
                className={`px-2.5 py-2 text-sm font-medium border-l ${layout === 'list' ? 'bg-terracotta text-white' : 'bg-white text-warm-gray hover:bg-cream'}`}
                title="List view" aria-label="List view" aria-pressed={layout === 'list'}
              >≡</button>
            </div>
            <button onClick={onManage} className="px-3 py-2 rounded-lg border text-sm font-medium text-warm-gray hover:bg-cream">📋 Manage</button>
            <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Tab bar */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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

        {/* Priority legend */}
        <div className="flex gap-3 mb-4 text-[11px] text-warm-gray items-center" aria-label="Priority color legend">
          {(['high', 'normal', 'low']).map(v => (
            <span key={v} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: PRIORITY_COLORS[v].border }} />
              {PRIORITY_COLORS[v].label}
            </span>
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

        {/* Country & Type filters (hidden on In Progress and Cooked tabs) */}
        {tab !== 'progress' && tab !== 'cooked' && tab !== 'fridge' && countryOptions.length > 0 && (
          <FilterBar label="Country" filters={countryOptions} active={countryFilter} onToggle={toggleFilter(countryFilter, setCountryFilter)} />
        )}
        {tab !== 'progress' && tab !== 'cooked' && tab !== 'fridge' && typeOptions.length > 0 && (
          <FilterBar label="Type" filters={typeOptions} active={typeFilter} onToggle={toggleFilter(typeFilter, setTypeFilter)} />
        )}
        {tab !== 'progress' && tab !== 'cooked' && tab !== 'fridge' && (countryFilter.length > 0 || typeFilter.length > 0) && (
          <button onClick={() => { setCountryFilter([]); setTypeFilter([]); }} className="text-xs text-terracotta font-medium mb-4 hover:underline">✕ Clear filters</button>
        )}

        {/* Empty state */}
        {!filtered.length ? (
          <div className="text-center py-16">
            <p className="text-warm-gray">
              {tab === 'planner' && 'No dishes yet — add some!'}
              {tab === 'planned' && 'No planned dishes. Set a dish to Planned to see it here.'}
              {tab === 'progress' && 'No dishes in progress. Use 📖 Menu Planner to start dishes.'}
              {tab === 'cooked' && 'No cooked dishes yet.'}
              {tab === 'fridge' && 'Nothing in the fridge. Cook a dish and store it here.'}
              {tab === 'all' && 'No dishes.'}
            </p>
          </div>
        ) : (
          <div
            className={layout === 'grid' ? 'grid gap-2.5' : 'flex flex-col gap-3'}
            style={layout === 'grid' ? { gridTemplateColumns: '1fr 1fr' } : undefined}
          >
            {filtered.map(d => (
              <DishCard
                key={d.id}
                d={d}
                tab={tab}
                layout={layout}
                showRing={tab === 'planner' || tab === 'planned' || tab === 'all'}
                showStatusChip={tab === 'planner' || tab === 'all'}
                showStatusDropdown={tab === 'all'}
                showCook={tab === 'progress'}
                showStoreInFridge={tab === 'cooked' || tab === 'all'}
                showMarkEaten={tab === 'fridge' || tab === 'all'}
                onCook={onCook}
                onQuickStatus={onQuickStatus}
                onEdit={onEdit}
                onRecipe={onRecipe}
                onStoreInFridge={onStoreInFridge}
                onMarkEaten={onMarkEaten}
                onMarkWasted={onMarkWasted}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
