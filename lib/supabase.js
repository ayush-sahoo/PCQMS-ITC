import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (service role — bypasses RLS). Never import this
// into client components.
let _client = null;

export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  // Prefer the service-role key when supplied (recommended for production so
  // RLS can lock the tables to the server only). Falls back to the anon key.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or a Supabase key (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY).');
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
