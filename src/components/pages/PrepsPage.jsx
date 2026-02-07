import { LayerIcon, PlusIcon, EditIcon, DelIcon } from '../ui/Icons';

export default function PrepsPage({ intermediates, ingredients, intIngredients, onAdd, onEdit, onPrepare, onDelete }) {
  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple"><LayerIcon /></div>
            <div><h1 className="font-semibold text-xl">Preparations</h1><p className="text-sm text-warm-gray">Dough, sauces...</p></div>
          </div>
          <button onClick={onAdd} className="p-2.5 rounded-lg bg-purple text-white"><PlusIcon /></button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {!intermediates.length ? (
          <p className="text-center py-16 text-warm-gray">No preparations yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {intermediates.map(t => {
              const inputs = intIngredients.filter(ii => ii.intermediate_id === t.id);
              const inputNames = inputs.map(ii => ingredients.find(i => i.id === ii.ingredient_id)?.name).filter(Boolean).join(', ');
              return (
                <div key={t.id} className="bg-white rounded-xl border border-purple/30 p-4 fade">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className={`text-sm ${t.stock_qty > 0 ? '' : 'text-tomato'}`}>{t.stock_qty} {t.unit}</p>
                    </div>
                    {t._availability?.unlinked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Unlinked</span>
                    ) : t._availability?.canPrepare ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sage/20 text-sage">Ready</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-tomato/10 text-tomato">Missing</span>
                    )}
                  </div>
                  <p className="text-xs text-warm-gray mt-2">Inputs: {inputNames || 'None'}</p>
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
