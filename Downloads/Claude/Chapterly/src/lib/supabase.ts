import { createClient } from '@supabase/supabase-js';

// Browser client — safe for client components (no next/headers)
export function createBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: 'chapterly-auth' } }
  );
}
