/**
 * IngredientsPage.jsx — Ingredients list with emoji + multi-filter
 */
import { useState, useMemo } from 'react';
import { PkgIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import { SpoilageBadge } from '../ui/Badges';
import FilterBar from '../ui/FilterBar';
import { getCatEmoji } from '../../config/emoji.js';

export default function IngredientsPage({ ingredients, onAdd, onEdit, onBuy, onDelete }) {
  const [catFilter, setCatFilter] = useState([]);
  const [stockFilter, setStockFilter] = useState([]);
  const [spoilFilter, setSpoilFilter] = useState([]);
  const [search, setSearch] = useState('');

  // Build dynamic filter options from data
  const catOptions = useMemo(() => {
    const cats = [...new Set(ingredients.map(i => i.category).filter(Boolean))].sort();
    return cats.map(c => ({
      value: c, label: c, emoji: getCatEmoji(c),
      count: ingredients.filter(i => i.category === c).length,
    }));
  }, [ingredients]);

  const stockOptions = [
    { value: 'in', label: 'In Stock', emoji: '✅' },
    { value: 'out', label: 'Out of Stock', emoji: '❌' },
  ];

  const spoilOptions = [
    { value: 'Fresh', label: 'Fresh', emoji: '🟢' },
    { value: 'NearExpiry', label: 'Expiring', emoji: '🟡' },
    { value: 'Expired', label: 'Expired', emoji: '🔴' },
  ];

  const toggleFilter = (arr, setArr) => (val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

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

  // Group by category
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(i => {
      const cat = i.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(i);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

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
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border mb-4">
          <span className="text-sm">🔍</span>
          <input placeholder="Search ingredients..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-warm-gray text-sm">✕</button>}
        </div>

        {/* Filters */}
        <FilterBar label="Category" filters={catOptions} active={catFilter} onToggle={toggleFilter(catFilter, setCatFilter)} />
        <FilterBar label="Stock" filters={stockOptions} active={stockFilter} onToggle={toggleFilter(stockFilter, setStockFilter)} />
        <FilterBar label="Freshness" filters={spoilOptions} active={spoilFilter} onToggle={toggleFilter(spoilFilter, setSpoilFilter)} />

        {(catFilter.length > 0 || stockFilter.length > 0 || spoilFilter.length > 0) && (
          <button onClick={() => { setCatFilter([]); setStockFilter([]); setSpoilFilter([]); }} className="text-xs text-terracotta font-medium mb-4 hover:underline">✕ Clear all filters</button>
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
                          <h3 className="font-semibold text-sm">{getCatEmoji(i.category)} {i.name}</h3>
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
