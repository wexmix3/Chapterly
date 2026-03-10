'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, authError } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const err = await signUpWithEmail(email, password);
        if (err) { setLocalError(err); } else { setEmailSent(true); }
      } else {
        const err = await signInWithEmail(email, password);
        if (err) setLocalError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  if (emailSent) {
    return (
      <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <span className="text-5xl block mb-4">📬</span>
          <h1 className="font-display text-2xl font-bold text-ink-950 mb-2">Check your inbox</h1>
          <p className="text-ink-500 mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <button onClick={() => setEmailSent(false)} className="text-sm text-brand-600 hover:underline">Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-5xl block mb-4">📖</span>
          <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">Chapterly</h1>
          <p className="text-ink-500">Track, Share, Read More.</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-ink-500 mb-6">
            {mode === 'signin' ? 'Sign in to your reading journal' : 'Start your reading journey'}
          </p>

          {/* Google OAuth */}
          <button onClick={() => { setLocalError(''); signInWithGoogle(); }}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-ink-200 hover:border-ink-300 hover:bg-ink-50 rounded-xl text-sm font-medium text-ink-700 transition-all shadow-sm mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z"/>
              <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26A5.43 5.43 0 0 1 9 14.74a5.42 5.42 0 0 1-5.1-3.74H.9v2.33A9 9 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.9 11a5.4 5.4 0 0 1 0-3.46V5.21H.9a9 9 0 0 0 0 8.08L3.9 11Z"/>
              <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .9 5.2L3.9 7.54A5.42 5.42 0 0 1 9 3.58Z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-xs text-ink-400">or</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 placeholder:text-ink-400 transition-all"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-ink-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 placeholder:text-ink-400 transition-all"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {displayError}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-xs text-ink-400 mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setLocalError(''); }}
              className="text-brand-600 hover:underline font-medium">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="text-xs text-ink-400 text-center mt-3">
            By signing in, you agree to our terms of service.
          </p>
        </div>

        {/* Demo link */}
        <div className="text-center mt-6">
          <Link href="/demo" className="text-sm text-ink-500 hover:text-brand-600 transition-colors">
            Just browsing? <span className="font-medium text-brand-600">Try the demo →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
