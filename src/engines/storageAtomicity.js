/**
 * Storage Atomicity & Transaction Wrapper (Phase 7)
 *
 * Thin JS wrappers that delegate the Phase 6 workflows to Supabase RPC
 * functions. All real atomicity work happens server-side: each RPC is
 * a PL/pgSQL function that opens a transaction, takes row locks via
 * `SELECT … FOR UPDATE`, validates stock, mutates, and commits — or
 * rolls back the entire function on any RAISE EXCEPTION.
 *
 * Contract these wrappers preserve:
 *   - Either the RPC returns a populated result and the DB has the new
 *     state, OR an error is thrown and the DB is unchanged. Never both.
 *   - On error, the wrapper throws with a descriptive message; callers
 *     do not need to inspect a `{ error }` field.
 *
 * Tests: TEST-SA-001 through TEST-SA-006
 *
 * Companion SQL migration: supabase/009_atomic_workflow.sql
 */

export async function runAtomicCook(supabase, dishId) {
  const { data, error } = await supabase.rpc('fd_cook_dish', { p_dish_id: dishId });
  if (error) throw new Error(error.message || 'Cook failed');
  return data;
}

export async function runAtomicPrepare(supabase, intermediateId, unitsToPrepare) {
  const { data, error } = await supabase.rpc('fd_prepare_intermediate', {
    p_intermediate_id: intermediateId,
    p_units: unitsToPrepare,
  });
  if (error) throw new Error(error.message || 'Prepare failed');
  return data;
}

export async function runAtomicBuy(supabase, ingredientId, purchasedQty, purchasedAt = null) {
  const { data, error } = await supabase.rpc('fd_buy_ingredient', {
    p_ingredient_id: ingredientId,
    p_qty: purchasedQty,
    p_purchased_at: purchasedAt,
  });
  if (error) throw new Error(error.message || 'Buy failed');
  return data;
}

export async function runAtomicStoreInFridge(supabase, dishId) {
  const { data, error } = await supabase.rpc('fd_store_in_fridge', { p_dish_id: dishId });
  if (error) throw new Error(error.message || 'Store in fridge failed');
  return data;
}

export async function runAtomicMarkEaten(supabase, dishId, notes) {
  const { data, error } = await supabase.rpc('fd_mark_eaten', {
    p_dish_id: dishId,
    p_notes: notes || null,
  });
  if (error) throw new Error(error.message || 'Mark eaten failed');
  return data;
}
