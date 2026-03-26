export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/health
 * Lightweight health check that verifies DB connectivity.
 * Returns 200 with status details on success, 503 on DB failure.
 * Useful for Vercel uptime monitoring and debugging production issues.
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // DB connectivity check
  try {
    const admin = createAdminSupabaseClient();
    const t0 = Date.now();
    const { error } = await admin.from('users').select('id').limit(1);
    checks.db = error
      ? { ok: false, error: error.message }
      : { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    checks.db = { ok: false, error: String(err) };
  }

  // Environment variable check (no values exposed)
  checks.env = {
    ok: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  };

  const allOk = Object.values(checks).every(c => c.ok);
  return NextResponse.json(
    { ok: allOk, checks, total_ms: Date.now() - start },
    { status: allOk ? 200 : 503 },
  );
}
