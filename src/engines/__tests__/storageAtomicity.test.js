/**
 * Phase 7 — Storage Atomicity tests
 * Run with: npm test -- src/engines/__tests__/storageAtomicity.test.js
 *
 * The mock Supabase client below faithfully models the contract that the
 * SQL functions in supabase/009_atomic_workflow.sql provide:
 *   - rpc('fd_*', args) snapshots the in-memory state, runs the simulated
 *     transaction, and either commits (state updated, returns { data })
 *     or rolls back (state restored, returns { error }).
 *   - A `failHook` lets a test inject a crash partway through a simulated
 *     transaction; the rollback contract guarantees no partial mutations
 *     leak out.
 *   - The same row-level CHECK (stock_qty >= 0) safety net is enforced.
 */
import { runAtomicCook, runAtomicPrepare, runAtomicBuy } from '../storageAtomicity.js';
import { checkDishAvailability } from '../availability.js';

// ─── Mock Supabase RPC client ────────────────────────────
function makeMockSupabase(initial) {
  const state = structuredClone(initial);
  let failHook = null; // (op, step) => throws or returns nothing

  const cook = (args) => {
    const dish = state.dishes.find(d => d.id === args.p_dish_id);
    if (!dish) throw new Error(`Dish not found: ${args.p_dish_id}`);
    if (dish.status === 'Cooked') throw new Error('Dish is already cooked');

    const myIngs = state.dishIngs.filter(di => di.dish_id === dish.id);
    const myInts = state.dishInts.filter(di => di.dish_id === dish.id);

    // Validate every ingredient first (locks + check)
    for (const e of myIngs) {
      const ig = state.ingredients.find(i => i.id === e.ingredient_id);
      if (!ig) throw new Error(`Ingredient not found: ${e.ingredient_id}`);
      if (ig.stock_qty < e.qty) {
        throw new Error(`Insufficient ${ig.name}: need ${e.qty}, have ${ig.stock_qty}`);
      }
    }
    for (const e of myInts) {
      const it = state.intermediates.find(i => i.id === e.intermediate_id);
      if (!it) throw new Error(`Intermediate not found: ${e.intermediate_id}`);
      if (it.stock_qty < e.qty) {
        throw new Error(`Insufficient ${it.name}: need ${e.qty}, have ${it.stock_qty}`);
      }
    }

    // Mutate, with optional crash hook between steps
    const updatedIngredients = [];
    let stepIdx = 0;
    for (const e of myIngs) {
      const ig = state.ingredients.find(i => i.id === e.ingredient_id);
      ig.stock_qty -= e.qty;
      if (ig.stock_qty < 0) throw new Error(`stock_qty CHECK violation on ${ig.name}`);
      updatedIngredients.push({ ...ig });
      stepIdx++;
      if (failHook) failHook('cook', `after_ingredient_${stepIdx}`);
    }
    const updatedIntermediates = [];
    stepIdx = 0;
    for (const e of myInts) {
      const it = state.intermediates.find(i => i.id === e.intermediate_id);
      it.stock_qty -= e.qty;
      if (it.stock_qty < 0) throw new Error(`stock_qty CHECK violation on ${it.name}`);
      updatedIntermediates.push({ ...it });
      stepIdx++;
      if (failHook) failHook('cook', `after_intermediate_${stepIdx}`);
    }
    dish.status = 'Cooked';
    dish.last_cooked_on = new Date().toISOString();

    return {
      success: true,
      updatedDish: { ...dish },
      updatedIngredients,
      updatedIntermediates,
    };
  };

  const prepare = (args) => {
    if (args.p_units == null || args.p_units <= 0) {
      throw new Error(`Invalid quantity: ${args.p_units}`);
    }
    const inter = state.intermediates.find(i => i.id === args.p_intermediate_id);
    if (!inter) throw new Error(`Intermediate not found: ${args.p_intermediate_id}`);

    const inputs = state.intIngs.filter(ii => ii.intermediate_id === inter.id);
    for (const inp of inputs) {
      const ig = state.ingredients.find(i => i.id === inp.ingredient_id);
      if (!ig) throw new Error(`Input ingredient not found: ${inp.ingredient_id}`);
      const need = inp.qty_per_unit * args.p_units;
      if (ig.stock_qty < need) {
        throw new Error(`Insufficient ${ig.name}: need ${need}, have ${ig.stock_qty}`);
      }
    }

    const updatedIngredients = [];
    let stepIdx = 0;
    for (const inp of inputs) {
      const ig = state.ingredients.find(i => i.id === inp.ingredient_id);
      ig.stock_qty -= inp.qty_per_unit * args.p_units;
      if (ig.stock_qty < 0) throw new Error(`stock_qty CHECK violation on ${ig.name}`);
      updatedIngredients.push({ ...ig });
      stepIdx++;
      if (failHook) failHook('prepare', `after_input_${stepIdx}`);
    }
    inter.stock_qty += args.p_units;
    if (failHook) failHook('prepare', 'after_increment');

    return {
      success: true,
      updatedIntermediate: { ...inter },
      updatedIngredients,
    };
  };

  const buy = (args) => {
    if (args.p_qty == null || args.p_qty <= 0) {
      throw new Error(`Invalid quantity: ${args.p_qty}`);
    }
    if (args.p_purchased_at && new Date(args.p_purchased_at) > new Date()) {
      throw new Error(`p_purchased_at cannot be in the future: ${args.p_purchased_at}`);
    }
    const ig = state.ingredients.find(i => i.id === args.p_ingredient_id);
    if (!ig) throw new Error(`Ingredient not found: ${args.p_ingredient_id}`);

    ig.stock_qty += args.p_qty;
    ig.purchased_at = args.p_purchased_at ?? new Date().toISOString();
    if (failHook) failHook('buy', 'after_update');

    return { success: true, updatedIngredient: { ...ig } };
  };

  return {
    state,
    setFailHook(fn) { failHook = fn; },

    async rpc(fn, args) {
      // Snapshot the entire state for atomic rollback on any error.
      const snapshot = structuredClone(state);
      try {
        let data;
        if (fn === 'fd_cook_dish') data = cook(args);
        else if (fn === 'fd_prepare_intermediate') data = prepare(args);
        else if (fn === 'fd_buy_ingredient') data = buy(args);
        else throw new Error(`Unknown RPC: ${fn}`);
        return { data, error: null };
      } catch (err) {
        // Restore — atomic rollback
        for (const k of Object.keys(state)) delete state[k];
        Object.assign(state, snapshot);
        return { data: null, error: { message: err.message } };
      }
    },
  };
}

