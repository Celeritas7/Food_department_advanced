import { createClient } from '@supabase/supabase-js';

import publicConfig from './public-supabase.json';
import { resolveSupabaseConfig } from './resolveSupabase.js';

// These are public browser settings, backed by owner-scoped RLS. Keeping a
// checked-in default makes fresh CI/workspace builds deployable without .env.
const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = resolveSupabaseConfig(import.meta.env, publicConfig);
export const isConfigured = true;

// Signed-in client: every food_department_* table is owner-scoped by RLS
// (user_id = auth.uid()), so all reads/writes need the user's JWT.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: { headers: { 'x-akatsuki-app': 'food' } },
});

// Akatsuki broadcast overlay: load the hub script once, start it with this client.
if (typeof document !== 'undefined') {
  const s = document.createElement('script');
  s.src = 'https://celeritas7.github.io/Akatsuki/js/akatsuki-broadcast.js';
  s.onload = () => window.AkatsukiBroadcast?.(supabase, 'food').start();
  document.head.appendChild(s);
}
export default supabase;
