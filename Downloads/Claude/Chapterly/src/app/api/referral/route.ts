export const dynamic = 'force-dynamic';

/**
 * GET /api/referral
 *   Returns the current user's referral code (auto-generates if missing)
 *   and the number of users they've referred.
 *
 * POST /api/referral  { ref_code: string }
 *   Links a new signup to a referrer. Called from /api/auth/callback
 *   when a `ref` param is present. Uses service-role client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

function generateCode(userId: string): string {
  // Deterministic 8-char alphanumeric code derived from userId + timestamp salt
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no ambiguous chars
  const seed = userId.replace(/-/g, '').slice(0, 8) + Date.now().toString(36);
  return Array.from({ length: 8 }, (_, i) => chars[seed.charCodeAt(i) % chars.length]).join('');
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // Fetch or auto-generate referral code
  let { data: user } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (!user?.referral_code) {
    const code = generateCode(userId);
    const admin = createAdminSupabaseClient();
    await admin.from('users').update({ referral_code: code }).eq('id', userId);
    user = { referral_code: code };
  }

  // Count referrals
  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', userId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chapterly.app';
  return NextResponse.json({
    code: user.referral_code,
    link: `${appUrl}/login?ref=${user.referral_code}`,
    referral_count: count ?? 0,
  });
}

// Called server-side from auth callback when a new user signs up via a referral link
export async function POST(req: NextRequest) {
  const body = await req.json() as { ref_code?: string; new_user_id?: string };
  const { ref_code, new_user_id } = body;
  if (!ref_code || !new_user_id) {
    return NextResponse.json({ error: 'ref_code and new_user_id are required' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Find referrer by code
  const { data: referrer } = await admin
    .from('users')
    .select('id')
    .eq('referral_code', ref_code)
    .maybeSingle();

  if (!referrer) return NextResponse.json({ ok: false, reason: 'invalid_code' });
  if (referrer.id === new_user_id) return NextResponse.json({ ok: false, reason: 'self_referral' });

  // Link referred_by on the new user
  await admin.from('users').update({ referred_by: referrer.id }).eq('id', new_user_id);

  // Insert referrals ledger row (upsert ignores duplicate referred_id)
  await admin.from('referrals').upsert(
    { referrer_id: referrer.id, referred_id: new_user_id },
    { onConflict: 'referred_id', ignoreDuplicates: true },
  );

  return NextResponse.json({ ok: true });
}