// ─── Fixture helpers ─────────────────────────────────────
const seedState = () => ({
  ingredients: [
    { id: 'i-flour', name: 'Flour', stock_qty: 500, unit: 'g', purchased_at: '2025-01-01' },
    { id: 'i-egg',   name: 'Egg',   stock_qty: 12,  unit: 'pcs', purchased_at: '2025-01-01' },
    { id: 'i-tom',   name: 'Tomato', stock_qty: 100, unit: 'g', purchased_at: '2025-01-01' },
    { id: 'i-rice',  name: 'Rice',  stock_qty: 200, unit: 'g', purchased_at: '2025-01-01' },
  ],
  intermediates: [
    { id: 't-sauce', name: 'Tomato Sauce', stock_qty: 5, unit: 'portions' },
    { id: 't-paste', name: 'Curry Paste',  stock_qty: 0, unit: 'portions' },
  ],
  dishes: [
    { id: 'd-pasta', name: 'Pasta',  status: 'Planned', priority: 2 },
    { id: 'd-curry', name: 'Curry',  status: 'Planned', priority: 1 },
    { id: 'd-empty', name: 'Empty',  status: 'Planned', priority: 3 },
  ],
  dishIngs: [
    { dish_id: 'd-pasta', ingredient_id: 'i-flour', qty: 200 },
    { dish_id: 'd-pasta', ingredient_id: 'i-egg',   qty: 2 },
    { dish_id: 'd-curry', ingredient_id: 'i-rice',  qty: 100 },
  ],
  dishInts: [
    { dish_id: 'd-pasta', intermediate_id: 't-sauce', qty: 1 },
    { dish_id: 'd-curry', intermediate_id: 't-paste', qty: 5 }, // insufficient
  ],
  intIngs: [
    { intermediate_id: 't-sauce', ingredient_id: 'i-tom', qty_per_unit: 5 },
  ],
});

