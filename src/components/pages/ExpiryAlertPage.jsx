/**
 * ExpiryAlertPage.jsx — 🚨 Expiry Alert
 * Hero feature: surfaces expiring ingredients and matches them to cookable recipes
 * Addresses the universal problem of food waste
 */
import { useState, useMemo } from 'react';
import { getDishTypeEmoji, getCountryFlag, getIngredientEmoji } from '../../config/emoji.js';

function UrgencyBadge({ days }) {
  if (days === null || days === undefined) return null;
  if (days < 0) return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-tomato/10 text-tomato border border-tomato/20">💀 {Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-tomato/10 text-tomato border border-tomato/20">🔥 Today!</span>;
  if (days === 1) return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-butter/60 text-yellow-800 border border-yellow-300">⚠️ Tomorrow</span>;
  return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-butter/40 text-yellow-700 border border-yellow-200">⏰ {days}d left</span>;
}

function CompletenessRing({ pct, size = 40 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 1 ? '#87A878' : pct >= 0.7 ? '#F59E0B' : '#E55039';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8e0d6" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} />
      </svg>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-charcoal">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

export default function ExpiryAlertPage({ ingredients, dishes, dishIngs, onCook, onBuy }) {
  const [expandedDish, setExpandedDish] = useState(null);

  // Find expiring / expired ingredients that are in stock.
  // Skip non-perishables (shelf_life_days is null) so salt/oil don't show up.
  const urgentItems = useMemo(() => {
    return ingredients
      .filter(i =>
        i.shelf_life_days != null &&
        i.stock_qty > 0 &&
        (i._spoilage?.status === 'Expired' || i._spoilage?.status === 'NearExpiry')
      )
      .sort((a, b) => (a._spoilage?.daysRemaining ?? 999) - (b._spoilage?.daysRemaining ?? 999));
  }, [ingredients]);

  const urgentIds = useMemo(() => new Set(urgentItems.map(i => i.id)), [urgentItems]);
  const inStockIds = useMemo(() => new Set(ingredients.filter(i => i.stock_qty > 0).map(i => i.id)), [ingredients]);
  const ingMap = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);

  // Match dishes to urgent ingredients
  const dishSuggestions = useMemo(() => {
    return dishes
      .filter(d => d.status !== 'Cooked')
      .map(d => {
        const myIngs = dishIngs.filter(di => di.dish_id === d.id);
        if (!myIngs.length) return null;

        const available = myIngs.filter(di => inStockIds.has(di.ingredient_id));
        const missing = myIngs.filter(di => !inStockIds.has(di.ingredient_id));
        const usesUrgent = myIngs.filter(di => urgentIds.has(di.ingredient_id));
        const completeness = myIngs.length > 0 ? available.length / myIngs.length : 0;
        const canCook = missing.length === 0;

        return {
          ...d,
          myIngs,
          availableIngs: available,
          missingIngs: missing,
          urgentIngs: usesUrgent,
          completeness,
          canCook,
          urgentCount: usesUrgent.length,
        };
      })
      .filter(d => d && d.urgentCount > 0)
      .sort((a, b) => {
        if (a.canCook !== b.canCook) return b.canCook - a.canCook;
        if (a.urgentCount !== b.urgentCount) return b.urgentCount - a.urgentCount;
        return b.completeness - a.completeness;
      });
  }, [dishes, dishIngs, urgentIds, inStockIds]);

  const expiredCount = urgentItems.filter(i => i._spoilage?.daysRemaining < 0).length;
  const todayTmrCount = urgentItems.filter(i => i._spoilage?.daysRemaining >= 0 && i._spoilage?.daysRemaining <= 1).length;
  const readyCount = dishSuggestions.filter(d => d.canCook).length;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Hero Header */}
      <header className="sticky top-0 z-10" style={{
        background: 'linear-gradient(135deg, #E55039 0%, #C4704F 50%, #D4A574 100%)',
      }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h1 className="text-xl font-bold text-white">Expiry Alert</h1>
              <p className="text-xs text-white/80">
                {urgentItems.length} item{urgentItems.length !== 1 ? 's' : ''} expiring · {readyCount} dish{readyCount !== 1 ? 'es' : ''} ready
              </p>
            </div>
          </div>
        </div>

        {/* Summary counters */}
        <div className="bg-white/10 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex justify-around py-3 px-4">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">{expiredCount}</div>
              <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Expired</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">{todayTmrCount}</div>
              <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Today/Tmr</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white">{readyCount}</div>
              <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Cook Now</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">

        {/* Nothing expiring — celebration */}
        {urgentItems.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">🎉</span>
            <p className="text-base font-bold text-sage mt-4">All Fresh!</p>
            <p className="text-sm text-warm-gray mt-1">Nothing expiring right now. Great job!</p>
          </div>
        )}

        {/* Expiring Ingredients — horizontal scroll strip */}
        {urgentItems.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-charcoal flex items-center gap-2 mb-3">
              <span className="text-base">⚠️</span> Expiring Ingredients
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {urgentItems.map(item => {
                const days = item._spoilage?.daysRemaining;
                const isExpired = days < 0;
                return (
                  <div key={item.id} className={`flex-shrink-0 w-32 p-3 rounded-xl border-2 ${
                    isExpired ? 'bg-tomato/5 border-tomato/30' : 'bg-butter/20 border-yellow-300/50'
                  }`}>
                    <div className="text-xl mb-1">{getIngredientEmoji(item)}</div>
                    <div className="text-xs font-bold text-charcoal leading-tight line-clamp-2">{item.name}</div>
                    <div className="text-[11px] text-warm-gray mt-1">{item.stock_qty} {item.unit}</div>
                    <div className="mt-2">
                      <UrgencyBadge days={days} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Suggested Dishes */}
        {dishSuggestions.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-charcoal flex items-center gap-2 mb-3">
              <span className="text-base">👨‍🍳</span> Suggested Dishes
              <span className="text-[11px] text-warm-gray font-normal">— uses your expiring items</span>
            </h2>

            <div className="space-y-3">
              {dishSuggestions.map(dish => {
                const isExpanded = expandedDish === dish.id;
                return (
                  <div key={dish.id} className={`bg-white rounded-xl overflow-hidden ${
                    dish.canCook
                      ? 'border-2 border-sage shadow-sm shadow-sage/10'
                      : 'border border-light-gray'
                  }`}>
                    {/* Dish header — tappable */}
                    <div
                      onClick={() => setExpandedDish(isExpanded ? null : dish.id)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                        dish.canCook ? 'bg-sage text-white' : 'bg-cream'
                      }`}>
                        {dish.canCook ? '✅' : (getDishTypeEmoji(dish.dish_type) || '🍽️')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-charcoal truncate">{dish.name}</span>
                          {dish.canCook && (
                            <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-md flex-shrink-0">
                              Ready!
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-warm-gray mt-0.5">
                          {getCountryFlag(dish.country)} {dish.dish_type || 'Dish'} · {dish.cooking_time || '—'}
                        </div>
                      </div>
                      <CompletenessRing pct={dish.completeness} />
                    </div>

                    {/* Urgent ingredient badges */}
                    <div className="px-4 pb-2.5 flex gap-1.5 flex-wrap">
                      {dish.urgentIngs.map(di => {
                        const ing = ingMap.get(di.ingredient_id);
                        if (!ing) return null;
                        return (
                          <span key={di.ingredient_id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            ing._spoilage?.daysRemaining < 0
                              ? 'bg-tomato/5 text-tomato border-tomato/20'
                              : 'bg-butter/30 text-yellow-700 border-yellow-200'
                          }`}>
                            {getIngredientEmoji(ing)} {ing.name.split('(')[0].trim()} — {
                              ing._spoilage?.daysRemaining < 0
                                ? `${Math.abs(ing._spoilage.daysRemaining)}d overdue`
                                : `${ing._spoilage?.daysRemaining}d left`
                            }
                          </span>
                        );
                      })}
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3">
                        <p className="text-[11px] font-bold text-warm-gray uppercase tracking-wider mb-2">Ingredients</p>
                        <div className="space-y-1">
                          {dish.myIngs.map(di => {
                            const ing = ingMap.get(di.ingredient_id);
                            const hasIt = ing && ing.stock_qty > 0;
                            const isUrgent = ing && urgentIds.has(ing.id);
                            return (
                              <div key={di.ingredient_id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                !hasIt
                                  ? 'bg-tomato/5'
                                  : isUrgent
                                    ? 'bg-butter/20'
                                    : 'bg-sage/5'
                              }`}>
                                <span>{!hasIt ? '❌' : isUrgent ? '⚠️' : '✅'}</span>
                                <span className="font-semibold text-charcoal flex-1">
                                  {ing ? `${getIngredientEmoji(ing)} ${ing.name}` : 'Unknown'}
                                </span>
                                <span className="text-warm-gray">
                                  {ing ? `${ing.stock_qty} ${ing.unit}` : '—'}
                                  {di.qty ? ` / need ${di.qty}` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action */}
                        <div className="mt-3 flex gap-2">
                          {dish.canCook ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onCook(dish); }}
                              className="flex-1 py-2.5 rounded-xl bg-sage text-white text-sm font-bold"
                            >🍳 Cook Now</button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); /* could add missing to cart */ }}
                              className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-sm font-bold"
                            >🛒 Need {dish.missingIngs.length} more</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No matching dishes */}
        {urgentItems.length > 0 && dishSuggestions.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">🤔</span>
            <p className="text-sm font-semibold text-charcoal mt-3">No matching dishes found</p>
            <p className="text-xs text-warm-gray mt-1">Add recipes that use your expiring ingredients</p>
          </div>
        )}
      </main>
    </div>
  );
}
