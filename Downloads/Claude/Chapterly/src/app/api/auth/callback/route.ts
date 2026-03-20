export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;

  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const oauthError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (oauthError) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription ?? oauthError);
    return NextResponse.redirect(loginUrl);
  }

  if (!code && !token_hash) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Collect all cookies that Supabase wants to set so we can attach them to
  // whichever redirect response we ultimately return.
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read PKCE verifier + existing session cookies from the incoming request
          return request.cookies.getAll();
        },
        setAll(items) {
          items.forEach((item) => cookiesToSet.push(item as typeof cookiesToSet[0]));
        },
      },
    },
  );

  function redirect(destination: string) {
    const res = NextResponse.redirect(destination);
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]));
    return res;
  }

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

  // Handle OAuth PKCE code exchange
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }
  }

  // Resolve session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Create user profile if this is a new account
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

    return redirect(`${origin}/onboarding`);
  }

  if (!existingUser.onboarding_complete) {
    return redirect(`${origin}/onboarding`);
  }

  return redirect(`${origin}${next}`);
}
