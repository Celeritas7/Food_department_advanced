/** One recipe write at a time. Coalesced callers wait for the snapshot that
 * contains their changes, including a batch-size change, to finish saving. */
export function createRecipeSaveQueue(save, onError) {
  let pending = null, running = false;
  async function drain() {
    running = true;
    while (pending) {
      const next = pending;
      pending = null;
      let ok = true;
      try { await save(next.data); }
      catch (error) { ok = false; onError(error); }
      for (const resolve of next.waiters) resolve(ok);
    }
    running = false;
  }
  return data => new Promise(resolve => {
    pending = { data, waiters: [...(pending?.waiters || []), resolve] };
    if (!running) void drain();
  });
}
