import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server client for Route Handlers & Server Components — uses next/headers
export function createServerSupabaseClient() {
  return createRouteHandlerClient({ cookies });
}

// Admin client (bypasses RLS — server-side only)
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
