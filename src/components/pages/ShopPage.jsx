/**
 * ShopPage.jsx — Shopping list with three tabs:
 *  1. To Buy — missing ingredients for Planned/In Progress dishes
 *  2. In Stock — ingredients you have (review & verify)
 *  3. Use It Up — expiring ingredients + recipe suggestions
 */
import { useState, useMemo } from 'react';
import { CartIcon } from '../ui/Icons';
import { PriorityBadge } from '../ui/Badges';
import { getCatEmoji } from '../../config/emoji.js';

export default function ShopPage({ shoppingList, ingredients, dishes, dishIngs, onBuy }) {
  const [tab, setTab] = useState('buy');
  const [catFilter, setCatFilter] = useState([]);

  const toBuyItems = useMemo(() => shoppingList.list.filter(i => i.toBuy), [shoppingList]);
  const inStockItems = useMemo(() => shoppingList.list.filter(i => !i.toBuy), [shoppingList]);

  // Expiry: ingredients with stock > 0 that are Expired or NearExpiry
  const expiringItems = useMemo(() => {
    return ingredients
      .filter(i => i.stock_qty > 0 && i._spoilage && (i._spoilage.status === 'Expired' || i._spoilage.status === 'NearExpiry'))
      .sort((a, b) => (a._spoilage.daysRemaining ?? 999) - (b._spoilage.daysRemaining ?? 999));
  }, [ingredients]);

  // Recipes that use expiring ingredients
  const expiryRecipes = useMemo(() => {
    if (!expiringItems.length) return [];
    const expiringIds = new Set(expiringItems.map(i => i.id));
    const activeDishes = dishes.filter(d => d.status !== 'Cooked');

    return activeDishes
      .map(d => {
        const myIngs = dishIngs.filter(di => di.dish_id === d.id);
        const usesExpiring = myIngs.filter(di => expiringIds.has(di.ingredient_id));
        if (!usesExpiring.length) return null;
        const expiringNames = usesExpiring.map(di => {
          const ig = ingredients.find(i => i.id === di.ingredient_id);
          return ig?.name || '?';
        });
        return {
          ...d,
          expiringCount: usesExpiring.length,
          expiringNames,
          totalIngs: myIngs.length,
          canCook: d._availability?.canCook || false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.expiringCount - a.expiringCount || (a.canCook ? -1 : 1));
  }, [expiringItems, dishes, dishIngs, ingredients]);

  // Category filter options for current tab
  const currentItems = tab === 'buy' ? toBuyItems : tab === 'stock' ? inStockItems : [];
  const catOptions = useMemo(() => {
    const cats = [...new Set(currentItems.map(i => i.category).filter(Boolean))].sort();
    return cats;
  }, [currentItems]);

  const filteredItems = useMemo(() => {
    if (!catFilter.length) return currentItems;
    return currentItems.filter(i => catFilter.includes(i.category));
  }, [currentItems, catFilter]);

  const toggleCat = (c) => setCatFilter(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]);

  const tabs = [
    { key: 'buy', label: 'To Buy', count: toBuyItems.length, color: 'bg-tomato' },
    { key: 'stock', label: 'In Stock', count: inStockItems.length, color: 'bg-sage' },
    { key: 'expiry', label: 'Use It Up', count: expiringItems.length, color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><CartIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">🛒 Shopping</h1>
              <p className="text-sm text-warm-gray">For Planned &amp; In Progress dishes only</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setCatFilter([]); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                  tab === t.key ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border'
                }`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20 text-white' : `${t.color}/10 text-charcoal/60`
                }`}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">

        {/* ─── To Buy / In Stock tabs ─── */}
        {(tab === 'buy' || tab === 'stock') && (
          <>
            {/* Category pills */}
            {catOptions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {catOptions.map(c => (
                  <button key={c} onClick={() => toggleCat(c)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      catFilter.includes(c) ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-warm-gray border-light-gray'
                    }`}>
                    {getCatEmoji(c)} {c}
                  </button>
                ))}
                {catFilter.length > 0 && (
                  <button onClick={() => setCatFilter([])} className="text-xs text-terracotta font-medium px-2 py-1">✕ Clear</button>
                )}
              </div>
            )}

            {!filteredItems.length ? (
              <p className="text-center py-16 text-warm-gray">
                {tab === 'buy' ? '🎉 Nothing to buy! All ingredients in stock.' : 'No in-stock ingredients for planned dishes.'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <div key={item.id} className={`bg-white rounded-xl border p-4 ${
                    tab === 'buy' ? 'border-tomato/20' : 'border-sage/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {getCatEmoji(item.category)} {item.name}
                          </h3>
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <div className="flex gap-3 text-xs mt-1 text-warm-gray">
                          <span>Have: <b className={item.stock > 0 ? 'text-sage' : 'text-tomato'}>{item.stock}</b> {item.unit}</span>
                          <span>Need: <b>{item.needed}</b> {item.unit}</span>
                          {item.deficit > 0 && <span className="text-tomato font-semibold">Buy: {item.deficit}</span>}
                        </div>
                        {item.usedIn?.length > 0 && (
                          <p className="text-[10px] text-warm-gray mt-1 truncate">
                            Used in: {item.usedIn.join(', ')}
                          </p>
                        )}
                      </div>
                      {tab === 'buy' && (
                        <button onClick={() => {
                          const ig = ingredients.find(x => x.id === item.id);
                          if (ig) onBuy(ig, item.deficit);
                        }} className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-xs font-medium shrink-0">
                          Buy
                        </button>
                      )}
                      {tab === 'stock' && (
                        <div className="text-xs px-2.5 py-1 rounded-full bg-sage/10 text-sage font-medium shrink-0">
                          ✓ Have
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Use It Up tab ─── */}
        {tab === 'expiry' && (
          <>
            {!expiringItems.length ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-warm-gray">Nothing expiring soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Expiring ingredients strip */}
                <div>
                  <h3 className="text-sm font-semibold text-charcoal mb-2">⚠️ Expiring Ingredients ({expiringItems.length})</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {expiringItems.map(ig => {
                      const sp = ig._spoilage;
                      const isExpired = sp?.status === 'Expired';
                      return (
                        <div key={ig.id} className={`shrink-0 w-28 p-2.5 rounded-xl border text-center ${
                          isExpired ? 'bg-tomato/5 border-tomato/30' : 'bg-amber-50 border-amber-300/50'
                        }`}>
                          <span className="text-lg">{getCatEmoji(ig.category)}</span>
                          <p className="text-xs font-semibold mt-1 truncate">{ig.name}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${isExpired ? 'text-tomato' : 'text-amber-600'}`}>
                            {isExpired ? `Expired ${Math.abs(sp.daysRemaining)}d ago` : `${sp.daysRemaining}d left`}
                          </p>
                          <p className="text-[10px] text-warm-gray">{ig.stock_qty} {ig.unit} left</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recipe suggestions */}
                {expiryRecipes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-2">🍳 Cook These to Avoid Waste</h3>
                    <div className="space-y-2">
                      {expiryRecipes.map(d => (
                        <div key={d.id} className="bg-white rounded-xl border p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{d.name}</h4>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{d.status}</span>
                                {d.country && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-warm-gray">{d.country}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {d.expiringNames.map((n, j) => (
                                  <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    ⏰ {n}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                d.canCook ? 'bg-sage/10 text-sage' : 'bg-tomato/10 text-tomato'
                              }`}>
                                {d.canCook ? '✓ Ready' : `Need ${d.totalIngs - d.expiringCount} more`}
                              </div>
                              <p className="text-[10px] text-warm-gray mt-1">
                                Uses {d.expiringCount}/{d.totalIngs} expiring
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!expiryRecipes.length && expiringItems.length > 0 && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <p className="text-sm text-amber-800">
                      No recipes currently use these expiring ingredients. Consider adding dishes that use them!
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
