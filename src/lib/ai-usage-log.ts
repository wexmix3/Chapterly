import type { SupabaseClient } from '@supabase/supabase-js';

export function logAIUsage(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  inputTokens: number,
  outputTokens: number,
  cached: boolean,
): void {
  // Fire and forget — do not await, do not block response
  void supabase.from('ai_usage_log').insert({
    user_id: userId,
    endpoint,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cached,
    created_at: new Date().toISOString(),
  });
}