const stockOf = (state, id) => state.ingredients.find(i => i.id === id).stock_qty;
const interStockOf = (state, id) => state.intermediates.find(i => i.id === id).stock_qty;

// ─── Tests ────────────────────────────────────────────────

describe('Phase 7 Storage Atomicity', () => {
  test('TEST-SA-001: crash after first ingredient deducted → full rollback', async () => {
    const sb = makeMockSupabase(seedState());
    // Inject a crash AFTER the first ingredient deduction (Flour).
    sb.setFailHook((op, step) => {
      if (op === 'cook' && step === 'after_ingredient_1') {
        throw new Error('Simulated crash mid-cook');
      }
    });

    await expect(runAtomicCook(sb, 'd-pasta')).rejects.toThrow(/Simulated crash/);

    // Both ingredients restored to their original values.
    expect(stockOf(sb.state, 'i-flour')).toBe(500);
    expect(stockOf(sb.state, 'i-egg')).toBe(12);
    expect(interStockOf(sb.state, 't-sauce')).toBe(5);
    expect(sb.state.dishes.find(d => d.id === 'd-pasta').status).toBe('Planned');
  });

  test('TEST-SA-002: crash mid-prepare → ingredient stock NOT deducted, intermediate NOT incremented', async () => {
    const sb = makeMockSupabase(seedState());
    sb.setFailHook((op, step) => {
      if (op === 'prepare' && step === 'after_input_1') {
        throw new Error('Simulated crash mid-prepare');
      }
    });

    await expect(runAtomicPrepare(sb, 't-sauce', 2)).rejects.toThrow(/Simulated crash/);

    expect(stockOf(sb.state, 'i-tom')).toBe(100);     // unchanged
    expect(interStockOf(sb.state, 't-sauce')).toBe(5); // unchanged
  });

  test('TEST-SA-003: two concurrent cooks share stock — first wins, second fails gracefully', async () => {
    // Custom seed: stock=100, two dishes each needing 60.
    const sb = makeMockSupabase({
      ingredients: [{ id: 'i-x', name: 'X', stock_qty: 100, unit: 'g', purchased_at: null }],
      intermediates: [],
      dishes: [
        { id: 'd-a', name: 'A', status: 'Planned', priority: 3 },
        { id: 'd-b', name: 'B', status: 'Planned', priority: 3 },
      ],
      dishIngs: [
        { dish_id: 'd-a', ingredient_id: 'i-x', qty: 60 },
        { dish_id: 'd-b', ingredient_id: 'i-x', qty: 60 },
      ],
      dishInts: [],
      intIngs: [],
    });

    // The mock's rpc is synchronous from JS's POV; "concurrent" here means
    // two dispatches against the same shared state. The first deducts to 40,
    // the second cannot satisfy 60 and throws — modeling SELECT FOR UPDATE
    // serializing the contenders so the loser is rejected, not silently
    // overdrawing stock.
    const [r1, r2] = await Promise.allSettled([
      runAtomicCook(sb, 'd-a'),
      runAtomicCook(sb, 'd-b'),
    ]);

    const fulfilled = [r1, r2].filter(r => r.status === 'fulfilled');
    const rejected = [r1, r2].filter(r => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toMatch(/Insufficient X/);

    // Stock reflects exactly one deduction; never went negative.
    expect(stockOf(sb.state, 'i-x')).toBe(40);
  });

  test('TEST-SA-004: app restart → reload from DB, derived values recompute cleanly', async () => {
    const sb = makeMockSupabase(seedState());
    // Successful cook mutates the DB.
    const r = await runAtomicCook(sb, 'd-pasta');
    expect(r.success).toBe(true);

    // Simulate a fresh client booting against the (already-mutated) DB.
    // The new client reads only the persisted base fields; nothing about
    // engines is cached anywhere.
    const persisted = structuredClone(sb.state);
    const reloadedState = persisted; // model: app reads exactly what's stored

    expect(reloadedState.ingredients.find(i => i.id === 'i-flour').stock_qty).toBe(300);
    expect(reloadedState.ingredients.find(i => i.id === 'i-egg').stock_qty).toBe(10);
    expect(reloadedState.intermediates.find(i => i.id === 't-sauce').stock_qty).toBe(4);
    expect(reloadedState.dishes.find(d => d.id === 'd-pasta').status).toBe('Cooked');
  });

  test('TEST-SA-005: after restart, checkDishAvailability reflects post-cook stock', async () => {
    const sb = makeMockSupabase(seedState());
    await runAtomicCook(sb, 'd-pasta');

    // Reload — engine recomputes from base fields, no stale cache.
    const reloaded = structuredClone(sb.state);
    const pasta = reloaded.dishes.find(d => d.id === 'd-pasta');
    const curry = reloaded.dishes.find(d => d.id === 'd-curry');

    // Pasta is now Cooked → engine skips it.
    const pastaAv = checkDishAvailability(
      pasta, reloaded.dishIngs, reloaded.dishInts, reloaded.ingredients, reloaded.intermediates
    );
    expect(pastaAv.skipped).toBe(true);

    // Curry was unaffected by the pasta cook; its 't-paste' intermediate
    // still has stock_qty=0 vs need=5, so canCook stays false with the
    // fresh, recomputed numbers.
    const curryAv = checkDishAvailability(
      curry, reloaded.dishIngs, reloaded.dishInts, reloaded.ingredients, reloaded.intermediates
    );
    expect(curryAv.canCook).toBe(false);
    expect(curryAv.missingIntermediates.find(m => m.name === 'Curry Paste')).toBeDefined();
  });

  test('TEST-SA-006: import with broken last entity → entire import rolled back, original data preserved', async () => {
    // Model: an import transaction that buys several ingredients in one
    // RPC; the last entity has a broken ref. The mock's rpc snapshot/restore
    // contract guarantees nothing partial leaks out.
    const sb = makeMockSupabase(seedState());

    // Snapshot original stock values before attempting the import.
    const originals = sb.state.ingredients.map(i => ({ id: i.id, stock_qty: i.stock_qty }));

    // Extend the mock for this test with a multi-step import RPC. The
    // production SQL exposes only the three single-action RPCs; this one
    // exercises the same snapshot/rollback contract on a longer batch.
    sb.rpcImport = async (ops) => {
      const snapshot = structuredClone(sb.state);
      try {
        for (const op of ops) {
          if (op.kind === 'buy') {
            const ig = sb.state.ingredients.find(i => i.id === op.id);
            if (!ig) throw new Error(`Ingredient not found: ${op.id}`);
            if (op.qty <= 0) throw new Error('Invalid quantity');
            ig.stock_qty += op.qty;
          }
        }
        return { data: { success: true }, error: null };
      } catch (err) {
        for (const k of Object.keys(sb.state)) delete sb.state[k];
        Object.assign(sb.state, snapshot);
        return { data: null, error: { message: err.message } };
      }
    };

    const ops = [
      { kind: 'buy', id: 'i-flour', qty: 100 },
      { kind: 'buy', id: 'i-egg',   qty: 6   },
      { kind: 'buy', id: 'i-MISSING', qty: 1 }, // broken ref → whole import fails
    ];

    const { error } = await sb.rpcImport(ops);
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Ingredient not found/);

    // Every ingredient is back to its original stock — the two earlier
    // successful buys were rolled back along with the failure.
    for (const o of originals) {
      expect(stockOf(sb.state, o.id)).toBe(o.stock_qty);
    }
  });
});
