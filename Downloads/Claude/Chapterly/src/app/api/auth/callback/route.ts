export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;

  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const oauthError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Surface OAuth provider errors back to the login page
  if (oauthError) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription ?? oauthError);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerSupabaseClient();

  // Handle email confirmation via token_hash (magic-link / confirm-email flow)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'email',
    });
    if (verifyError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(verifyError.message)}`,
      );
    }
  }

  // Handle OAuth / magic-link code exchange
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }
  }

  if (!code && !token_hash) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Resolve session and create user profile if this is a new account
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const admin = createAdminSupabaseClient();
  const { data: existingUser } = await admin
    .from('users')
    .select('id, onboarding_complete')
    .eq('id', session.user.id)
    .single();

  if (!existingUser) {
    const email = session.user.email ?? '';
    const handle = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase() || `reader_${Date.now()}`;
    const displayName =
      session.user.user_metadata?.full_name ??
      session.user.user_metadata?.display_name ??
      email.split('@')[0] ??
      'Reader';

    await admin.from('users').insert({
      id: session.user.id,
      handle,
      display_name: displayName,
      avatar_url: session.user.user_metadata?.avatar_url ?? null,
      onboarding_complete: false,
    });

    return NextResponse.redirect(`${origin}/onboarding`);
  }

  if (!existingUser.onboarding_complete) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
