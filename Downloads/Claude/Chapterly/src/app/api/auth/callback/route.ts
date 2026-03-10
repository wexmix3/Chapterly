export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const admin = createAdminSupabaseClient();
  const { data: existingUser } = await admin
    .from('users')
    .select('id, onboarding_complete')
    .eq('id', data.user.id)
    .single();

  if (!existingUser) {
    // Auto-create user profile
    const email = data.user.email ?? '';
    const handle = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    const displayName = data.user.user_metadata?.full_name ?? 'Reader';

    await admin.from('users').insert({
      id: data.user.id,
      handle,
      display_name: displayName,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
      onboarding_complete: false,
    });

    return NextResponse.redirect(`${origin}/onboarding`);
  }

  if (!existingUser.onboarding_complete) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
