/**
 * DishesPage.jsx — Dishes with quick status toggle, emoji, country/type filters
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
  'Cooked': 'bg-sage/20 text-sage',
};

export default function DishesPage({ dishes, onAdd, onEdit, onCook, onQuickStatus, onDelete }) {
  const [statusFilter, setStatusFilter] = useState('active');
  const [countryFilter, setCountryFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleFilter = (arr, setArr) => (val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  // Close dropdown on outside click
  const dropRef = useRef(null);
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDropdown(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(dishes.map(d => d.country).filter(Boolean))].sort();
    return countries.map(c => ({ value: c, label: c, emoji: getCountryFlag(c) }));
  }, [dishes]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(dishes.map(d => d.dish_type).filter(Boolean))].sort();
    return types.map(t => ({ value: t, label: t, emoji: getDishTypeEmoji(t) }));
  }, [dishes]);

  const statusCounts = useMemo(() => {
    const active = dishes.filter(d => d.status !== 'Cooked').length;
    const ready = dishes.filter(d => d.status !== 'Cooked' && d._availability?.canCook).length;
    const planned = dishes.filter(d => d.status === 'Planned' || d.status === 'In Progress').length;
    const notPlanned = dishes.filter(d => d.status === 'Not planned').length;
    const cooked = dishes.filter(d => d.status === 'Cooked').length;
    return { active, ready, planned, notPlanned, cooked, all: dishes.length };
  }, [dishes]);

  const filtered = useMemo(() => {
    let list = dishes;
    if (statusFilter === 'active') list = list.filter(d => d.status !== 'Cooked');
    else if (statusFilter === 'ready') list = list.filter(d => d.status !== 'Cooked' && d._availability?.canCook);
    else if (statusFilter === 'planned') list = list.filter(d => d.status === 'Planned' || d.status === 'In Progress');
    else if (statusFilter === 'notplanned') list = list.filter(d => d.status === 'Not planned');
    else if (statusFilter === 'cooked') list = list.filter(d => d.status === 'Cooked');
    if (countryFilter.length) list = list.filter(d => countryFilter.includes(d.country));
    if (typeFilter.length) list = list.filter(d => typeFilter.includes(d.dish_type));

    return list.sort((a, b) => {
      if (a.status === 'Cooked' && b.status !== 'Cooked') return 1;
      if (a.status !== 'Cooked' && b.status === 'Cooked') return -1;
      const statusOrder = { 'In Progress': 0, 'Planned': 1, 'Not planned': 2 };
      const sa = statusOrder[a.status] ?? 3, sb = statusOrder[b.status] ?? 3;
      if (sa !== sb) return sa - sb;
      return a.priority - b.priority;
    });
  }, [dishes, statusFilter, countryFilter, typeFilter]);

  const filterTabs = [
    { key: 'active', label: 'Active', count: statusCounts.active },
    { key: 'planned', label: 'Planned', count: statusCounts.planned },
    { key: 'notplanned', label: 'Not planned', count: statusCounts.notPlanned },
    { key: 'ready', label: 'Ready', count: statusCounts.ready },
    { key: 'cooked', label: 'Cooked', count: statusCounts.cooked },
    { key: 'all', label: 'All', count: statusCounts.all },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><DishIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">🍽️ Dishes</h1>
              <p className="text-sm text-warm-gray">Plan & cook · {filtered.length} shown</p>
            </div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Status filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {filterTabs.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === f.key ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border'
              }`}>
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === f.key ? 'bg-white/20' : 'bg-cream'
              }`}>{f.count}</span>
            </button>
          ))}
        </div>

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

        {/* Dish cards */}
        {!filtered.length ? (
          <p className="text-center py-16 text-warm-gray">{dishes.length ? 'No matches' : 'No dishes yet'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => {
              const isCooked = d.status === 'Cooked';
              const isActive = d.status === 'Planned' || d.status === 'In Progress';
              const av = d._availability || {};
              return (
                <div key={d.id} className={`bg-white rounded-xl border p-4 fade ${isCooked && 'opacity-60'}`}>
                  <div>
                    <h3 className="font-semibold">
                      {d.dish_type ? getDishTypeEmoji(d.dish_type) : '🍽️'} {d.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {/* Clickable status badge with dropdown */}
                      <div className="relative" ref={openDropdown === d.id ? dropRef : null}>
                        <button
                          onClick={() => !isCooked && setOpenDropdown(openDropdown === d.id ? null : d.id)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-500'} ${
                            !isCooked ? 'cursor-pointer hover:ring-2 hover:ring-terracotta/30' : ''
                          }`}>
                          {d.status} {!isCooked && '▾'}
                        </button>
                        {openDropdown === d.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[130px]">
                            {STATUSES.map(s => (
                              <button key={s} onClick={() => {
                                onQuickStatus(d, s);
                                setOpenDropdown(null);
                              }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cream ${
                                d.status === s ? 'font-bold text-terracotta' : 'text-charcoal'
                              }`}>
                                {s === 'Not planned' && '⏸️ '}{s === 'Planned' && '📋 '}{s === 'In Progress' && '🔥 '}
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <PriorityBadge priority={d.priority} />
                      {d.country && <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30">{getCountryFlag(d.country)} {d.country}</span>}
                      {d.dish_type && <span className="text-xs px-2 py-0.5 rounded-full bg-light-gray/30">{getDishTypeEmoji(d.dish_type)} {d.dish_type}</span>}
                    </div>
                  </div>
                  {isActive && (
                    <p className="text-xs mt-2">
                      {av.unlinked ? <span className="text-amber-600">⚠️ Unlinked</span>
                        : av.canCook ? <span className="text-sage">✓ Ready</span>
                        : <span className="text-tomato">Missing: {[...av.missing?.map(m => m.name) || [], ...av.missingInts?.map(m => m.name) || []].join(', ')}</span>}
                    </p>
                  )}
                  {d.status === 'Not planned' && (
                    <p className="text-xs mt-2 text-warm-gray">⏸️ Not in shopping list</p>
                  )}
                  <div className="flex gap-1 mt-3 pt-3 border-t">
                    {isActive && (
                      <button onClick={() => onCook(d)} disabled={!av.canCook} className={`flex-1 py-1.5 rounded text-sm ${av.canCook ? 'text-sage hover:bg-sage/10' : 'text-light-gray cursor-not-allowed'}`}>Cook</button>
                    )}
                    <button onClick={() => onEdit(d)} className="p-1.5 rounded text-warm-gray hover:bg-light-gray/20"><EditIcon /></button>
                    <button onClick={() => onDelete(d)} className="p-1.5 rounded text-warm-gray hover:text-tomato"><DelIcon /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
