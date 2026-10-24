/**
 * paged.js — read every row of a query past PostgREST's per-request cap.
 *
 * Supabase returns at most 1,000 rows per request by default ("Max rows"
 * in API settings), and a plain .select() stops there without an error.
 * fetchAllRows requests the first page together with the total row count;
 * a table that fits in one page costs one request, as before. Larger tables
 * then fetch all remaining pages in parallel.
 *
 * makeQuery(opts) must return a fresh query builder with a stable, unique
 * order (end with .order('id')) — range paging over a non-unique order can
 * skip or repeat rows between pages. opts is passed to .select().
 */
export const PAGE_SIZE = 1000;

export async function fetchAllRows(makeQuery, pageSize = PAGE_SIZE) {
  const first = await makeQuery({ count: 'exact' }).range(0, pageSize - 1);
  if (first.error) throw first.error;
  const rows = first.data || [];

  // No usable count (e.g. the count header was not readable): never assume
  // the first page was everything — keep reading until a short page.
  if (typeof first.count !== 'number') {
    return rows.length < pageSize ? rows : rows.concat(await fetchSequential(makeQuery, pageSize, pageSize));
  }
  if (first.count <= rows.length) return rows;

  const pages = Math.ceil(first.count / pageSize);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      makeQuery().range((i + 1) * pageSize, (i + 2) * pageSize - 1)
    )
  );
  const failed = rest.find(r => r.error);
  if (failed) throw failed.error;
  return rows.concat(rest.flatMap(r => r.data || []));
}

async function fetchSequential(makeQuery, pageSize, from) {
  const all = [];
  for (; ; from += pageSize) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < pageSize) return all;
  }
}
