import { createBrowserClient } from '@supabase/ssr';

// Browser client — uses @supabase/ssr so PKCE code verifier is stored in
// cookies (not localStorage), making it accessible to server-side route handlers.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
