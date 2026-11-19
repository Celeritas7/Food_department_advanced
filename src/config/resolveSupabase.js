// Browser-visible connection settings. Never accept a privileged server key.
export function resolveSupabaseConfig(env = {}, defaults = {}) {
  const overrideUrl = String(env.VITE_SUPABASE_URL || '').trim();
  const overrideKey = String(env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (Boolean(overrideUrl) !== Boolean(overrideKey)) throw new Error('Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or neither to use the public app configuration.');
  const url = overrideUrl || defaults.url;
  const key = overrideKey || defaults.key;
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('A valid public Supabase URL is required.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || /YOUR_PROJECT/i.test(url)) throw new Error('Use a real HTTPS Supabase project URL.');
  if (typeof key !== 'string') throw new Error('A public Supabase key is required.');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    let payload;
    try { payload = JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))); } catch { throw new Error('Use a publishable key or legacy anon key, never a secret/service-role key.'); }
    if (payload.role !== 'anon') throw new Error('Privileged Supabase keys must never be used in browser builds.');
    if (parsed.hostname.endsWith('.supabase.co') && payload.ref !== parsed.hostname.split('.')[0]) throw new Error('The legacy anon key must match the project URL.');
  }
  return {url:parsed.origin,key};
}
