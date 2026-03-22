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
 * Both checks must pass. The tighter daily cap is the primary cost guard.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Limits ────────────────────────────────────────────────────────────────────
const FREE_HOURLY_LIMIT   = 3;
const FREE_DAILY_LIMIT    = 5;
const PREMIUM_HOURLY_LIMIT = 20;
const PREMIUM_DAILY_LIMIT  = 20;

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
  const { data: row } = await supabase
    .from('ai_rate_limits')
    .select('call_count')
    .eq('user_id', userId)
    .eq('endpoint', endpointKey)
    .eq('window_start', windowKey)
    .maybeSingle();

  const count = row?.call_count ?? 0;
  if (count >= limit) return { allowed: false, count };

  // Increment (upsert so first call creates the row)
  await supabase.from('ai_rate_limits').upsert(
    { user_id: userId, endpoint: endpointKey, window_start: windowKey, call_count: count + 1 },
    { onConflict: 'user_id,endpoint,window_start' },
  );

  return { allowed: true, count: count + 1 };
}

// ── Main guard ────────────────────────────────────────────────────────────────
export async function aiGuard(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
): Promise<GuardResult> {
  // 1. Check premium status
  const { data: profile } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', userId)
    .maybeSingle();

  const isPremium = profile?.is_premium === true;
  const hourlyLimit = isPremium ? PREMIUM_HOURLY_LIMIT : FREE_HOURLY_LIMIT;
  const dailyLimit  = isPremium ? PREMIUM_DAILY_LIMIT  : FREE_DAILY_LIMIT;

  // 2. Hourly window (top of current hour)
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  const hourKey = hourStart.toISOString();

  const hourlyResult = await checkWindow(supabase, userId, hourKey, endpoint, hourlyLimit);
  if (!hourlyResult.allowed) {
    return {
      allowed: false,
      status: 429,
      error: `AI is getting a breather — you've hit the hourly limit (${hourlyLimit} calls/hour). Try again in a few minutes.`,
    };
  }

  // 3. Daily window (start of today UTC)
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayKey = dayStart.toISOString();
  const dailyEndpointKey = `${endpoint}:daily`;

  const dailyResult = await checkWindow(supabase, userId, dayKey, dailyEndpointKey, dailyLimit);
  if (!dailyResult.allowed) {
    // Undo the hourly increment so it doesn't count against the user
    await supabase.from('ai_rate_limits').upsert(
      { user_id: userId, endpoint, window_start: hourKey, call_count: hourlyResult.count - 1 },
      { onConflict: 'user_id,endpoint,window_start' },
    );
    return {
      allowed: false,
      status: 429,
      error: `You've used your AI insights for today (${dailyLimit}/day). Check back tomorrow — they reset at midnight UTC.`,
    };
  }

  return { allowed: true, status: 401, error: '' };
}
