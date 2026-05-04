/**
 * PrepsPage.jsx — Preparations with emoji, category/status filters
 */
import { useState, useMemo } from 'react';
import { LayerIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import FilterBar from '../ui/FilterBar';
import { getCatEmoji } from '../../config/emoji.js';

export default function PrepsPage({ intermediates, ingredients, intIngredients, onAdd, onEdit, onPrepare, onDelete }) {
  const [catFilter, setCatFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);

  const toggleFilter = (arr, setArr) => (val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const catOptions = useMemo(() => {
    const cats = [...new Set(intermediates.map(t => t.category).filter(Boolean))].sort();
    return cats.map(c => ({ value: c, label: c, emoji: getCatEmoji(c) }));
  }, [intermediates]);

  const statusOptions = [
    { value: 'ready', label: 'Ready', emoji: '✅' },
    { value: 'missing', label: 'Missing', emoji: '❌' },
  ];

  const filtered = useMemo(() => {
    let list = intermediates;
    if (catFilter.length) list = list.filter(t => catFilter.includes(t.category));
    if (statusFilter.length) {
      list = list.filter(t => {
        if (statusFilter.includes('ready') && t._availability?.canPrepare) return true;
        if (statusFilter.includes('missing') && !t._availability?.canPrepare) return true;
        return false;
      });
    }
    return list;
  }, [intermediates, catFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple"><LayerIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">🧑‍🍳 Preparations</h1>
              <p className="text-sm text-warm-gray">Dough, sauces... · {filtered.length} shown</p>
            </div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-purple text-white"><PlusIcon /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {catOptions.length > 0 && (
          <FilterBar label="Category" filters={catOptions} active={catFilter} onToggle={toggleFilter(catFilter, setCatFilter)} />
        )}
        <FilterBar label="Status" filters={statusOptions} active={statusFilter} onToggle={toggleFilter(statusFilter, setStatusFilter)} />

        {(catFilter.length > 0 || statusFilter.length > 0) && (
          <button onClick={() => { setCatFilter([]); setStatusFilter([]); }} className="text-xs text-purple font-medium mb-4 hover:underline">✕ Clear filters</button>
        )}

        {!filtered.length ? (
          <p className="text-center py-16 text-warm-gray">{intermediates.length ? 'No matches' : 'No preparations yet'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => {
              const inputs = intIngredients.filter(ii => ii.intermediate_id === t.id);
              const inputNames = inputs.map(ii => {
                const ig = ingredients.find(i => i.id === ii.ingredient_id);
                return ig ? `${getCatEmoji(ig.category)} ${ig.name}` : '';
              }).filter(Boolean).join(', ');
              return (
                <div key={t.id} className="bg-white rounded-xl border border-purple/30 p-4 fade">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className={`text-sm ${t.stock_qty > 0 ? '' : 'text-tomato'}`}>{t.stock_qty} {t.unit}</p>
                    </div>
                    {t._availability?.unlinked ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Unlinked</span>
                    ) : t._availability?.canPrepare ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">Ready</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Missing</span>
                    )}
                  </div>
                  {t.category && <p className="text-xs text-warm-gray mt-1">{getCatEmoji(t.category)} {t.category}</p>}
                  <p className="text-xs text-warm-gray mt-1 line-clamp-2">Inputs: {inputNames || 'None'}</p>
                  <div className="flex gap-1 mt-3 pt-3 border-t">
                    <button onClick={() => onPrepare(t)} disabled={!t._availability?.canPrepare} className={`flex-1 py-1.5 rounded text-sm ${t._availability?.canPrepare ? 'text-purple hover:bg-purple/10' : 'text-light-gray cursor-not-allowed'}`}>Prepare</button>
                    <button onClick={() => onEdit(t)} className="p-1.5 rounded text-warm-gray hover:bg-light-gray/20"><EditIcon /></button>
                    <button onClick={() => onDelete(t)} className="p-1.5 rounded text-warm-gray hover:text-tomato"><DelIcon /></button>
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
