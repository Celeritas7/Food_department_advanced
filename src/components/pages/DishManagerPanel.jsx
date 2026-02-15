/**
 * DishManagerPanel.jsx — Notion-style table for bulk status management
 * Quick inline status toggle for all dishes, filterable by type/country
 */
import { useState, useMemo } from 'react';
import { PriorityBadge } from '../ui/Badges';
import { getDishTypeEmoji, getCountryFlag } from '../../config/emoji.js';

const STATUSES = ['Not planned', 'Planned', 'In Progress'];
const STATUS_CONFIG = {
  'Not planned': { bg: 'bg-gray-100', text: 'text-gray-500', icon: '⏸️' },
  'Planned': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📋' },
  'In Progress': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🔥' },
  'Cooked': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✅' },
};

export default function DishManagerPanel({ dishes, onQuickStatus, onClose }) {
  const [typeTab, setTypeTab] = useState('all');
  const [countryTab, setCountryTab] = useState('all');
  const [search, setSearch] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [selected, setSelected] = useState(new Set());

  // Get unique types and countries
  const types = useMemo(() => ['all', ...new Set(dishes.map(d => d.dish_type).filter(Boolean))].sort((a, b) => a === 'all' ? -1 : a.localeCompare(b)), [dishes]);
  const countries = useMemo(() => ['all', ...new Set(dishes.map(d => d.country).filter(Boolean))].sort((a, b) => a === 'all' ? -1 : a.localeCompare(b)), [dishes]);

  // Filter
  const filtered = useMemo(() => {
    let list = dishes.filter(d => d.status !== 'Cooked');
    if (typeTab !== 'all') list = list.filter(d => d.dish_type === typeTab);
    if (countryTab !== 'all') list = list.filter(d => d.country === countryTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q));
    }
    // Sort: In Progress > Planned > Not planned, then priority
    const order = { 'In Progress': 0, 'Planned': 1, 'Not planned': 2 };
    return list.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.priority - b.priority);
  }, [dishes, typeTab, countryTab, search]);

  // Selection helpers
  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(d => d.id)));
  };
  const applyBulk = async () => {
    if (!bulkStatus || !selected.size) return;
    const toUpdate = filtered.filter(d => selected.has(d.id) && d.status !== bulkStatus);
    for (const d of toUpdate) {
      await onQuickStatus(d, bulkStatus);
    }
    setSelected(new Set());
    setBulkStatus('');
  };

  // Status counts for current filter
  const counts = useMemo(() => {
    const c = { 'Not planned': 0, 'Planned': 0, 'In Progress': 0 };
    filtered.forEach(d => { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-cream/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-lg">📋 Manage Dish Status</h2>
            <p className="text-xs text-warm-gray">{filtered.length} dishes · Tap status to change</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-warm-gray text-lg">✕</button>
        </div>

        {/* Type tabs — horizontal scroll like Notion */}
        <div className="px-4 py-2 border-b flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
          {types.map(t => {
            const count = t === 'all' ? dishes.filter(d => d.status !== 'Cooked').length : dishes.filter(d => d.dish_type === t && d.status !== 'Cooked').length;
            return (
              <button key={t} onClick={() => { setTypeTab(t); setSelected(new Set()); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  typeTab === t ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border hover:border-gray-300'
                }`}>
                {t === 'all' ? '🍽️ All types' : `${getDishTypeEmoji(t)} ${t}`}
                <span className={`text-[10px] px-1.5 rounded-full ${typeTab === t ? 'bg-white/20' : 'bg-cream'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Country tabs */}
        <div className="px-4 py-2 border-b flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
          {countries.map(c => {
            const count = c === 'all'
              ? (typeTab === 'all' ? dishes.filter(d => d.status !== 'Cooked').length : dishes.filter(d => d.dish_type === typeTab && d.status !== 'Cooked').length)
              : dishes.filter(d => d.country === c && d.status !== 'Cooked' && (typeTab === 'all' || d.dish_type === typeTab)).length;
            return (
              <button key={c} onClick={() => { setCountryTab(c); setSelected(new Set()); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  countryTab === c ? 'bg-plum/80 text-white' : 'bg-white text-warm-gray border hover:border-gray-300'
                }`}>
                {c === 'all' ? '🌍 All countries' : `${getCountryFlag(c)} ${c}`}
                <span className={`text-[10px] px-1.5 rounded-full ${countryTab === c ? 'bg-white/20' : 'bg-cream'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Bulk toolbar */}
        <div className="px-4 py-2 border-b bg-cream/30 flex items-center gap-2 shrink-0 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search dishes..."
            className="px-3 py-1.5 rounded-lg border text-sm flex-1 min-w-[120px]" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-warm-gray">{selected.size} selected</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="px-2 py-1.5 rounded-lg border text-xs">
              <option value="">Bulk set...</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].icon} {s}</option>)}
            </select>
            <button onClick={applyBulk} disabled={!bulkStatus || !selected.size}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                bulkStatus && selected.size ? 'bg-terracotta text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
              Apply
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div className="px-4 py-2 flex gap-2 shrink-0">
          {Object.entries(counts).map(([s, c]) => (
            <span key={s} className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text}`}>
              {STATUS_CONFIG[s].icon} {s}: {c}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {/* Table header */}
          <div className="sticky top-0 bg-gray-50 border-b px-4 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold text-warm-gray uppercase tracking-wider">
            <div className="col-span-1 flex items-center">
              <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                onChange={selectAll} className="rounded" />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Cook Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-2">Country</div>
          </div>

          {/* Rows */}
          {!filtered.length ? (
            <p className="text-center py-12 text-warm-gray text-sm">No dishes match this filter</p>
          ) : (
            filtered.map(d => {
              const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG['Not planned'];
              const isSelected = selected.has(d.id);
              return (
                <div key={d.id} className={`px-4 py-2.5 grid grid-cols-12 gap-2 items-center border-b text-sm hover:bg-cream/50 transition-colors ${
                  isSelected ? 'bg-terracotta/5' : ''
                }`}>
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(d.id)} className="rounded" />
                  </div>

                  {/* Name */}
                  <div className="col-span-5 truncate font-medium text-charcoal">
                    {d.dish_type ? getDishTypeEmoji(d.dish_type) : '🍽️'} {d.name}
                  </div>

                  {/* Status — inline buttons */}
                  <div className="col-span-3 flex gap-1">
                    {STATUSES.map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const active = d.status === s;
                      return (
                        <button key={s} onClick={() => !active && onQuickStatus(d, s)}
                          className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                            active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-500'
                          }`}>
                          {cfg.icon}
                        </button>
                      );
                    })}
                  </div>

                  {/* Priority */}
                  <div className="col-span-1">
                    <PriorityBadge priority={d.priority} />
                  </div>

                  {/* Country */}
                  <div className="col-span-2 text-xs text-warm-gray truncate">
                    {d.country ? `${getCountryFlag(d.country)} ${d.country}` : '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-cream/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-warm-gray">
            💡 Tap ⏸️ 📋 🔥 icons to change status · Select multiple + bulk set for batch changes
          </p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-terracotta text-white text-sm font-medium">Done</button>
        </div>
      </div>
    </div>
  );
}
