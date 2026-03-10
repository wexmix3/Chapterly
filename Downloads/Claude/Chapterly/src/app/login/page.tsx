'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-5xl block mb-4">📖</span>
          <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">Chapterly</h1>
          <p className="text-ink-500">Track, Share, Read More.</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">Welcome back</h2>
          <p className="text-sm text-ink-500 mb-6">Sign in to your reading journal</p>

          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-ink-200 hover:border-ink-300 hover:bg-ink-50 rounded-xl text-sm font-medium text-ink-700 transition-all shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"/>
              <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26A5.43 5.43 0 0 1 9 14.74a5.42 5.42 0 0 1-5.1-3.74H.9v2.33A9 9 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.9 11a5.4 5.4 0 0 1 0-3.46V5.21H.9a9 9 0 0 0 0 8.08L3.9 11Z"/>
              <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .9 5.2L3.9 7.54A5.42 5.42 0 0 1 9 3.58Z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-ink-400 text-center mt-4">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
