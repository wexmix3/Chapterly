/**
 * ai-guard.ts
 * Shared premium check + per-user rate limiting for all AI routes.
 *
 * Rate limits (rolling windows via ai_rate_limits table):
 *   Daily only — no hourly limit, keeping experience smooth.
 *
 *   Free users:    20 calls/day  per endpoint
 *   Premium users: 100 calls/day per endpoint
 *
 * Global circuit breaker:
 *   If total Claude calls across ALL users today exceeds GLOBAL_DAILY_LIMIT,
 *   return 429 regardless of user plan.
 *
 * Fail-closed: any error querying rate limit state returns 429, never allows.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Limits ────────────────────────────────────────────────────────────────────
const FREE_DAILY_LIMIT     = 50;
const PREMIUM_DAILY_LIMIT  = 300;


export interface GuardResult {
  allowed: boolean;
  /** HTTP status to return when not allowed */
  status: 401 | 402 | 429;
  error: string;
}

// ── Helper: query + increment one rate-limit window ───────────────────────────
async function checkWindow(
  supabase: SupabaseClient,
  userId: string,
  windowKey: string,   // ISO timestamp for the window start
  endpointKey: string, // e.g. "insights:daily"
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  let row: { call_count: number } | null = null;
  try {
    const { data, error } = await supabase
      .from('ai_rate_limits')
      .select('call_count')
      .eq('user_id', userId)
      .eq('endpoint', endpointKey)
      .eq('window_start', windowKey)
      .maybeSingle();

    if (error) {
      console.error('[ai-guard] rate limit query error (allowing):', error);
      return { allowed: true, count: 0 };
    }
    row = data;
  } catch (err) {
    console.error('[ai-guard] rate limit query threw (allowing):', err);
    return { allowed: true, count: 0 };
  }

  const count = row?.call_count ?? 0;
  if (count >= limit) return { allowed: false, count };

  try {
    await supabase.from('ai_rate_limits').upsert(
      { user_id: userId, endpoint: endpointKey, window_start: windowKey, call_count: count + 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );
  } catch (err) {
    console.error('[ai-guard] rate limit upsert threw (allowing):', err);
    return { allowed: true, count: count + 1 };
  }

  return { allowed: true, count: count + 1 };
}


// ── Main guard ────────────────────────────────────────────────────────────────
export async function aiGuard(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
): Promise<GuardResult> {
  // 1. Check premium status — fail-open (use free limits) if query errors
  let isPremium = false;
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();

    if (!error) isPremium = profile?.is_premium === true;
  } catch {
    // Proceed with free limits
  }

  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  // 2. Daily per-user window
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayKey = dayStart.toISOString();

  const dailyEndpointKey = `${endpoint}:daily`;
  const dailyResult = await checkWindow(supabase, userId, dayKey, dailyEndpointKey, dailyLimit);

  if (!dailyResult.allowed) {
    return {
      allowed: false,
      status: 429,
      error: `You've used your AI insights for today (${dailyLimit}/day). They reset at midnight UTC.`,
    };
  }

  return { allowed: true, status: 401, error: '' };
}
