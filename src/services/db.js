/**
 * Database Service — Supabase backend
 * Replaces Dexie (IndexedDB) with Supabase (PostgreSQL)
 * All CRUD operations for ingredients, intermediates, dishes, and junctions
 */
import supabase from '../config/supabase.js';

// ─── INGREDIENTS ─────────────────────────────────────────

export async function fetchIngredients() {
  const { data, error } = await supabase
    .from('food_department_ingredients')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function addIngredient(ing) {
  const { data, error } = await supabase
    .from('food_department_ingredients')
    .insert([{
      name: ing.name,
      unit: ing.unit || 'g',
      stock_qty: ing.stockQty || 0,
      shelf_life_days: ing.shelfLifeDays || 7,
      category: ing.category || '',
      country: ing.country || '',
      purchased_at: ing.purchasedAt || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIngredient(id, updates) {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.unit !== undefined) mapped.unit = updates.unit;
  if (updates.stockQty !== undefined) mapped.stock_qty = updates.stockQty;
  if (updates.shelfLifeDays !== undefined) mapped.shelf_life_days = updates.shelfLifeDays;
  if (updates.category !== undefined) mapped.category = updates.category;
  if (updates.country !== undefined) mapped.country = updates.country;
  if (updates.purchasedAt !== undefined) mapped.purchased_at = updates.purchasedAt;
  if (updates.restockReminderDays !== undefined) mapped.restock_reminder_days = updates.restockReminderDays;
  if (updates.lastReminderChecked !== undefined) mapped.last_reminder_checked = updates.lastReminderChecked;
  mapped.last_updated = new Date().toISOString();

  const { data, error } = await supabase
    .from('food_department_ingredients')
    .update(mapped)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIngredient(id) {
  const { error } = await supabase.from('food_department_ingredients').delete().eq('id', id);
  if (error) throw error;
}

export async function buyIngredient(id, qty) {
  // Fetch current, increment atomically via RPC or read+write
  const { data: current, error: fetchErr } = await supabase
    .from('food_department_ingredients')
    .select('stock_qty')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;

  const { data, error } = await supabase
    .from('food_department_ingredients')
    .update({
      stock_qty: current.stock_qty + qty,
      purchased_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── INTERMEDIATES ───────────────────────────────────────

export async function fetchIntermediates() {
  const { data, error } = await supabase
    .from('food_department_intermediates')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function addIntermediate(inter) {
  const { data, error } = await supabase
    .from('food_department_intermediates')
    .insert([{
      name: inter.name,
      unit: inter.unit || 'portions',
      stock_qty: inter.stockQty || 0,
      category: inter.category || '',
      country: inter.country || '',
    }])
    .select()
    .single();
  if (error) throw error;

  // Link input ingredients
  if (inter.inputIngredients?.length) {
    const links = inter.inputIngredients.map(inp => ({
      intermediate_id: data.id,
      ingredient_id: inp.ingredientId,
      qty_per_unit: inp.qtyPerUnit || 1,
    }));
    const { error: linkErr } = await supabase
      .from('food_department_intermediate_ingredients')
      .insert(links);
    if (linkErr) throw linkErr;
  }

  return data;
}

export async function updateIntermediate(id, updates) {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.unit !== undefined) mapped.unit = updates.unit;
  if (updates.stockQty !== undefined) mapped.stock_qty = updates.stockQty;
  if (updates.category !== undefined) mapped.category = updates.category;

  const { data, error } = await supabase
    .from('food_department_intermediates')
    .update(mapped)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Re-link inputs if provided
  if (updates.inputIngredients !== undefined) {
    await supabase.from('food_department_intermediate_ingredients').delete().eq('intermediate_id', id);
    if (updates.inputIngredients.length) {
      const links = updates.inputIngredients.map(inp => ({
        intermediate_id: id,
        ingredient_id: inp.ingredientId,
        qty_per_unit: inp.qtyPerUnit || 1,
      }));
      const { error: linkErr } = await supabase
        .from('food_department_intermediate_ingredients')
        .insert(links);
      if (linkErr) throw linkErr;
    }
  }

  return data;
}

export async function deleteIntermediate(id) {
  const { error } = await supabase.from('food_department_intermediates').delete().eq('id', id);
  if (error) throw error;
}

// ─── DISHES ──────────────────────────────────────────────

export async function fetchDishes() {
  const { data, error } = await supabase
    .from('food_department_dishes')
    .select('*')
    .order('priority', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addDish(dish) {
  const { data, error } = await supabase
    .from('food_department_dishes')
    .insert([{
      name: dish.name,
      status: dish.status || 'Not planned',
      priority: dish.priority || 3,
      country: dish.country || '',
      difficulty: dish.difficulty || '',
      dish_type: dish.type || '',
      notes: dish.notes || '',
      url: dish.url || '',
    }])
    .select()
    .single();
  if (error) throw error;

  // Link ingredients
  if (dish.recipeIngredients?.length) {
    const links = dish.recipeIngredients.map(e => ({
      dish_id: data.id,
      ingredient_id: e.ingredientId,
      qty: e.qty || 1,
      recipe_unit: e.unitOverride || null,
    }));
    await supabase.from('food_department_dish_ingredients').insert(links);
  }

  // Link intermediates
  if (dish.recipeIntermediates?.length) {
    const links = dish.recipeIntermediates.map(e => ({
      dish_id: data.id,
      intermediate_id: e.intermediateId,
      qty: e.qty || 1,
    }));
    await supabase.from('food_department_dish_intermediates').insert(links);
  }

  return data;
}

export async function updateDish(id, updates) {
  const mapped = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.priority !== undefined) mapped.priority = updates.priority;
  if (updates.country !== undefined) mapped.country = updates.country;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.url !== undefined) mapped.url = updates.url;
  if (updates.type !== undefined) mapped.dish_type = updates.type;

  const { data, error } = await supabase
    .from('food_department_dishes')
    .update(mapped)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Re-link ingredients if provided
  if (updates.recipeIngredients !== undefined) {
    await supabase.from('food_department_dish_ingredients').delete().eq('dish_id', id);
    if (updates.recipeIngredients.length) {
      const links = updates.recipeIngredients.map(e => ({
        dish_id: id,
        ingredient_id: e.ingredientId,
        qty: e.qty || 1,
        recipe_unit: e.unitOverride || null,
      }));
      await supabase.from('food_department_dish_ingredients').insert(links);
    }
  }

  // Re-link intermediates if provided
  if (updates.recipeIntermediates !== undefined) {
    await supabase.from('food_department_dish_intermediates').delete().eq('dish_id', id);
    if (updates.recipeIntermediates.length) {
      const links = updates.recipeIntermediates.map(e => ({
        dish_id: id,
        intermediate_id: e.intermediateId,
        qty: e.qty || 1,
      }));
      await supabase.from('food_department_dish_intermediates').insert(links);
    }
  }

  return data;
}

export async function deleteDish(id) {
  const { error } = await supabase.from('food_department_dishes').delete().eq('id', id);
  if (error) throw error;
}

// ─── RECIPE DATA (JSONB on dishes table) ────────────────
// ▶ NEW: Save/load the Notion-style recipe_data JSON blob

export async function saveRecipeData(dishId, recipeData) {
  const { data, error } = await supabase
    .from('food_department_dishes')
    .update({ recipe_data: recipeData })
    .eq('id', dishId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── LINK DISH INGREDIENTS FROM RECIPE (AI import) ──────
// Replaces existing dish_ingredients with AI-matched ones

export async function linkDishIngredientsFromRecipe(dishId, links) {
  // links: [{ ingredientId, qty, unit }]
  if (!links || links.length === 0) return;

  // Remove existing links for this dish
  await supabase.from('food_department_dish_ingredients').delete().eq('dish_id', dishId);

  // Deduplicate by ingredient_id — sum quantities if same ingredient appears multiple times
  const deduped = new Map();
  for (const l of links) {
    const existing = deduped.get(l.ingredientId);
    if (existing) {
      existing.qty += (l.qty || 1);
    } else {
      deduped.set(l.ingredientId, { ingredientId: l.ingredientId, qty: l.qty || 1, unit: l.unit || null });
    }
  }

  const rows = [...deduped.values()].map(l => ({
    dish_id: dishId,
    ingredient_id: l.ingredientId,
    qty: l.qty,
    recipe_unit: l.unit,
  }));

  const { error } = await supabase.from('food_department_dish_ingredients').insert(rows);
  if (error) throw error;
}

// ─── UPDATE SINGLE DISH-INGREDIENT LINK ─────────────────

export async function updateDishIngredientLink(dishId, ingredientId, qty, recipeUnit) {
  // Try update first
  const { data, error: updateErr } = await supabase
    .from('food_department_dish_ingredients')
    .update({ qty, recipe_unit: recipeUnit || null })
    .eq('dish_id', dishId)
    .eq('ingredient_id', ingredientId)
    .select();

  if (updateErr) throw updateErr;

  // If no row existed, insert
  if (!data || data.length === 0) {
    const { error: insertErr } = await supabase
      .from('food_department_dish_ingredients')
      .insert({ dish_id: dishId, ingredient_id: ingredientId, qty, recipe_unit: recipeUnit || null });
    if (insertErr) throw insertErr;
  }
}

// ─── JUNCTION FETCHERS ───────────────────────────────────

export async function fetchDishIngredients() {
  const { data, error } = await supabase.from('food_department_dish_ingredients').select('*');
  if (error) throw error;
  return data;
}

export async function fetchDishIntermediates() {
  const { data, error } = await supabase.from('food_department_dish_intermediates').select('*');
  if (error) throw error;
  return data;
}

export async function fetchIntermediateIngredients() {
  const { data, error } = await supabase.from('food_department_intermediate_ingredients').select('*');
  if (error) throw error;
  return data;
}

export async function fetchIngredientShops() {
  const { data, error } = await supabase.from('food_department_ingredient_shops').select('*');
  if (error) throw error;
  return data;
}

export async function fetchShops() {
  const { data, error } = await supabase.from('food_department_shops').select('*').order('name');
  if (error) throw error;
  return data;
}

// ─── WORKFLOW: Cook Dish (atomic) ────────────────────────

export async function cookDish(dishId, recipeIngredients, recipeIntermediates, ingredients, intermediates) {
  // Validate before attempting
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const intMap = new Map(intermediates.map(i => [i.id, i]));

  for (const e of recipeIngredients) {
    const ig = ingMap.get(e.ingredient_id);
    if (!ig) throw new Error(`Ingredient not found`);
    if (ig.stock_qty < e.qty) throw new Error(`Not enough ${ig.name}: need ${e.qty}, have ${ig.stock_qty}`);
  }
  for (const e of recipeIntermediates) {
    const it = intMap.get(e.intermediate_id);
    if (!it) throw new Error(`Preparation not found`);
    if (it.stock_qty < e.qty) throw new Error(`Not enough ${it.name}: need ${e.qty}, have ${it.stock_qty}`);
  }

  // Deduct ingredients
  for (const e of recipeIngredients) {
    const ig = ingMap.get(e.ingredient_id);
    const { error } = await supabase
      .from('food_department_ingredients')
      .update({ stock_qty: ig.stock_qty - e.qty })
      .eq('id', e.ingredient_id);
    if (error) throw error;
  }

  // Deduct intermediates
  for (const e of recipeIntermediates) {
    const it = intMap.get(e.intermediate_id);
    const { error } = await supabase
      .from('food_department_intermediates')
      .update({ stock_qty: it.stock_qty - e.qty })
      .eq('id', e.intermediate_id);
    if (error) throw error;
  }

  // Mark dish as cooked
  const { error } = await supabase
    .from('food_department_dishes')
    .update({ status: 'Cooked', last_cooked_on: new Date().toISOString() })
    .eq('id', dishId);
  if (error) throw error;
}

// ─── WORKFLOW: Prepare Intermediate (atomic) ─────────────

export async function prepareIntermediate(intermediateId, units, inputIngredients, ingredients) {
  const ingMap = new Map(ingredients.map(i => [i.id, i]));

  // Validate
  for (const inp of inputIngredients) {
    const ig = ingMap.get(inp.ingredient_id);
    if (!ig) throw new Error(`Input ingredient not found`);
    const needed = inp.qty_per_unit * units;
    if (ig.stock_qty < needed) throw new Error(`Not enough ${ig.name}: need ${needed}, have ${ig.stock_qty}`);
  }

  // Deduct inputs
  for (const inp of inputIngredients) {
    const ig = ingMap.get(inp.ingredient_id);
    const { error } = await supabase
      .from('food_department_ingredients')
      .update({ stock_qty: ig.stock_qty - (inp.qty_per_unit * units) })
      .eq('id', inp.ingredient_id);
    if (error) throw error;
  }

  // Increment intermediate stock
  const { data: current } = await supabase
    .from('food_department_intermediates')
    .select('stock_qty')
    .eq('id', intermediateId)
    .single();

  const { error } = await supabase
    .from('food_department_intermediates')
    .update({ stock_qty: (current?.stock_qty || 0) + units })
    .eq('id', intermediateId);
  if (error) throw error;
}

// ─── EXPORT / IMPORT ─────────────────────────────────────

// ─── CATEGORY MANAGEMENT ─────────────────────────────────

export async function bulkRenameCategory(oldCategory, newCategory) {
  const { error } = await supabase
    .from('food_department_ingredients')
    .update({ category: newCategory, last_updated: new Date().toISOString() })
    .eq('category', oldCategory);
  if (error) throw error;
}

export async function updateIngredientCategoriesByIds(ids, newCategory) {
  const { error } = await supabase
    .from('food_department_ingredients')
    .update({ category: newCategory, last_updated: new Date().toISOString() })
    .in('id', ids);
  if (error) throw error;
}

// ─── DISH CATEGORY MANAGEMENT ───────────────────────────

export async function bulkRenameDishCountry(oldCountry, newCountry) {
  const { error } = await supabase
    .from('food_department_dishes')
    .update({ country: newCountry })
    .eq('country', oldCountry);
  if (error) throw error;
}

export async function updateDishCountriesByIds(ids, newCountry) {
  const { error } = await supabase
    .from('food_department_dishes')
    .update({ country: newCountry })
    .in('id', ids);
  if (error) throw error;
}

export async function bulkRenameDishType(oldType, newType) {
  const { error } = await supabase
    .from('food_department_dishes')
    .update({ dish_type: newType })
    .eq('dish_type', oldType);
  if (error) throw error;
}

export async function updateDishTypesByIds(ids, newType) {
  const { error } = await supabase
    .from('food_department_dishes')
    .update({ dish_type: newType })
    .in('id', ids);
  if (error) throw error;
}

// ─── EXPORT / IMPORT (continued) ─────────────────────────

// Batch-create ingredients during recipe import. Accepts the camelCase
// shape used elsewhere in this file (shelfLifeDays/stockQty) and returns
// the inserted rows so callers can map ids back to the recipe links.
export async function batchCreateIngredients(rows) {
  if (!rows || !rows.length) return [];
  const now = new Date().toISOString();
  const mapped = rows
    .filter(r => r?.name && r.name.trim())
    .map(r => ({
      name: r.name.trim(),
      unit: r.unit || 'g',
      stock_qty: r.stockQty || 0,
      shelf_life_days: r.shelfLifeDays || 7,
      category: r.category || '',
      country: r.country || '',
      last_updated: now,
    }));
  if (!mapped.length) return [];
  const { data, error } = await supabase
    .from('food_department_ingredients')
    .insert(mapped)
    .select();
  if (error) throw error;
  return data;
}

export async function bulkInsertIngredients(rows) {
  // rows: array of { name, unit, stock_qty, shelf_life_days, category, country }
  const now = new Date().toISOString();
  const mapped = rows.map(r => ({
    name: r.name?.trim(),
    unit: r.unit?.trim() || 'g',
    stock_qty: parseFloat(r.stock_qty) || 0,
    shelf_life_days: parseInt(r.shelf_life_days) || 7,
    category: r.category?.trim() || '',
    country: r.country?.trim() || '',
    purchased_at: r.purchased_at || null,
    last_updated: now,
  }));

  // Validate
  const invalid = mapped.filter(m => !m.name);
  if (invalid.length) throw new Error(`${invalid.length} rows missing name`);

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += 50) {
    const batch = mapped.slice(i, i + 50);
    const { error } = await supabase
      .from('food_department_ingredients')
      .insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }
  return inserted;
}

export async function exportAllData() {
  const [ings, ints, dishes, di, dint, ii, ishops, shops] = await Promise.all([
    fetchIngredients(),
    fetchIntermediates(),
    fetchDishes(),
    fetchDishIngredients(),
    fetchDishIntermediates(),
    fetchIntermediateIngredients(),
    fetchIngredientShops(),
    fetchShops(),
  ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    ingredients: ings,
    intermediates: ints,
    dishes,
    dish_ingredients: di,
    dish_intermediates: dint,
    intermediate_ingredients: ii,
    ingredient_shops: ishops,
    shops,
  };
}
