/**
 * IngredientPicker.jsx — Category-tabbed ingredient selection modal
 * Used by DishForm and IntermediateForm
 */
import { useState, useMemo } from 'react';
import { getCatEmoji } from '../../config/emoji.js';
import { XIcon } from './Icons';

export default function IngredientPicker({ ingredients, onClose, onConfirm, initialSelected = [], title = 'Pick Ingredients', qtyLabel = 'qty' }) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [selected, setSelected] = useState(() => {
    const m = {};
    initialSelected.forEach(s => { m[s.id] = s.qty || 1; });
    return m;
  });

  // Build categories from data
  const categories = useMemo(() => {
    const cats = [...new Set(ingredients.map(i => i.category).filter(Boolean))].sort();
    // If not initialized, set first category
    if (!activeCat && cats.length && !search) setActiveCat(cats[0]);
    return cats;
  }, [ingredients]);

  // Visible list: when searching show all matches, otherwise show active category
  const visible = useMemo(() => {
    let list = ingredients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
    } else if (activeCat) {
      list = list.filter(i => i.category === activeCat);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients, search, activeCat]);

  // Selected count per category
  const selPerCat = useMemo(() => {
    const m = {};
    Object.keys(selected).forEach(id => {
      const ing = ingredients.find(i => i.id === id);
      if (ing) m[ing.category] = (m[ing.category] || 0) + 1;
    });
    return m;
  }, [selected, ingredients]);

  const count = Object.keys(selected).length;

  const toggle = (id) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[id] !== undefined) delete n[id];
      else n[id] = 1;
      return n;
    });
  };

  const setQty = (id, qty) => {
    setSelected(prev => ({ ...prev, [id]: Math.max(0.1, Number(qty) || 1) }));
  };

  const handleConfirm = () => {
    const result = Object.entries(selected).map(([id, qty]) => {
      const ing = ingredients.find(i => i.id === id);
      return { id, name: ing?.name, category: ing?.category, qty };
    });
    onConfirm(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-cream rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden fade">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b bg-cream">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-lg">🥘 {title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-warm-gray hover:bg-light-gray/30"><XIcon /></button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border mb-3">
            <span className="text-sm">🔍</span>
            <input
              placeholder="Search ingredients..."
              value={search}
              onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveCat(null); }}
              className="flex-1 text-sm bg-transparent outline-none"
            />
            {search && <button onClick={() => { setSearch(''); if (categories.length) setActiveCat(categories[0]); }} className="text-warm-gray text-sm">✕</button>}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => {
              const isActive = activeCat === cat && !search;
              const cnt = selPerCat[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCat(cat); setSearch(''); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                    isActive ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-charcoal border-light-gray'
                  }`}
                >
                  <span>{getCatEmoji(cat)}</span>
                  {cat}
                  {cnt > 0 && (
                    <span className={`text-[10px] min-w-[16px] text-center px-1 rounded-full font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-terracotta text-white'}`}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Section header */}
          {activeCat && !search && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{getCatEmoji(activeCat)}</span>
              <span className="text-sm font-bold text-charcoal">{activeCat}</span>
              <span className="text-xs text-warm-gray">— {visible.length} items</span>
            </div>
          )}
          {search && (
            <p className="text-xs text-warm-gray mb-3">Results for "{search}" — {visible.length} found</p>
          )}

          {/* Items */}
          <div className="space-y-2">
            {visible.map(ing => {
              const isSel = selected[ing.id] !== undefined;
              return (
                <div
                  key={ing.id}
                  onClick={() => toggle(ing.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-all ${
                    isSel ? 'bg-terracotta/5 border-terracotta/40' : 'bg-white border-light-gray hover:border-warm-gray'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                    isSel ? 'bg-terracotta border-terracotta' : 'bg-white border-warm-gray/40'
                  }`}>
                    {isSel && <span className="text-white text-xs font-bold">✓</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-charcoal truncate">
                      {getCatEmoji(ing.category)} {ing.name}
                    </div>
                    <div className="text-xs text-warm-gray flex items-center gap-1.5 mt-0.5">
                      Stock: {ing.stock_qty > 0
                        ? <span className="text-sage font-medium">{ing.stock_qty} {ing.unit}</span>
                        : <span className="text-tomato font-medium">Out</span>
                      }
                      {ing._spoilage?.status === 'NearExpiry' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-butter/40 text-yellow-700">⚠ {ing._spoilage.daysRemaining}d</span>}
                      {ing._spoilage?.status === 'Expired' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-tomato/10 text-tomato">Expired</span>}
                    </div>
                  </div>

                  {/* Qty */}
                  {isSel && (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        value={selected[ing.id]}
                        onChange={e => setQty(ing.id, e.target.value)}
                        className="w-14 px-2 py-1.5 rounded-lg border text-center text-sm font-semibold"
                      />
                      <span className="text-xs text-warm-gray">{ing.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {visible.length === 0 && (
            <div className="text-center py-12 text-warm-gray">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm">{search ? `No results for "${search}"` : 'No ingredients in this category'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex justify-between items-center">
          <div>
            <span className="text-sm font-semibold text-charcoal">{count} selected</span>
            {count > 0 && (
              <div className="text-[11px] text-warm-gray mt-0.5">
                {Object.entries(selPerCat).map(([cat, n]) => `${getCatEmoji(cat)}${n}`).join('  ')}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-medium">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={count === 0}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${count > 0 ? 'bg-terracotta' : 'bg-light-gray cursor-not-allowed'}`}
            >
              Add ({count})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
