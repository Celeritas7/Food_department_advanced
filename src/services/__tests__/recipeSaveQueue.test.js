import { createRecipeSaveQueue } from '../recipeSaveQueue.js';

test('scale changes and later checkbox saves stay ordered, and callers wait for the saved snapshot', async () => {
  const calls = [], releases = [];
  const queue = createRecipeSaveQueue(data => { calls.push(data); return new Promise(resolve => releases.push(resolve)); }, () => {});
  const first = queue({ batchScale: 1 });
  const scale = queue({ batchScale: 0.5 });
  let finished = false;
  const checkbox = queue({ batchScale: 0.5, checked: true }).then(ok => { finished = true; return ok; });
  expect(calls).toEqual([{ batchScale: 1 }]);
  expect(finished).toBe(false);
  releases[0](); await first;
  expect(calls).toEqual([{ batchScale: 1 }, { batchScale: 0.5, checked: true }]);
  expect(finished).toBe(false);
  releases[1]();
  expect(await scale).toBe(true);
  expect(await checkbox).toBe(true);
});
test('failed saves report failure and allow a later batch retry', async () => {
  let fail = true;
  const errors = [];
  const queue = createRecipeSaveQueue(async () => { if (fail) throw new Error('offline'); }, e => errors.push(e.message));
  expect(await queue({ batchScale: 2 })).toBe(false);
  fail = false;
  expect(await queue({ batchScale: 2 })).toBe(true);
  expect(errors).toEqual(['offline']);
});
