'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Exchange code client-side so the PKCE verifier is always in the same
// browser cookie storage that stored it — no server-client cookie mismatch.
function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserSupabaseClient();
      const code = searchParams.get('code');
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const oauthError = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (oauthError) {
        window.location.href = `/login?error=${encodeURIComponent(errorDesc ?? oauthError)}`;
        return;
      }

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'signup' | 'recovery' | 'email',
        });
        if (error) {
          window.location.href = `/login?error=${encodeURIComponent(error.message)}`;
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.href = `/login?error=${encodeURIComponent(error.message)}`;
          return;
        }
      } else {
        window.location.href = '/login?error=no_code';
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?error=auth_failed';
        return;
      }

      // Check if profile exists; create it if this is a first-time OAuth sign-in
      const { data: profile } = await supabase
        .from('users')
        .select('id, onboarding_complete')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) {
        const email = session.user.email ?? '';
        // Apple may give a private relay email like abc123@privaterelay.appleid.com
        // Use the user_metadata name if available, otherwise fall back gracefully
        const displayName =
          session.user.user_metadata?.full_name ??
          session.user.user_metadata?.name ??
          session.user.user_metadata?.display_name ??
          (email && !email.includes('privaterelay') ? email.split('@')[0] : null) ??
          'Reader';
        const rawHandle = displayName !== 'Reader'
          ? displayName
          : email.split('@')[0] || `reader_${Date.now()}`;
        const userHandle = rawHandle
          .replace(/[^a-z0-9_]/gi, '_')
          .toLowerCase()
          .slice(0, 30) || `reader_${Date.now()}`;
        await supabase.from('users').insert({
          id: session.user.id,
          handle: userHandle,
          display_name: displayName,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          onboarding_complete: false,
        });
        window.location.href = '/onboarding';
        return;
      }

      window.location.href = profile.onboarding_complete ? '/dashboard' : '/onboarding';
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm text-ink-500 dark:text-ink-400">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-ink-950">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
