import type { SupabaseClient } from '@supabase/supabase-js';

const TTL_HOURS: Record<string, number> = {
  insights:    48,
  personality: 168,  // ~7 days — personality changes rarely
  mood:        24,
  recommend:   48,
  dna:         168,  // ~7 days
  archetype:   168,  // ~7 days
};

export async function getCachedAI(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  cacheKey: string,
): Promise<unknown | null> {
  const ttlHours = TTL_HOURS[endpoint] ?? 24;
  const cutoff = new Date(Date.now() - ttlHours * 3600 * 1000).toISOString();
  try {
    const { data } = await supabase
      .from('ai_cache')
      .select('response')
      .eq('user_id', userId)
      .eq('cache_key', cacheKey)
      .gte('created_at', cutoff)
      .maybeSingle();
    return data?.response ?? null;
  } catch {
    // Cache miss on error — let the caller proceed to Claude
    return null;
  }
}

export async function setCachedAI(
  supabase: SupabaseClient,
  userId: string,
  cacheKey: string,
  response: unknown,
): Promise<void> {
  try {
    await supabase.from('ai_cache').upsert(
      { user_id: userId, cache_key: cacheKey, response, created_at: new Date().toISOString() },
      { onConflict: 'user_id,cache_key' },
    );
  } catch {
    // Non-fatal: cache write failure should not block the response
  }
}
