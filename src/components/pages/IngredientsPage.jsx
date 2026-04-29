/**
 * IngredientsPage.jsx — Ingredients list with compact filter tabs
 * Only one filter group expands at a time to save screen space
 */
import { useState, useMemo } from 'react';
import { PkgIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import { SpoilageBadge, InheritedPriorityBadge } from '../ui/Badges';
import { getCatEmoji } from '../../config/emoji.js';

export default function IngredientsPage({ ingredients, onAdd, onEdit, onBuy, onDelete }) {
  const [activeFilterType, setActiveFilterType] = useState(null);
  const [catFilter, setCatFilter] = useState([]);
  const [stockFilter, setStockFilter] = useState([]);
  const [spoilFilter, setSpoilFilter] = useState([]);
  const [search, setSearch] = useState('');

  const catOptions = useMemo(() => {
    return [...new Set(ingredients.map(i => i.category).filter(Boolean))].sort();
  }, [ingredients]);

  const toggle = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const anyActive = catFilter.length + stockFilter.length + spoilFilter.length;

  const filtered = useMemo(() => {
    let list = ingredients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
    }
    if (catFilter.length) list = list.filter(i => catFilter.includes(i.category));
    if (stockFilter.length) {
      list = list.filter(i => {
        if (stockFilter.includes('in') && i.stock_qty > 0) return true;
        if (stockFilter.includes('out') && i.stock_qty <= 0) return true;
        return false;
      });
    }
    if (spoilFilter.length) list = list.filter(i => spoilFilter.includes(i._spoilage?.status));
    return list;
  }, [ingredients, search, catFilter, stockFilter, spoilFilter]);

  const grouped = useMemo(() => {
    // Within each category, push Expired and NearExpiry items to the top
    // (in that order), then everything else by name. Layout stays grouped
    // by category; only intra-group ordering changes.
    const spoilageRank = { Expired: 0, NearExpiry: 1, Fresh: 2, Unknown: 3 };
    const map = {};
    filtered.forEach(i => {
      const cat = i.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(i);
    });
    for (const items of Object.values(map)) {
      items.sort((a, b) => {
        const ra = spoilageRank[a._spoilage?.status] ?? 4;
        const rb = spoilageRank[b._spoilage?.status] ?? 4;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const filterTypes = [
    { key: 'cat', label: 'Category', count: catFilter.length },
    { key: 'stock', label: 'Stock', count: stockFilter.length },
    { key: 'fresh', label: 'Freshness', count: spoilFilter.length },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><PkgIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">📦 Ingredients</h1>
              <p className="text-sm text-warm-gray">{ingredients.length} items · {filtered.length} shown</p>
            </div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border mb-3">
          <span className="text-sm">🔍</span>
          <input placeholder="Search ingredients..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-warm-gray text-sm">✕</button>}
        </div>

        {/* Filter Tabs — compact, one expands at a time */}
        <div className="flex items-center gap-2 mb-2">
          {filterTypes.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilterType(activeFilterType === f.key ? null : f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeFilterType === f.key
                  ? 'bg-terracotta text-white border-terracotta'
                  : f.count > 0
                    ? 'bg-terracotta/10 text-terracotta border-terracotta/30'
                    : 'bg-white text-charcoal border-light-gray'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  activeFilterType === f.key ? 'bg-white/30 text-white' : 'bg-terracotta text-white'
                }`}>{f.count}</span>
              )}
              <span className={`text-[8px] opacity-60 transition-transform ${activeFilterType === f.key ? 'rotate-180' : ''}`}>▼</span>
            </button>
          ))}
          {anyActive > 0 && (
            <button
              onClick={() => { setCatFilter([]); setStockFilter([]); setSpoilFilter([]); setActiveFilterType(null); }}
              className="text-xs text-terracotta font-semibold hover:underline ml-1"
            >✕ Clear</button>
          )}
        </div>

        {/* Expanded filter chips — only one group at a time */}
        {activeFilterType === 'cat' && (
          <div className="flex gap-1.5 flex-wrap pb-3">
            {catOptions.map(c => (
              <button key={c} onClick={() => toggle(catFilter, setCatFilter, c)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  catFilter.includes(c)
                    ? 'bg-terracotta/10 text-terracotta border-terracotta/40'
                    : 'bg-white text-charcoal border-light-gray'
                }`}
              >{getCatEmoji(c)} {c}</button>
            ))}
          </div>
        )}
        {activeFilterType === 'stock' && (
          <div className="flex gap-1.5 pb-3">
            {[{ v: 'in', l: '✅ In Stock' }, { v: 'out', l: '❌ Out of Stock' }].map(o => (
              <button key={o.v} onClick={() => toggle(stockFilter, setStockFilter, o.v)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  stockFilter.includes(o.v)
                    ? 'bg-terracotta/10 text-terracotta border-terracotta/40'
                    : 'bg-white text-charcoal border-light-gray'
                }`}
              >{o.l}</button>
            ))}
          </div>
        )}
        {activeFilterType === 'fresh' && (
          <div className="flex gap-1.5 pb-3">
            {[{ v: 'Fresh', l: '🟢 Fresh' }, { v: 'NearExpiry', l: '🟡 Expiring' }, { v: 'Expired', l: '🔴 Expired' }].map(o => (
              <button key={o.v} onClick={() => toggle(spoilFilter, setSpoilFilter, o.v)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  spoilFilter.includes(o.v)
                    ? 'bg-terracotta/10 text-terracotta border-terracotta/40'
                    : 'bg-white text-charcoal border-light-gray'
                }`}
              >{o.l}</button>
            ))}
          </div>
        )}

        {/* Grouped list */}
        {!filtered.length ? (
          <p className="text-center py-16 text-warm-gray">{ingredients.length ? 'No matches' : 'No ingredients yet'}</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{getCatEmoji(cat)}</span>
                  <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">{cat}</h2>
                  <span className="text-xs text-warm-gray">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(i => (
                    <div key={i.id} className="bg-white rounded-xl border p-4 fade">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-sm flex items-center gap-1.5">
                            <span>{getCatEmoji(i.category)} {i.name}</span>
                            <InheritedPriorityBadge priority={i._inheritedPriority} />
                          </h3>
                          <p className={`text-sm ${i.stock_qty > 0 ? '' : 'text-tomato'}`}>{i.stock_qty} {i.unit}</p>
                        </div>
                        <SpoilageBadge status={i._spoilage?.status} daysRemaining={i._spoilage?.daysRemaining} />
                      </div>
                      <p className="text-xs text-warm-gray mt-1">Shelf: {i.shelf_life_days}d</p>
                      <div className="flex gap-1 mt-3 pt-3 border-t">
                        <button onClick={() => onBuy(i)} className="flex-1 py-1.5 rounded text-sm text-terracotta hover:bg-terracotta/10">Buy</button>
                        <button onClick={() => onEdit(i)} className="p-1.5 rounded text-warm-gray hover:bg-light-gray/20"><EditIcon /></button>
                        <button onClick={() => onDelete(i)} className="p-1.5 rounded text-warm-gray hover:text-tomato"><DelIcon /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
