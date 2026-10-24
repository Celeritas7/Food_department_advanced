/**
 * fetchAllRows — paging past the 1,000-row per-request cap
 * Run with: npm test -- src/services/__tests__/paged.test.js
 */
import { fetchAllRows } from '../paged.js';

// ─── Fake table ───────────────────────────────────────────
// Mimics a Supabase query builder over `rows`: .range() returns that slice,
// capped at `maxRows` like PostgREST's "Max rows" setting, plus the total
// count when the query was built with { count: 'exact' }.
function fakeTable(rows, { maxRows = 1000, pageError, noCount } = {}) {
  const calls = { ranges: [], counted: 0 };
  const makeQuery = (opts) => ({
    range(from, to) {
      calls.ranges.push([from, to]);
      if (opts?.count) calls.counted++;
      if (pageError && from === pageError.from) return Promise.resolve({ data: null, error: pageError.error });
      const data = rows.slice(from, Math.min(to + 1, from + maxRows));
      const count = opts?.count && !noCount ? rows.length : null;
      return Promise.resolve({ data, count, error: null });
    },
  });
  return { makeQuery, calls };
}
const makeRows = n => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

// ─── Tests ────────────────────────────────────────────────

describe('fetchAllRows', () => {
  test('small table (today\'s 777 dish_ingredients) → one request, as before', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(777));
    expect(await fetchAllRows(makeQuery)).toHaveLength(777);
    expect(calls.ranges).toEqual([[0, 999]]);
    expect(calls.counted).toBe(1);
  });

  test('returns every row past the 1,000-row cap (2,500 rows → 3 pages)', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(2500));
    const rows = await fetchAllRows(makeQuery);
    expect(rows).toHaveLength(2500);
    expect(rows[0].id).toBe(1);
    expect(rows[2499].id).toBe(2500);
    expect(new Set(rows.map(r => r.id)).size).toBe(2500);
    expect(calls.ranges).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  test('exactly 1,000 rows → one request, nothing dropped', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(1000));
    expect(await fetchAllRows(makeQuery)).toHaveLength(1000);
    expect(calls.ranges).toEqual([[0, 999]]);
  });

  test('empty table → []', async () => {
    const { makeQuery } = fakeTable([]);
    expect(await fetchAllRows(makeQuery)).toEqual([]);
  });

  test('missing count falls back to page-by-page, never a cut-off list', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(2500), { noCount: true });
    expect(await fetchAllRows(makeQuery)).toHaveLength(2500);
    expect(calls.ranges).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  test('missing count on an exact multiple of 1,000 still stops', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(2000), { noCount: true });
    expect(await fetchAllRows(makeQuery)).toHaveLength(2000);
    expect(calls.ranges).toHaveLength(3); // the third page comes back empty
  });

  test('missing count on a small table → one request', async () => {
    const { makeQuery, calls } = fakeTable(makeRows(40), { noCount: true });
    expect(await fetchAllRows(makeQuery)).toHaveLength(40);
    expect(calls.ranges).toHaveLength(1);
  });

  test('first-page error is thrown, not swallowed', async () => {
    const { makeQuery } = fakeTable(makeRows(10), { pageError: { from: 0, error: new Error('RLS denied') } });
    await expect(fetchAllRows(makeQuery)).rejects.toThrow('RLS denied');
  });

  test('a failed later page is thrown instead of returning a partial list', async () => {
    const { makeQuery } = fakeTable(makeRows(2500), { pageError: { from: 1000, error: new Error('timeout') } });
    await expect(fetchAllRows(makeQuery)).rejects.toThrow('timeout');
  });
});
