/**
 * ShopPage.jsx — Shopping list with Layout B + three tabs:
 *  1. To Buy — dish cards + aggregated shopping list + ready to cook
 *  2. In Stock — review ingredients you have for planned dishes
 *  3. Use It Up — expiring ingredients + recipe suggestions
 */
import { useState, useMemo } from 'react';
import { CartIcon } from '../ui/Icons';
import { PriorityBadge } from '../ui/Badges';
import { getCatEmoji, getIngredientEmoji } from '../../config/emoji.js';

const GENERAL_CATEGORIES = ['Stationery', 'Cleaning', 'Personal', 'Household', 'Electronics', 'Daily Need', 'Other'];
const GENERAL_CAT_STYLES = {
  Stationery:    'bg-purple/10 text-purple',
  Cleaning:      'bg-sage/15 text-sage',
  Personal:      'bg-terracotta/10 text-terracotta',
  Household:     'bg-amber-100 text-amber-700',
  Electronics:   'bg-cyan-100 text-cyan-700',
  'Daily Need':  'bg-blue-100 text-blue-700',
  Other:         'bg-light-gray/30 text-warm-gray',
};

// Mirror DishesPage priority-as-color (kept inline to avoid touching other files).
const PRIORITY_COLORS = {
  high:   { bg: '#FFF1EA', border: '#D97757' },
  normal: { bg: '#FAF4E8', border: '#C4B697' },
  low:    { bg: '#F0F7F1', border: '#7AAD89' },
};
function priorityVariant(p) {
  if (p == null) return 'normal';
  if (p <= 2) return 'high';
  if (p === 3) return 'normal';
  return 'low';
}
function priorityCardStyle(p) {
  const v = PRIORITY_COLORS[priorityVariant(p)];
  return { backgroundColor: v.bg, borderLeft: `4px solid ${v.border}` };
}

