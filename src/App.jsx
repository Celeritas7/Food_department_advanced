/**
 * App.jsx — Main Application Component
 * Orchestrates state, engines, and page routing
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as db from './services/db.js';
import supabase from './config/supabase.js';
import { computeSpoilage } from './engines/spoilage.js';
import { checkDishAvailability, checkIntermediateAvailability } from './engines/availability.js';
import { aggregateRequirements } from './engines/quantity.js';
import { computePriorityPropagation } from './engines/priorityPropagation.js';
import { runAtomicCook, runAtomicPrepare, runAtomicBuy } from './engines/storageAtomicity.js';

// UI Components
import Toast from './components/ui/Toast';
import Modal from './components/ui/Modal';
import { PkgIcon, LayerIcon, DishIcon, CartIcon, DataIcon, AlertIcon } from './components/ui/Icons';

// Pages
import IngredientsPage from './components/pages/IngredientsPage';
import PrepsPage from './components/pages/PrepsPage';
import DishesPage from './components/pages/DishesPage';
import DishManagerPanel from './components/pages/DishManagerPanel';
import ShopPage from './components/pages/ShopPage';
import DataPage from './components/pages/DataPage';
import CategoryManagerPage from './components/pages/CategoryManagerPage';
import ExpiryAlertPage from './components/pages/ExpiryAlertPage';
import RecipePage from './components/pages/RecipePage'; // ▶ NEW

// Forms
import IngredientForm from './components/forms/IngredientForm';
import BuyDialog from './components/forms/BuyDialog';
import IntermediateForm from './components/forms/IntermediateForm';
import PrepareDialog from './components/forms/PrepareDialog';
import DishForm from './components/forms/DishForm';

export default function App() {
  // ─── State (persisted in sessionStorage) ───────────────
  const [page, setPageRaw] = useState(() => sessionStorage.getItem('fd_page') || 'dish');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({});
  const [recipeDish, setRecipeDishRaw] = useState(null);
  const [pendingRecipeDishId] = useState(() => sessionStorage.getItem('fd_recipeDishId') || null);

  // Wrap setters to persist
  const setPage = (p) => { setPageRaw(p); sessionStorage.setItem('fd_page', p); };
  const setRecipeDish = (dOrFn) => {
    if (typeof dOrFn === 'function') {
      setRecipeDishRaw(prev => {
        const next = dOrFn(prev);
        sessionStorage.setItem('fd_recipeDishId', next?.id || '');
        return next;
      });
    } else {
      setRecipeDishRaw(dOrFn);
      sessionStorage.setItem('fd_recipeDishId', dOrFn?.id || '');
    }
  };

  // Raw data from Supabase
  const [ingredients, setIngredients] = useState([]);
  const [intermediates, setIntermediates] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [dishIngs, setDishIngs] = useState([]);
  const [dishInts, setDishInts] = useState([]);
  const [intIngs, setIntIngs] = useState([]);

  const notify = useCallback((msg, type = 'error') => setToast({ msg, type, key: Date.now() }), []);

  // ─── Data Loading ────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [ings, ints, dsh, di, dint, ii] = await Promise.all([
        db.fetchIngredients(),
        db.fetchIntermediates(),
        db.fetchDishes(),
        db.fetchDishIngredients(),
        db.fetchDishIntermediates(),
        db.fetchIntermediateIngredients(),
      ]);
      setIngredients(ings);
      setIntermediates(ints);
      setDishes(dsh);
      setDishIngs(di);
      setDishInts(dint);
      setIntIngs(ii);

      // Restore recipeDish from saved ID after data loads
      if (pendingRecipeDishId && !recipeDish) {
        const found = dsh.find(d => d.id === pendingRecipeDishId);
        if (found) setRecipeDishRaw(found);
      }
    } catch (err) {
      notify('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Enriched Data (engines) ─────────────────────────
  // Inherited priority — propagated from planned dishes via intermediates.
  // Each intermediate carries its inputs as `input_ingredients` (snake_case
  // shape the engine accepts) so the propagation can reach raw ingredients.
  const inheritedPriorities = useMemo(() => {
    const intermediatesWithInputs = intermediates.map(i => ({
      ...i,
      input_ingredients: intIngs.filter(ii => ii.intermediate_id === i.id),
    }));
    return computePriorityPropagation(dishes, dishIngs, dishInts, intermediatesWithInputs).ingredientPriorities;
  }, [dishes, dishIngs, dishInts, intermediates, intIngs]);

  const enrichedIngredients = useMemo(() =>
    ingredients.map(i => ({
      ...i,
      _spoilage: computeSpoilage(i),
      _inheritedPriority: inheritedPriorities.get(i.id) ?? null,
    })),
    [ingredients, inheritedPriorities]
  );

  const enrichedIntermediates = useMemo(() =>
    intermediates.map(t => ({
      ...t,
      _availability: checkIntermediateAvailability(t, intIngs, ingredients),
    })),
    [intermediates, intIngs, ingredients]
  );

  const enrichedDishes = useMemo(() =>
    dishes.map(d => ({
      ...d,
      _availability: checkDishAvailability(d, dishIngs, dishInts, ingredients, intermediates),
    })),
    [dishes, dishIngs, dishInts, ingredients, intermediates]
  );

  const shoppingList = useMemo(() =>
    aggregateRequirements(dishes, dishIngs, dishInts, intIngs, ingredients, intermediates),
    [dishes, dishIngs, dishInts, intIngs, ingredients, intermediates]
  );

  const urgentCount = useMemo(() =>
    enrichedIngredients.filter(i => i.stock_qty > 0 && (i._spoilage?.status === 'Expired' || i._spoilage?.status === 'NearExpiry')).length,
    [enrichedIngredients]
  );

  // ─── Actions: Ingredients ────────────────────────────
  const handleAddIngredient = async (data) => {
    try {
      const created = await db.addIngredient(data);
      setIngredients(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setModal({});
      notify(`Added ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleEditIngredient = async (data) => {
    try {
      const updated = await db.updateIngredient(modal.data.id, data);
      setIngredients(prev => prev.map(i => i.id === modal.data.id ? updated : i));
      setModal({});
      notify(`Updated ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleBuyIngredient = async (qty) => {
    try {
      const { updatedIngredient } = await runAtomicBuy(supabase, modal.data.id, qty);
      setIngredients(prev => prev.map(i => i.id === modal.data.id ? updatedIngredient : i));
      setModal({});
      notify('Stock updated', 'success');
    } catch (err) { notify(err.message); }
  };

  const handleDeleteIngredient = async (ing) => {
    if (!confirm(`Delete ${ing.name}?`)) return;
    try {
      await db.deleteIngredient(ing.id);
      setIngredients(prev => prev.filter(i => i.id !== ing.id));
      notify(`Deleted ${ing.name}`, 'warn');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  // ─── Actions: Intermediates ──────────────────────────
  const handleAddIntermediate = async (data) => {
    try {
      const created = await db.addIntermediate(data);
      await loadAll(); // Reload to get junction updates
      setModal({});
      notify(`Added ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleEditIntermediate = async (data) => {
    try {
      await db.updateIntermediate(modal.data.id, data);
      await loadAll();
      setModal({});
      notify(`Updated ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handlePrepareIntermediate = async (units) => {
    const inter = modal.data;
    try {
      await runAtomicPrepare(supabase, inter.id, units);
      await loadAll();
      setModal({});
      notify(`Prepared ${units} ${inter.unit} of ${inter.name}`, 'success');
    } catch (err) { notify(err.message); }
  };

  const handleDeleteIntermediate = async (inter) => {
    if (!confirm(`Delete ${inter.name}?`)) return;
    try {
      await db.deleteIntermediate(inter.id);
      await loadAll();
      notify(`Deleted ${inter.name}`, 'warn');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  // ─── Actions: Dishes ─────────────────────────────────
  const handleAddDish = async (data) => {
    try {
      await db.addDish(data);
      await loadAll();
      setModal({});
      notify(`Added ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleEditDish = async (data) => {
    try {
      await db.updateDish(modal.data.id, data);
      await loadAll();
      setModal({});
      notify(`Updated ${data.name}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleCookDish = async (dish) => {
    if (dish.status === 'Cooked') return notify('Dish is already cooked');
    if (dish._availability && !dish._availability.canCook) {
      const missing = [
        ...(dish._availability.missingIngredients || []).map(m => `${m.name} ${m.required - m.available}${ingredients.find(i => i.id === m.ingredientId)?.unit || ''}`),
        ...(dish._availability.missingIntermediates || []).map(m => `${m.name} ${m.required - m.available}`),
      ].join(', ');
      return notify(missing ? `Missing: ${missing}` : `Cannot cook ${dish.name}`);
    }
    try {
      await runAtomicCook(supabase, dish.id);
      await loadAll();
      setModal({});
      notify(`${dish.name} cooked!`, 'success');
    } catch (err) { notify(err.message); }
  };

  const handleQuickStatus = async (dish, newStatus) => {
    try {
      await db.updateDish(dish.id, { status: newStatus });
      await loadAll();
      notify(`${dish.name} → ${newStatus}`, 'success');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  const handleDeleteDish = async (dish) => {
    if (!confirm(`Delete ${dish.name}?`)) return;
    try {
      await db.deleteDish(dish.id);
      await loadAll();
      notify(`Deleted ${dish.name}`, 'warn');
    } catch (err) { notify('Failed: ' + err.message); }
  };

  // ─── Actions: Recipe ─────────────────────────────────  ▶ NEW
  const handleSaveRecipe = async (dishId, recipeData) => {
    const updated = await db.saveRecipeData(dishId, recipeData);
    // Update local dishes state so RecipePage sees the saved data
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, recipe_data: updated.recipe_data } : d));
    // Also update the recipeDish ref so the page reflects the save
    setRecipeDish(prev => prev && prev.id === dishId ? { ...prev, recipe_data: updated.recipe_data } : prev);
  };

  // ─── Actions: Link dish ingredients from recipe AI import ─── ▶ NEW
  const handleLinkIngredients = async (dishId, links) => {
    await db.linkDishIngredientsFromRecipe(dishId, links);
    await loadAll(); // Reload so availability % updates
  };

  // ─── Actions: Categories ───────────────────────────────
  const handleBulkRename = async (oldCat, newCat) => {
    try {
      await db.bulkRenameCategory(oldCat, newCat);
      await loadAll();
    } catch (err) { notify('Rename failed: ' + err.message); }
  };

  const handleMoveItems = async (ids, newCat) => {
    try {
      await db.updateIngredientCategoriesByIds(ids, newCat);
      await loadAll();
    } catch (err) { notify('Move failed: ' + err.message); }
  };

  const handleBulkRenameDishCountry = async (oldVal, newVal) => {
    try {
      await db.bulkRenameDishCountry(oldVal, newVal);
      await loadAll();
    } catch (err) { notify('Rename failed: ' + err.message); }
  };

  const handleMoveDishCountries = async (ids, newVal) => {
    try {
      await db.updateDishCountriesByIds(ids, newVal);
      await loadAll();
    } catch (err) { notify('Move failed: ' + err.message); }
  };

  const handleBulkRenameDishType = async (oldVal, newVal) => {
    try {
      await db.bulkRenameDishType(oldVal, newVal);
      await loadAll();
    } catch (err) { notify('Rename failed: ' + err.message); }
  };

  const handleMoveDishTypes = async (ids, newVal) => {
    try {
      await db.updateDishTypesByIds(ids, newVal);
      await loadAll();
    } catch (err) { notify('Move failed: ' + err.message); }
  };

  // ─── Data Management ─────────────────────────────────
  const handleExport = async () => {
    try {
      const data = await db.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cooking-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Data exported', 'success');
    } catch (err) { notify('Export failed: ' + err.message); }
  };

  // ─── Helpers for forms (map Supabase → form format) ──
  const getIntermediateFormData = (inter) => {
    if (!inter) return null;
    const inputs = intIngs.filter(ii => ii.intermediate_id === inter.id);
    return {
      ...inter,
      inputIngredients: inputs.map(ii => ({
        ingredientId: ii.ingredient_id,
        qtyPerUnit: ii.qty_per_unit,
      })),
    };
  };

  const getDishFormData = (dish) => {
    if (!dish) return null;
    const myIngs = dishIngs.filter(di => di.dish_id === dish.id);
    const myInts = dishInts.filter(di => di.dish_id === dish.id);
    return {
      ...dish,
      recipeIngredients: myIngs.map(di => ({ ingredientId: di.ingredient_id, qty: di.qty, unitOverride: di.recipe_unit || '' })),
      recipeIntermediates: myInts.map(di => ({ intermediateId: di.intermediate_id, qty: di.qty })),
    };
  };

  // ─── Loading State ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-warm-gray mt-3">Connecting to database...</p>
        </div>
      </div>
    );
  }

  // ─── Recipe Page (full-screen overlay, above everything) ─── ▶ NEW
  if (recipeDish) {
    return (
      <div>
        {toast && <Toast key={toast.key} message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <RecipePage
          dish={recipeDish}
          ingredients={enrichedIngredients}
          dishIngs={dishIngs.filter(di => di.dish_id === recipeDish.id)}
          onSave={handleSaveRecipe}
          onLinkIngredients={handleLinkIngredients}
          onUpdateStock={async (ingredientId, newQty, newUnit) => {
            try {
              const ing = ingredients.find(i => i.id === ingredientId);
              if (!ing) return;
              const updates = { stockQty: newQty };
              if (newUnit && newUnit !== ing.unit) updates.unit = newUnit;
              await db.updateIngredient(ingredientId, updates);
              await loadAll();
              notify(`${ing.name} → ${newQty} ${newUnit || ing.unit}`, 'success');
            } catch (err) { notify('Update failed: ' + err.message); }
          }}
          onCreateIngredient={async (name) => {
            try {
              const created = await db.addIngredient({ name, unit: 'g', stockQty: 0, shelfLifeDays: 30, category: '', country: '' });
              setIngredients(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
              notify(`Created "${created.name}"`, 'success');
              return created;
            } catch (err) { notify('Create failed: ' + err.message); return null; }
          }}
          onBatchCreateIngredients={async (rows) => {
            const created = await db.batchCreateIngredients(rows);
            if (created?.length) {
              setIngredients(prev => [...prev, ...created].sort((a, b) => a.name.localeCompare(b.name)));
            }
            return created;
          }}
          onUpdateDishLink={async (ingredientId, qty, unit) => {
            try {
              await db.updateDishIngredientLink(recipeDish.id, ingredientId, qty, unit);
              setDishIngs(prev => {
                const idx = prev.findIndex(di => di.dish_id === recipeDish.id && di.ingredient_id === ingredientId);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], qty, recipe_unit: unit || null };
                  return updated;
                }
                return [...prev, { dish_id: recipeDish.id, ingredient_id: ingredientId, qty, recipe_unit: unit || null }];
              });
            } catch (err) { notify('Update failed: ' + err.message); }
          }}
          onBack={() => setRecipeDish(null)}
          notify={notify}
        />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────
  return (
    <div>
      {toast && <Toast key={toast.key} message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Pages */}
      {page === 'ing' && (
        <IngredientsPage
          ingredients={enrichedIngredients}
          onAdd={() => setModal({ type: 'addIng' })}
          onEdit={(i) => setModal({ type: 'editIng', data: i })}
          onBuy={(i) => setModal({ type: 'buyIng', data: i })}
          onDelete={handleDeleteIngredient}
        />
      )}
      {page === 'int' && (
        <PrepsPage
          intermediates={enrichedIntermediates}
          ingredients={ingredients}
          intIngredients={intIngs}
          onAdd={() => setModal({ type: 'addInt' })}
          onEdit={(t) => setModal({ type: 'editInt', data: t })}
          onPrepare={(t) => setModal({ type: 'prepInt', data: t })}
          onDelete={handleDeleteIntermediate}
        />
      )}
      {page === 'dish' && (
        <DishesPage
          dishes={enrichedDishes}
          onAdd={() => setModal({ type: 'addDish' })}
          onEdit={(d) => setModal({ type: 'editDish', data: d })}
          onCook={(d) => handleCookDish(d)}
          onQuickStatus={handleQuickStatus}
          onManage={() => setModal({ type: 'manageDishes' })}
          onRecipe={(d) => setRecipeDish(d)}  /* ▶ NEW */
        />
      )}
      {page === 'shop' && (
        <ShopPage
          shoppingList={shoppingList}
          ingredients={enrichedIngredients}
          dishes={enrichedDishes}
          dishIngs={dishIngs}
          dishInts={dishInts}
          intermediates={enrichedIntermediates}
          onBuy={(ig, sugQty) => setModal({ type: 'buyIng', data: ig, suggestedQty: sugQty })}
          onCook={(dish) => handleCookDish(dish)}
        />
      )}
      {page === 'data' && (
        <DataPage
          counts={{ ingredients: ingredients.length, intermediates: intermediates.length, dishes: dishes.length }}
          onExport={handleExport}
          onImport={async () => { await loadAll(); notify('Data reloaded', 'success'); }}
          onClearAll={async () => { setLoading(true); await loadAll(); }}
          onCategoryManager={() => setPage('cat')}
        />
      )}
      {page === 'cat' && (
        <CategoryManagerPage
          ingredients={enrichedIngredients}
          dishes={enrichedDishes}
          onBulkRename={handleBulkRename}
          onMoveItems={handleMoveItems}
          onBulkRenameDishCountry={handleBulkRenameDishCountry}
          onMoveDishCountries={handleMoveDishCountries}
          onBulkRenameDishType={handleBulkRenameDishType}
          onMoveDishTypes={handleMoveDishTypes}
          onBack={() => setPage('data')}
          notify={notify}
        />
      )}
      {page === 'alert' && (
        <ExpiryAlertPage
          ingredients={enrichedIngredients}
          dishes={enrichedDishes}
          dishIngs={dishIngs}
          onCook={(d) => handleCookDish(d)}
          onBuy={(ig) => setModal({ type: 'buyIng', data: ig })}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
        <div className="max-w-4xl mx-auto flex justify-around">
          {[
            { key: 'alert', icon: AlertIcon, label: 'Expiry', color: 'tomato', badge: urgentCount },
            { key: 'ing', icon: PkgIcon, label: 'Ingredients', color: 'terracotta' },
            { key: 'dish', icon: DishIcon, label: 'Dishes', color: 'terracotta' },
            { key: 'shop', icon: CartIcon, label: 'Shop', color: 'terracotta', badge: shoppingList.toBuy },
            { key: 'int', icon: LayerIcon, label: 'Preps', color: 'purple' },
            { key: 'data', icon: DataIcon, label: 'Data', color: 'charcoal' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setPage(tab.key)} className={`flex flex-col items-center gap-0.5 py-2 px-1.5 relative ${(page === tab.key || (tab.key === 'data' && page === 'cat')) ? `text-${tab.color}` : 'text-warm-gray'}`}>
              <tab.icon />
              <span className="text-xs">{tab.label}</span>
              {tab.badge > 0 && <span className="absolute top-1 right-0 w-4 h-4 bg-tomato text-white text-xs rounded-full flex items-center justify-center">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <Modal open={modal.type === 'addIng'} onClose={() => setModal({})} title="Add Ingredient">
        <IngredientForm onSave={handleAddIngredient} onCancel={() => setModal({})} />
      </Modal>
      <Modal open={modal.type === 'editIng'} onClose={() => setModal({})} title="Edit Ingredient">
        {modal.data && <IngredientForm initial={modal.data} onSave={handleEditIngredient} onCancel={() => setModal({})} />}
      </Modal>
      <Modal open={modal.type === 'buyIng'} onClose={() => setModal({})} title="Buy">
        {modal.data && <BuyDialog ingredient={modal.data} suggestedQty={modal.suggestedQty} onBuy={handleBuyIngredient} onCancel={() => setModal({})} />}
      </Modal>
      <Modal open={modal.type === 'addInt'} onClose={() => setModal({})} title="Add Preparation">
        <IntermediateForm ingredients={enrichedIngredients} onSave={handleAddIntermediate} onCancel={() => setModal({})} />
      </Modal>
      <Modal open={modal.type === 'editInt'} onClose={() => setModal({})} title="Edit Preparation">
        {modal.data && <IntermediateForm initial={getIntermediateFormData(modal.data)} ingredients={enrichedIngredients} onSave={handleEditIntermediate} onCancel={() => setModal({})} />}
      </Modal>
      <Modal open={modal.type === 'prepInt'} onClose={() => setModal({})} title="Prepare">
        {modal.data && <PrepareDialog intermediate={modal.data} intIngredients={intIngs.filter(ii => ii.intermediate_id === modal.data.id)} ingredients={ingredients} onPrepare={handlePrepareIntermediate} onCancel={() => setModal({})} />}
      </Modal>
      <Modal open={modal.type === 'addDish'} onClose={() => setModal({})} title="Add Dish">
        <DishForm ingredients={enrichedIngredients} intermediates={enrichedIntermediates} onSave={handleAddDish} onCancel={() => setModal({})}
          onCreateIngredient={async (data) => { const created = await db.addIngredient(data); setIngredients(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name))); return created; }} />
      </Modal>
      <Modal open={modal.type === 'editDish'} onClose={() => setModal({})} title="Edit Dish">
        {modal.data && <DishForm initial={getDishFormData(modal.data)} ingredients={enrichedIngredients} intermediates={enrichedIntermediates} onSave={handleEditDish} onCancel={() => setModal({})}
          onDelete={async (d) => {
            try {
              await db.deleteDish(d.id);
              await loadAll();
              notify(`Deleted ${d.name}`, 'warn');
              setModal({});
            } catch (err) { notify('Failed: ' + err.message); }
          }}
          onCreateIngredient={async (data) => { const created = await db.addIngredient(data); setIngredients(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name))); return created; }} />}
      </Modal>

      {modal.type === 'manageDishes' && (
        <DishManagerPanel
          dishes={enrichedDishes}
          onQuickStatus={handleQuickStatus}
          onClose={() => setModal({})}
        />
      )}
    </div>
  );
}
