import { useState } from 'react';
import { CartIcon } from '../ui/Icons';
import { PriorityBadge } from '../ui/Badges';

export default function ShopPage({ shoppingList, ingredients, onBuy }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? shoppingList.list : shoppingList.list.filter(i => i.toBuy);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><CartIcon /></div>
            <div><h1 className="font-semibold text-xl">Shopping</h1><p className="text-sm text-warm-gray">Auto-generated</p></div>
          </div>
          {shoppingList.list.length > 0 && (
            <div className="mt-3 flex gap-3">
              <span className="text-sm px-3 py-1 rounded-full bg-tomato/10 text-tomato">{shoppingList.toBuy} to buy</span>
              <span className="text-sm px-3 py-1 rounded-full bg-sage/20 text-sage">{shoppingList.list.length - shoppingList.toBuy} ok</span>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {!shoppingList.list.length ? (
          <p className="text-center py-16 text-warm-gray">Add dishes to see shopping list</p>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setShowAll(false)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!showAll ? 'bg-terracotta text-white' : 'bg-white text-warm-gray'}`}>To Buy ({shoppingList.toBuy})</button>
              <button onClick={() => setShowAll(true)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${showAll ? 'bg-terracotta text-white' : 'bg-white text-warm-gray'}`}>All ({shoppingList.list.length})</button>
            </div>
            <div className="space-y-3">
              {list.map(item => (
                <div key={item.id} className={`bg-white rounded-xl border p-4 ${item.toBuy ? 'border-tomato/30' : 'border-sage/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!item.toBuy && 'text-warm-gray line-through'}`}>{item.name}</h3>
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <div className="flex gap-4 text-sm mt-1">
                        <span>Have: <b>{item.stock}</b></span>
                        <span>Need: <b>{item.needed}</b></span>
                        {item.toBuy && <span className="text-tomato font-medium">Buy: {item.deficit}</span>}
                      </div>
                    </div>
                    {item.toBuy && (
                      <button onClick={() => {
                        const ig = ingredients.find(x => x.id === item.id);
                        if (ig) onBuy(ig, item.deficit);
                      }} className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-sm">Buy</button>
                    )}
                  </div>
                </div>
              ))}
              {!list.length && <p className="text-center py-8 text-warm-gray">🎉 All set!</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
