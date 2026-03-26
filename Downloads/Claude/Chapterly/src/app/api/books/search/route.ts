export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/books';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

const AUTHENTICATED_LIMIT = 60; // searches per hour for logged-in users

// Fail-OPEN: if the rate-limit table is unavailable (not yet migrated, etc.)
// we allow the request. Book search calls free external APIs — denying all
// searches because our DB table is missing is far worse than over-allowing.
async function checkUserRateLimit(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  const windowKey = hourStart.toISOString();

  try {
    const { data, error } = await adminClient
      .from('ai_rate_limits')
      .select('call_count')
      .eq('user_id', userId)
      .eq('endpoint', 'search:user')
      .eq('window_start', windowKey)
      .maybeSingle();

    if (error) {
      // Table missing or query failed — fail-open so searches still work
      console.warn('[books/search] rate limit table unavailable, allowing:', error.message);
      return { allowed: true };
    }

    const count = data?.call_count ?? 0;
    if (count >= AUTHENTICATED_LIMIT) {
      return { allowed: false, reason: 'Search limit reached (60/hour). Try again in an hour.' };
    }

    // Non-blocking counter increment (fire-and-forget, ignore errors)
    void adminClient.from('ai_rate_limits').upsert(
      { user_id: userId, endpoint: 'search:user', window_start: windowKey, call_count: count + 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );

    return { allowed: true };
  } catch {
    // Unexpected error — fail-open
    return { allowed: true };
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  // Rate-limit authenticated users only. Anonymous IP-based limiting is skipped
  // because ai_rate_limits.user_id has a FK to users(id) which rejects non-UUID
  // IP strings — fixing that requires a separate migration.
  if (user) {
    const adminClient = createAdminSupabaseClient();
    const { allowed, reason } = await checkUserRateLimit(adminClient, user.id);
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 429 });
    }
  }

  try {
    const results = await searchBooks(q);
    return NextResponse.json({ data: results });
  } catch (err) {
    console.error('[books/search] external search failed:', err);
    return NextResponse.json({ error: 'Search unavailable. Please try again.' }, { status: 502 });
  }
}