export default function ShopPage({ shoppingList, ingredients, dishes, dishIngs, dishInts, intermediates, onBuy, onCook, generalShoppingItems = [], onAddGeneral, onToggleGeneral, onDeleteGeneral }) {
  const [topTab, setTopTabRaw] = useState(() => {
    try { return localStorage.getItem('fd_shop_top_tab') === 'general' ? 'general' : 'groceries'; } catch { return 'groceries'; }
  });
  const setTopTab = (v) => { setTopTabRaw(v); try { localStorage.setItem('fd_shop_top_tab', v); } catch {} };
  const [tab, setTab] = useState('buy');
  const [expandedDishId, setExpandedDishId] = useState(null);
  const [catFilter, setCatFilter] = useState([]);
  const [generalAddOpen, setGeneralAddOpen] = useState(false);
  const [genName, setGenName] = useState('');
  const [genQty, setGenQty] = useState('');
  const [genCat, setGenCat] = useState('Other');

  // id → full ingredient row, used so shopping-list entries (which don't carry
  // the emoji column) can still resolve a per-ingredient emoji.
  const ingById = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);

  const generalSorted = useMemo(() => {
    // Unchecked first (newest at top); checked items fall to the bottom.
    const unchecked = generalShoppingItems.filter(i => !i.checked);
    const checked = generalShoppingItems.filter(i => i.checked);
    return [...unchecked, ...checked];
  }, [generalShoppingItems]);
  const checkedCount = generalShoppingItems.filter(i => i.checked).length;

  const submitGeneral = () => {
    const name = genName.trim();
    if (!name) return;
    onAddGeneral?.(name, genCat, genQty.trim());
    setGenName('');
    setGenQty('');
    setGenCat('Other');
    setGeneralAddOpen(false);
  };

  const clearChecked = () => {
    generalShoppingItems.filter(i => i.checked).forEach(i => onDeleteGeneral?.(i.id));
  };

  // Reminders that have come due (reminder_next_due is a DATE string
  // 'YYYY-MM-DD' from Postgres; lexical compare against today is correct).
  const dueReminders = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return ingredients
      .filter(i => i.has_reminder && i.reminder_next_due && i.reminder_next_due <= todayStr)
      .map(i => {
        const overdue = Math.floor((new Date(todayStr) - new Date(i.reminder_next_due)) / 86400000);
        return { i, overdue };
      })
      .sort((a, b) => b.overdue - a.overdue);
  }, [ingredients]);

  const toBuyItems = useMemo(() => shoppingList.list.filter(i => i.toBuy), [shoppingList]);
  const inStockItems = useMemo(() => shoppingList.list.filter(i => !i.toBuy), [shoppingList]);

  // Build planned dish cards with ingredient details
  const plannedDishCards = useMemo(() => {
    const active = dishes.filter(d => d.status === 'In Progress');
    return active.map(d => {
      const myIngs = dishIngs.filter(di => di.dish_id === d.id);
      const ingDetails = myIngs.map(di => {
        const ig = ingredients.find(i => i.id === di.ingredient_id);
        if (!ig) return null;
        return {
          name: ig.name, category: ig.category, qty: di.qty,
          unit: di.unit_override || ig.unit || 'g',
          have: ig.stock_qty, missing: ig.stock_qty < di.qty,
        };
      }).filter(Boolean);
      const missingCount = ingDetails.filter(i => i.missing).length;
      const canCook = d._availability?.canCook || false;
      return { ...d, ingDetails, missingCount, haveCount: ingDetails.length - missingCount, canCook };
    }).sort((a, b) => a.canCook !== b.canCook ? (a.canCook ? -1 : 1) : a.priority - b.priority);
  }, [dishes, dishIngs, ingredients]);

  const readyDishes = useMemo(() => plannedDishCards.filter(d => d.canCook), [plannedDishCards]);
  const needBuyDishes = useMemo(() => plannedDishCards.filter(d => !d.canCook), [plannedDishCards]);

  // Expiry data
  const expiringItems = useMemo(() => {
    return ingredients
      .filter(i => i.stock_qty > 0 && i._spoilage && (i._spoilage.status === 'Expired' || i._spoilage.status === 'NearExpiry'))
      .sort((a, b) => (a._spoilage.daysRemaining ?? 999) - (b._spoilage.daysRemaining ?? 999));
  }, [ingredients]);

  const expiryRecipes = useMemo(() => {
    if (!expiringItems.length) return [];
    const expiringIds = new Set(expiringItems.map(i => i.id));
    const activeDishes = dishes.filter(d => d.status !== 'Cooked');
    return activeDishes.map(d => {
      const myIngs = dishIngs.filter(di => di.dish_id === d.id);
      const usesExpiring = myIngs.filter(di => expiringIds.has(di.ingredient_id));
      if (!usesExpiring.length) return null;
      const expiringNames = usesExpiring.map(di => {
        const ig = ingredients.find(i => i.id === di.ingredient_id);
        return ig?.name || '?';
      });
      return { ...d, expiringCount: usesExpiring.length, expiringNames, totalIngs: myIngs.length, canCook: d._availability?.canCook || false };
    }).filter(Boolean).sort((a, b) => b.expiringCount - a.expiringCount || (a.canCook ? -1 : 1));
  }, [expiringItems, dishes, dishIngs, ingredients]);

  // Category filter for In Stock tab
  const inStockCats = useMemo(() => [...new Set(inStockItems.map(i => i.category).filter(Boolean))].sort(), [inStockItems]);
  const filteredInStock = catFilter.length ? inStockItems.filter(i => catFilter.includes(i.category)) : inStockItems;
  const toggleCat = (c) => setCatFilter(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]);

  const tabs = [
    { key: 'buy', label: 'To Buy', count: toBuyItems.length, dot: 'bg-red-500' },
    { key: 'stock', label: 'In Stock', count: inStockItems.length, dot: 'bg-emerald-500' },
    { key: 'expiry', label: 'Use It Up', count: expiringItems.length, dot: 'bg-amber-500' },
  ];

  // Completion ring SVG
  const Ring = ({ pct, size = 32, color = '#f97316' }) => {
    const r = 15.9155;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" style={{ width: size, height: size }} viewBox="0 0 36 36">
          <path d={`M18 2.0845 a ${r} ${r} 0 0 1 0 31.831 a ${r} ${r} 0 0 1 0 -31.831`}
            fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
          <path d={`M18 2.0845 a ${r} ${r} 0 0 1 0 31.831 a ${r} ${r} 0 0 1 0 -31.831`}
            fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${pct}, 100`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-charcoal">{pct}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><CartIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">🛒 Shopping</h1>
              <p className="text-sm text-warm-gray">{topTab === 'groceries' ? 'In Progress dishes only' : 'Non-food items'}</p>
            </div>
          </div>
          {/* Top-level Groceries | General toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setTopTab('groceries')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                topTab === 'groceries' ? 'bg-terracotta text-white shadow-md' : 'bg-white text-warm-gray border'
              }`}
              aria-pressed={topTab === 'groceries'}
            >🥕 Groceries</button>
            <button
              onClick={() => setTopTab('general')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                topTab === 'general' ? 'bg-terracotta text-white shadow-md' : 'bg-white text-warm-gray border'
              }`}
              aria-pressed={topTab === 'general'}
            >🧴 General</button>
          </div>
          {topTab === 'groceries' && (
            <div className="flex gap-2">
              {tabs.map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setCatFilter([]); setExpandedDishId(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    tab === t.key ? 'bg-terracotta text-white shadow-md' : 'bg-white text-warm-gray border'
                  }`}>
                  {t.label}
                  <span className={`text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 ${
                    tab === t.key ? 'bg-white/20' : 'bg-cream'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">

        {topTab === 'groceries' && <>
        {/* ═══════════ TO BUY TAB — Layout B ═══════════ */}
        {tab === 'buy' && (
          <div className="space-y-5">
            {/* ─── Reminders due (restock prompts from past purchases) ─── */}
            {dueReminders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-charcoal/60 uppercase tracking-wide mb-2">🔔 Reminders Due ({dueReminders.length})</h3>
                <div className="space-y-2">
                  {dueReminders.map(({ i, overdue }) => (
                    <div key={i.id} className="bg-white rounded-xl border border-amber-300/50 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{getIngredientEmoji(i)} {i.name}</h4>
                          <div className="flex gap-3 text-xs mt-1 text-warm-gray">
                            <span>Have: <b className={i.stock_qty > 0 ? 'text-sage' : 'text-tomato'}>{i.stock_qty}</b> {i.unit}</span>
                            <span className={overdue > 0 ? 'text-tomato font-semibold' : 'text-amber-600 font-semibold'}>
                              {overdue <= 0 ? 'Due today' : `${overdue}d overdue`}
                            </span>
                            {i.purchased_at && (
                              <span>Bought {Math.floor((Date.now() - new Date(i.purchased_at).getTime()) / 86400000)}d ago</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => onBuy(i)} className="px-3.5 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold shrink-0">
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* No planned dishes */}
            {!plannedDishCards.length ? (
              <p className="text-center py-16 text-warm-gray">Plan some dishes first to see your shopping list</p>
            ) : (
              <>
                {/* ─── Dish cards horizontal scroll ─── */}
                <div>
                  <h3 className="text-xs font-bold text-charcoal/60 uppercase tracking-wide mb-2">🔥 In Progress Dishes ({plannedDishCards.length})</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {plannedDishCards.map(dish => {
                      const total = dish.ingDetails.length || 1;
                      const pct = Math.round((dish.haveCount / total) * 100);
                      const isSelected = expandedDishId === dish.id;
                      return (
                        <div key={dish.id} onClick={() => setExpandedDishId(isSelected ? null : dish.id)}
                          className={`shrink-0 w-40 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? 'border-terracotta ring-2 ring-terracotta/20' :
                            dish.canCook ? 'border-sage/50 bg-sage/5' : 'border-light-gray bg-white'
                          }`}>
                          <p className="text-xs font-semibold truncate text-charcoal">{dish.name}</p>
                          <div className="flex gap-1 mt-1.5">
                            <PriorityBadge priority={dish.priority} />
                            {dish.country && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream text-warm-gray truncate max-w-[60px]">{dish.country}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Ring pct={pct} color={dish.canCook ? '#22c55e' : '#f97316'} />
                            <div>
                              <p className={`text-[10px] font-bold ${dish.canCook ? 'text-sage' : 'text-terracotta'}`}>
                                {dish.canCook ? 'Ready!' : `${dish.missingCount} missing`}
                              </p>
                              <p className="text-[9px] text-warm-gray">{total} ingredients</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded dish detail panel */}
                  {expandedDishId && (() => {
                    const dish = plannedDishCards.find(d => d.id === expandedDishId);
                    if (!dish) return null;
                    return (
                      <div className="mt-2 bg-white rounded-xl border border-terracotta/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">{dish.name}</h4>
                          <button onClick={() => setExpandedDishId(null)} className="text-xs text-warm-gray hover:text-charcoal">✕ Close</button>
                        </div>
                        <div className="space-y-1">
                          {dish.ingDetails.map((ig, i) => (
                            <div key={i} className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg ${
                              ig.missing ? 'bg-tomato/5' : 'bg-sage/5'
                            }`}>
                              <span>{ig.missing ? '❌' : '✅'}</span>
                              <span className="flex-1 truncate">{getIngredientEmoji(ig)} {ig.name}</span>
                              <span className="text-warm-gray whitespace-nowrap">need {ig.qty} {ig.unit}</span>
                              <span className={`font-medium whitespace-nowrap ${ig.missing ? 'text-tomato' : 'text-sage'}`}>
                                have {ig.have}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ─── Aggregated Shopping List ─── */}
                {toBuyItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-tomato uppercase tracking-wide">🛒 Shopping List</h3>
                      <span className="text-xs text-warm-gray">{toBuyItems.length} items</span>
                    </div>
                    <div className="space-y-2">
                      {toBuyItems.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-tomato/15 p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm truncate">{getIngredientEmoji(ingById.get(item.id) || item)} {item.name}</h4>
                                <PriorityBadge priority={item.priority} />
                              </div>
                              <div className="flex gap-3 text-xs mt-1 text-warm-gray">
                                <span>Have: <b className={item.stock > 0 ? 'text-sage' : 'text-tomato'}>{item.stock}</b> {item.unit}</span>
                                <span className="text-tomato font-semibold">Buy: {item.deficit} {item.unit}</span>
                              </div>
                              {item.usedIn?.length > 0 && (
                                <p className="text-[10px] text-warm-gray mt-0.5 truncate">📍 {item.usedIn.join(', ')}</p>
                              )}
                            </div>
                            <button onClick={() => {
                              const ig = ingredients.find(x => x.id === item.id);
                              if (ig) onBuy(ig, item.deficit);
                            }} className="px-3.5 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold shrink-0">
                              Buy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Ready to Cook ─── */}
                {readyDishes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-sage uppercase tracking-wide mb-2">✅ Ready to Cook Now</h3>
                    <div className="space-y-2">
                      {readyDishes.map(dish => (
                        <div key={dish.id} className="bg-sage/5 rounded-xl border border-sage/30 p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{dish.name}</h4>
                            <div className="flex gap-1.5 mt-1">
                              {dish.country && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-warm-gray">{dish.country}</span>}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/10 text-sage">All {dish.ingDetails.length} ingredients ✓</span>
                            </div>
                          </div>
                          {onCook && (
                            <button onClick={() => onCook(dish)}
                              className="px-3.5 py-2 rounded-xl bg-sage text-white text-xs font-semibold shrink-0">Cook</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All set */}
                {!toBuyItems.length && !readyDishes.length && (
                  <p className="text-center py-8 text-warm-gray">🎉 Nothing to buy — check your dish plans!</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════ IN STOCK TAB ═══════════ */}
        {tab === 'stock' && (
          <>
            {inStockCats.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {inStockCats.map(c => (
                  <button key={c} onClick={() => toggleCat(c)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
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

            {!filteredInStock.length ? (
              <p className="text-center py-16 text-warm-gray">No in-stock ingredients for planned dishes.</p>
            ) : (
              <div className="space-y-2">
                {filteredInStock.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-sage/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{getIngredientEmoji(ingById.get(item.id) || item)} {item.name}</h3>
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <div className="flex gap-3 text-xs mt-1 text-warm-gray">
                          <span>Have: <b className="text-sage">{item.stock}</b> {item.unit}</span>
                          <span>Need: <b>{item.needed}</b> {item.unit}</span>
                        </div>
                        {item.usedIn?.length > 0 && (
                          <p className="text-[10px] text-warm-gray mt-0.5 truncate">📍 {item.usedIn.join(', ')}</p>
                        )}
                      </div>
                      <div className="text-xs px-3 py-1.5 rounded-full bg-sage/10 text-sage font-semibold shrink-0">✓ Have</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════ USE IT UP TAB ═══════════ */}
        {tab === 'expiry' && (
          <>
            {!expiringItems.length ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-warm-gray">Nothing expiring soon!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Expiring strip */}
                <div>
                  <h3 className="text-sm font-semibold text-charcoal mb-2">⚠️ Expiring Ingredients ({expiringItems.length})</h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {expiringItems.map(ig => {
                      const sp = ig._spoilage;
                      const isExpired = sp?.status === 'Expired';
                      return (
                        <div key={ig.id} className={`shrink-0 w-28 p-3 rounded-xl border text-center ${
                          isExpired ? 'bg-tomato/5 border-tomato/30' : 'bg-amber-50 border-amber-300/50'
                        }`}>
                          <span className="text-xl">{getIngredientEmoji(ig)}</span>
                          <p className="text-xs font-semibold mt-1.5 truncate">{ig.name}</p>
                          <p className={`text-[10px] font-bold mt-1 ${isExpired ? 'text-tomato' : 'text-amber-600'}`}>
                            {isExpired ? `Expired ${Math.abs(sp.daysRemaining)}d ago` : `${sp.daysRemaining}d left`}
                          </p>
                          <p className="text-[10px] text-warm-gray mt-0.5">{ig.stock_qty} {ig.unit}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recipe suggestions */}
                {expiryRecipes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-2">🍳 Cook These to Avoid Waste</h3>
                    <div className="space-y-2.5">
                      {expiryRecipes.map(d => (
                        <div key={d.id} style={priorityCardStyle(d.priority)} className="rounded-xl border border-l-0 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{d.name}</h4>
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{d.status}</span>
                                {d.country && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-warm-gray">{d.country}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {d.expiringNames.map((n, j) => (
                                  <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">⏰ {n}</span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                d.canCook ? 'bg-sage/10 text-sage' : 'bg-tomato/10 text-tomato'
                              }`}>
                                {d.canCook ? '✓ Ready' : `Need ${d.totalIngs - d.expiringCount} more`}
                              </div>
                              <p className="text-[10px] text-warm-gray mt-1.5">Uses {d.expiringCount}/{d.totalIngs} expiring</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!expiryRecipes.length && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <p className="text-sm text-amber-800">No recipes use these expiring ingredients. Add dishes that use them!</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        </>}

        {/* ═══════════ GENERAL LIST (non-food, shown when topTab=general) ═══════════ */}
        {topTab === 'general' && (
        <section className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-purple uppercase tracking-wide flex items-center gap-2">
              📦 General List
              <span className="text-warm-gray font-normal normal-case">{generalShoppingItems.length} item{generalShoppingItems.length === 1 ? '' : 's'}</span>
            </h3>
            <div className="flex gap-2">
              {checkedCount > 0 && (
                <button
                  onClick={clearChecked}
                  className="text-xs text-terracotta font-semibold hover:underline"
                >Clear checked ({checkedCount})</button>
              )}
              <button
                onClick={() => setGeneralAddOpen(o => !o)}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple/10 text-purple font-semibold hover:bg-purple/20"
              >{generalAddOpen ? '✕ Close' : '+ Add item'}</button>
            </div>
          </div>

          {generalAddOpen && (
            <div className="bg-white rounded-xl border border-purple/20 p-3 mb-3 space-y-2">
              <input
                value={genName}
                onChange={e => setGenName(e.target.value)}
                placeholder="Item name *"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  value={genQty}
                  onChange={e => setGenQty(e.target.value)}
                  placeholder='Quantity (e.g. "2 packs")'
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                />
                <select
                  value={genCat}
                  onChange={e => setGenCat(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm bg-white"
                >
                  {GENERAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={submitGeneral}
                disabled={!genName.trim()}
                className={`w-full py-2 rounded-lg text-white text-sm font-semibold ${
                  genName.trim() ? 'bg-terracotta hover:bg-terracotta/90' : 'bg-light-gray cursor-not-allowed'
                }`}
              >Add</button>
            </div>
          )}

          {generalShoppingItems.length === 0 ? (
            <p className="text-xs text-warm-gray text-center py-6">No general items yet — add stationery, cleaning supplies, etc.</p>
          ) : (
            <div className="space-y-1.5">
              {generalSorted.map(item => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${
                    item.checked ? 'border-light-gray/40 opacity-60' : 'border-purple/15'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleGeneral?.(item.id, !item.checked)}
                    className="w-4 h-4 accent-terracotta cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${item.checked ? 'line-through text-warm-gray' : 'text-charcoal'}`}>
                      {item.name}
                      {item.quantity && <span className="text-warm-gray font-normal"> · {item.quantity}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${GENERAL_CAT_STYLES[item.category] || GENERAL_CAT_STYLES.Other}`}>
                    {item.category || 'Other'}
                  </span>
                  <button
                    onClick={() => onDeleteGeneral?.(item.id)}
                    className="p-1 rounded text-warm-gray hover:text-tomato flex-shrink-0"
                    title="Delete"
                    aria-label="Delete item"
                  >🗑</button>
                </div>
              ))}
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
}
