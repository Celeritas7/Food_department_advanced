import { useState, useMemo } from 'react';
import { DishIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import { PriorityBadge } from '../ui/Badges';

export default function DishesPage({ dishes, onAdd, onEdit, onCook, onDelete }) {
  const [filter, setFilter] = useState('active');

  const filtered = useMemo(() => {
    let list = dishes;
    if (filter === 'active') list = list.filter(d => d.status !== 'Cooked');
    else if (filter === 'ready') list = list.filter(d => d.status !== 'Cooked' && d._availability?.canCook);
    else if (filter === 'cooked') list = list.filter(d => d.status === 'Cooked');
    return list.sort((a, b) => {
      if (a.status === 'Cooked' && b.status !== 'Cooked') return 1;
      if (a.status !== 'Cooked' && b.status === 'Cooked') return -1;
      return a.priority - b.priority;
    });
  }, [dishes, filter]);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><DishIcon /></div>
            <div><h1 className="font-semibold text-xl">Dishes</h1><p className="text-sm text-warm-gray">Plan & cook</p></div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {['active', 'ready', 'all', 'cooked'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-terracotta text-white' : 'bg-white text-warm-gray'}`}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {!filtered.length ? (
          <p className="text-center py-16 text-warm-gray">{dishes.length ? 'No matches' : 'No dishes yet'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => {
              const isActive = d.status !== 'Cooked';
              const av = d._availability || {};
              return (
                <div key={d.id} className={`bg-white rounded-xl border p-4 fade ${!isActive && 'opacity-60'}`}>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{d.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'Cooked' ? 'bg-sage/20 text-sage' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                        <PriorityBadge priority={d.priority} />
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <p className="text-xs mt-2">
                      {av.unlinked ? <span className="text-amber-600">⚠️ Unlinked</span>
                        : av.canCook ? <span className="text-sage">✓ Ready</span>
                        : <span className="text-tomato">Missing: {[...av.missing?.map(m => m.name) || [], ...av.missingInts?.map(m => m.name) || []].join(', ')}</span>}
                    </p>
                  )}
                  {d.country && <p className="text-xs text-warm-gray mt-1">{d.country}</p>}
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
