import { PkgIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';
import { SpoilageBadge } from '../ui/Badges';

export default function IngredientsPage({ ingredients, onAdd, onEdit, onBuy, onDelete }) {
  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><PkgIcon /></div>
            <div><h1 className="font-semibold text-xl">Ingredients</h1><p className="text-sm text-warm-gray">Raw materials</p></div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-terracotta text-white"><PlusIcon /></button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {!ingredients.length ? (
          <p className="text-center py-16 text-warm-gray">No ingredients yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ingredients.map(i => (
              <div key={i.id} className="bg-white rounded-xl border p-4 fade">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{i.name}</h3>
                    <p className={`text-sm ${i.stock_qty > 0 ? '' : 'text-tomato'}`}>{i.stock_qty} {i.unit}</p>
                  </div>
                  <SpoilageBadge status={i._spoilage?.status} daysRemaining={i._spoilage?.daysRemaining} />
                </div>
                {i.category && <p className="text-xs text-warm-gray mt-1">{i.category}</p>}
                <p className="text-xs text-warm-gray mt-1">Shelf: {i.shelf_life_days}d</p>
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <button onClick={() => onBuy(i)} className="flex-1 py-1.5 rounded text-sm text-terracotta hover:bg-terracotta/10">Buy</button>
                  <button onClick={() => onEdit(i)} className="p-1.5 rounded text-warm-gray hover:bg-light-gray/20"><EditIcon /></button>
                  <button onClick={() => onDelete(i)} className="p-1.5 rounded text-warm-gray hover:text-tomato"><DelIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
