export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/books';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const AUTHENTICATED_LIMIT = 20; // searches per hour for logged-in users
const ANONYMOUS_LIMIT     = 10; // searches per hour per IP for unauthenticated

async function checkSearchRateLimit(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  bucketKey: string, // user_id or ip address
  endpoint: string,  // "search:user" or "search:ip"
  limit: number,
): Promise<boolean> {
  // Returns true (allowed) or false (rate limited).
  // Fail-closed: any error denies.
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  const windowKey = hourStart.toISOString();

  try {
    const { data, error } = await supabase
      .from('ai_rate_limits')
      .select('call_count')
      .eq('user_id', bucketKey)
      .eq('endpoint', endpoint)
      .eq('window_start', windowKey)
      .maybeSingle();

    if (error) {
      console.error('[books/search] rate limit query error (denying):', error);
      return false;
    }

    const count = data?.call_count ?? 0;
    if (count >= limit) return false;

    await supabase.from('ai_rate_limits').upsert(
      { user_id: bucketKey, endpoint, window_start: windowKey, call_count: count + 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );
    return true;
  } catch (err) {
    console.error('[books/search] rate limit threw (denying):', err);
    return false;
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

  if (user) {
    // Authenticated: per-user limit
    const allowed = await checkSearchRateLimit(supabase, user.id, 'search:user', AUTHENTICATED_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Search rate limit exceeded. Try again in an hour.' },
        { status: 429 },
      );
    }
  } else {
    // Unauthenticated: per-IP limit using x-forwarded-for
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    // Sanitize IP to be a safe table key (max 45 chars for IPv6)
    const ipKey = `ip:${ip.slice(0, 45)}`;
    const allowed = await checkSearchRateLimit(supabase, ipKey, 'search:ip', ANONYMOUS_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Search rate limit exceeded. Try again in an hour.' },
        { status: 429 },
      );
    }
  }

  const results = await searchBooks(q);
  return NextResponse.json({ data: results });
}
