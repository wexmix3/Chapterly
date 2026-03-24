/**
 * ai-guard.ts
 * Shared premium check + per-user rate limiting for all AI routes.
 *
 * Rate limits (rolling windows via ai_rate_limits table):
 *   Hourly  — stops burst abuse within a single session
 *   Daily   — hard daily ceiling to prevent runaway API costs
 *
 *   Free users:    3 calls/hour  |  5 calls/day   per endpoint
 *   Premium users: 20 calls/hour | 20 calls/day   per endpoint
 *
 * Global circuit breaker:
 *   If total Claude calls across ALL users today exceeds GLOBAL_DAILY_LIMIT,
 *   return 429 regardless of user plan.
 *
 * Fail-closed: any error querying rate limit state returns 429, never allows.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Limits ────────────────────────────────────────────────────────────────────
const FREE_HOURLY_LIMIT    = 3;
const FREE_DAILY_LIMIT     = 5;
const PREMIUM_HOURLY_LIMIT = 20;
const PREMIUM_DAILY_LIMIT  = 20;

/** Hard cap on total Claude calls per day across all users. */
const GLOBAL_DAILY_LIMIT = 2000;

/** Sentinel user_id used for the global circuit-breaker row. */
const GLOBAL_SENTINEL = 'global';

/** Endpoint name used for the global counter. */
const GLOBAL_ENDPOINT = '__global__';

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
  endpointKey: string, // e.g. "insights" or "insights:daily"
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  // Fail-closed: if the query throws, deny by default.
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
      console.error('[ai-guard] rate limit query error (denying):', error);
      return { allowed: false, count: 0 };
    }
    row = data;
  } catch (err) {
    console.error('[ai-guard] rate limit query threw (denying):', err);
    return { allowed: false, count: 0 };
  }

  const count = row?.call_count ?? 0;
  if (count >= limit) return { allowed: false, count };

  // Increment (upsert so first call creates the row)
  try {
    await supabase.from('ai_rate_limits').upsert(
      { user_id: userId, endpoint: endpointKey, window_start: windowKey, call_count: count + 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );
  } catch (err) {
    console.error('[ai-guard] rate limit upsert threw (denying):', err);
    return { allowed: false, count };
  }

  return { allowed: true, count: count + 1 };
}

// ── Global circuit breaker ────────────────────────────────────────────────────
async function checkGlobalCircuitBreaker(
  supabase: SupabaseClient,
  dayKey: string,
): Promise<boolean> {
  // Returns true if the call is allowed (under global limit), false if circuit open.
  // Fail-closed: any error returns false (deny).
  try {
    const { data, error } = await supabase
      .from('ai_rate_limits')
      .select('call_count')
      .eq('user_id', GLOBAL_SENTINEL)
      .eq('endpoint', GLOBAL_ENDPOINT)
      .eq('window_start', dayKey)
      .maybeSingle();

    if (error) {
      console.error('[ai-guard] global circuit breaker query error (denying):', error);
      return false;
    }

    const count = data?.call_count ?? 0;
    if (count >= GLOBAL_DAILY_LIMIT) return false;

    await supabase.from('ai_rate_limits').upsert(
      { user_id: GLOBAL_SENTINEL, endpoint: GLOBAL_ENDPOINT, window_start: dayKey, call_count: count + 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );
    return true;
  } catch (err) {
    console.error('[ai-guard] global circuit breaker threw (denying):', err);
    return false;
  }
}

// ── Main guard ────────────────────────────────────────────────────────────────
export async function aiGuard(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
): Promise<GuardResult> {
  // 1. Check premium status — fail-closed if query errors
  let isPremium = false;
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[ai-guard] premium check error (denying):', error);
      return { allowed: false, status: 429, error: 'AI features are temporarily unavailable. Please try again.' };
    }
    isPremium = profile?.is_premium === true;
  } catch (err) {
    console.error('[ai-guard] premium check threw (denying):', err);
    return { allowed: false, status: 429, error: 'AI features are temporarily unavailable. Please try again.' };
  }

  const hourlyLimit = isPremium ? PREMIUM_HOURLY_LIMIT : FREE_HOURLY_LIMIT;
  const dailyLimit  = isPremium ? PREMIUM_DAILY_LIMIT  : FREE_DAILY_LIMIT;

  // 2. Global daily circuit breaker — checked before per-user limits
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayKey = dayStart.toISOString();

  const globalAllowed = await checkGlobalCircuitBreaker(supabase, dayKey);
  if (!globalAllowed) {
    return {
      allowed: false,
      status: 429,
      error: 'AI features are temporarily rate-limited. Try again tomorrow.',
    };
  }

  // 3. Hourly window (top of current hour)
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  const hourKey = hourStart.toISOString();

  const hourlyResult = await checkWindow(supabase, userId, hourKey, endpoint, hourlyLimit);
  if (!hourlyResult.allowed) {
    // Undo global increment since we're not making a Claude call
    try {
      const { data } = await supabase
        .from('ai_rate_limits')
        .select('call_count')
        .eq('user_id', GLOBAL_SENTINEL)
        .eq('endpoint', GLOBAL_ENDPOINT)
        .eq('window_start', dayKey)
        .maybeSingle();
      if (data && data.call_count > 0) {
        await supabase.from('ai_rate_limits').upsert(
          { user_id: GLOBAL_SENTINEL, endpoint: GLOBAL_ENDPOINT, window_start: dayKey, call_count: data.call_count - 1 },
          { onConflict: 'user_id,endpoint,window_start' },
        );
      }
    } catch { /* best-effort rollback */ }

    return {
      allowed: false,
      status: 429,
      error: `AI is getting a breather — you've hit the hourly limit (${hourlyLimit} calls/hour). Try again in a few minutes.`,
    };
  }

  // 4. Daily window (start of today UTC)
  const dailyEndpointKey = `${endpoint}:daily`;

  const dailyResult = await checkWindow(supabase, userId, dayKey, dailyEndpointKey, dailyLimit);
  if (!dailyResult.allowed) {
    // Undo the hourly increment so it doesn't count against the user
    try {
      await supabase.from('ai_rate_limits').upsert(
        { user_id: userId, endpoint, window_start: hourKey, call_count: hourlyResult.count - 1 },
        { onConflict: 'user_id,endpoint,window_start' },
      );
    } catch { /* best-effort rollback */ }

    // Undo global increment
    try {
      const { data } = await supabase
        .from('ai_rate_limits')
        .select('call_count')
        .eq('user_id', GLOBAL_SENTINEL)
        .eq('endpoint', GLOBAL_ENDPOINT)
        .eq('window_start', dayKey)
        .maybeSingle();
      if (data && data.call_count > 0) {
        await supabase.from('ai_rate_limits').upsert(
          { user_id: GLOBAL_SENTINEL, endpoint: GLOBAL_ENDPOINT, window_start: dayKey, call_count: data.call_count - 1 },
          { onConflict: 'user_id,endpoint,window_start' },
        );
      }
    } catch { /* best-effort rollback */ }

    return {
      allowed: false,
      status: 429,
      error: `You've used your AI insights for today (${dailyLimit}/day). Check back tomorrow — they reset at midnight UTC.`,
    };
  }

  return { allowed: true, status: 401, error: '' };
}
