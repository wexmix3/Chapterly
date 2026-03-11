'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import {
  Loader2, Eye, EyeOff, AlertCircle, BookOpen, CheckCircle, X,
} from 'lucide-react';
import Link from 'next/link';
import OtpInput from '@/components/ui/OtpInput';

type Mode = 'signin' | 'signup' | 'verify' | 'forgot';

// Google logo SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26A5.43 5.43 0 0 1 9 14.74a5.42 5.42 0 0 1-5.1-3.74H.9v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.9 11a5.4 5.4 0 0 1 0-3.46V5.21H.9a9 9 0 0 0 0 8.08L3.9 11Z" />
      <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .9 5.2L3.9 7.54A5.42 5.42 0 0 1 9 3.58Z" />
    </svg>
  );
}

// Apple logo SVG
function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.6 0 663.1 0 541c0-207.5 134.4-317.4 266.5-317.4 69.4 0 127.1 45.7 170.1 45.7 40.9 0 108.2-48.1 185.5-48.1 14.2 0 117.7 2 188.1 92.4zm-56.3-241.2c33.7-40.3 57.5-96.2 57.5-152.1 0-7.8-.6-15.7-1.9-22.2-54.7 2-118.7 36.7-157.6 85-33.7 40.3-63.2 96.2-63.2 152.8 0 8.4 1.3 16.8 1.9 19.4 3.2.6 8.4 1.3 13.6 1.3 49.4 0 109.5-33.1 149.7-84.2z" />
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (!password) return null;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-brand-400', 'bg-emerald-500'];
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-ink-100'}`} />
        ))}
      </div>
      <span className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-brand-500' : 'text-emerald-600'}`}>
        {labels[score - 1] ?? ''}
      </span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    user, loading, error, setError,
    signInWithGoogle, signInWithApple,
    signInWithEmail, signUpWithEmail,
    verifyOtp, resendOtp, resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [urlError, setUrlError] = useState('');

  // Read error from URL params
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      const msg = err === 'auth_failed' ? 'Authentication failed. Please try again.' : decodeURIComponent(err);
      setUrlError(msg);
    }
    // Check if returning from password reset
    const modeParam = searchParams.get('mode');
    if (modeParam === 'reset') setMode('forgot');
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setUrlError('');
    setOtpError(false);
    setResetSent(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await signInWithEmail(email, password);
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const result = await signUpWithEmail(email, password, displayName || email.split('@')[0]);
    setSubmitting(false);
    if (result.success) {
      if (result.needsVerification) {
        switchMode('verify');
      } else {
        // No verification needed — session is live, useEffect redirect handles it
      }
    }
  };

  const handleOtpComplete = async (code: string) => {
    setOtpVerifying(true);
    setOtpError(false);
    const ok = await verifyOtp(email, code);
    if (ok) {
      setOtpVerified(true);
      // Create profile and redirect
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: existing } = await supabase
            .from('users').select('id, onboarding_complete').eq('id', session.user.id).maybeSingle();
          if (!existing) {
            const handle = (session.user.email?.split('@')[0] ?? `reader_${Date.now()}`)
              .replace(/[^a-z0-9_]/gi, '_').toLowerCase();
            await supabase.from('users').insert({
              id: session.user.id,
              handle,
              display_name: displayName || session.user.email?.split('@')[0] || 'Reader',
              avatar_url: null,
              onboarding_complete: false,
            });
            setTimeout(() => router.push('/onboarding'), 1500);
            return;
          }
          setTimeout(() => router.push(existing.onboarding_complete ? '/dashboard' : '/onboarding'), 1500);
        }
      } catch {
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } else {
      setOtpError(true);
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    await resendOtp(email);
    setResendCooldown(60);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await resetPassword(email);
    setSubmitting(false);
    if (ok) setResetSent(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const displayError = error || urlError;

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-950 dark:text-paper-50">Chapterly</h1>
          <p className="text-ink-500 dark:text-ink-400 text-sm mt-1">Track, Share, Read More.</p>
        </div>

        {/* OTP Verify Screen */}
        {mode === 'verify' && (
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-8 shadow-sm">
            {otpVerified ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-paper-100 mb-1">Verified!</h2>
                <p className="text-sm text-ink-500">Redirecting you now…</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-3">📬</span>
                  <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-paper-100 mb-1">Check your email</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    We sent a 6-digit code to<br />
                    <strong className="text-ink-700 dark:text-ink-300">{email}</strong>
                  </p>
                </div>

                <OtpInput onComplete={handleOtpComplete} error={otpError} disabled={otpVerifying} />

                {displayError && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </div>
                )}

                {otpVerifying && !otpVerified && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </div>
                )}

                <div className="mt-6 text-center space-y-2">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-sm text-brand-600 hover:underline disabled:text-ink-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive it? Resend"}
                  </button>
                  <br />
                  <button onClick={() => switchMode('signup')} className="text-xs text-ink-400 hover:text-ink-600">
                    Use a different email
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Forgot Password Screen */}
        {mode === 'forgot' && (
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-8 shadow-sm">
            {resetSent ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✉️</span>
                <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-paper-100 mb-1">Check your inbox</h2>
                <p className="text-sm text-ink-500 mb-6">We sent a password reset link to <strong>{email}</strong>.</p>
                <button onClick={() => switchMode('signin')} className="text-sm text-brand-600 hover:underline">
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-paper-100 mb-1">Reset password</h2>
                <p className="text-sm text-ink-500 mb-6">Enter your email and we'll send you a reset link.</p>

                {displayError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{displayError}</span>
                    <button onClick={() => { setError(null); setUrlError(''); }}><X className="w-4 h-4" /></button>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <input
                    type="email" required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                  />
                  <button type="submit" disabled={submitting}
                    className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Reset Link
                  </button>
                </form>

                <p className="text-center mt-4">
                  <button onClick={() => switchMode('signin')} className="text-sm text-brand-600 hover:underline">
                    Back to sign in
                  </button>
                </p>
              </>
            )}
          </div>
        )}

        {/* Sign In / Sign Up Screens */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-8 shadow-sm">
            {/* Tab toggle */}
            <div className="flex bg-ink-50 dark:bg-ink-800 rounded-xl p-1 gap-1 mb-6">
              {(['signin', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m
                    ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-paper-100 shadow-sm'
                    : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
                  }`}>
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* URL / auth error banner */}
            {displayError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{displayError}</span>
                <button onClick={() => { setError(null); setUrlError(''); }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* OAuth buttons */}
            <div className="space-y-2.5 mb-5">
              <button onClick={() => { setError(null); signInWithGoogle(); }}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:border-ink-300 hover:bg-ink-50 dark:hover:bg-ink-750 rounded-xl text-sm font-medium text-ink-700 dark:text-ink-300 transition-all shadow-sm">
                <GoogleIcon />
                Continue with Google
              </button>
              <button onClick={() => { setError(null); signInWithApple(); }}
                className="w-full flex items-center justify-center gap-3 py-3 bg-ink-950 dark:bg-white border border-ink-900 dark:border-ink-200 hover:bg-ink-800 dark:hover:bg-ink-100 rounded-xl text-sm font-medium text-white dark:text-ink-900 transition-all shadow-sm">
                <AppleIcon />
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-ink-100 dark:bg-ink-800" />
              <span className="text-xs text-ink-400">or continue with email</span>
              <div className="flex-1 h-px bg-ink-100 dark:bg-ink-800" />
            </div>

            {/* Sign In form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <input
                  type="email" required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                />
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right">
                  <button type="button" onClick={() => switchMode('forgot')}
                    className="text-xs text-brand-600 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
                </button>
              </form>
            )}

            {/* Sign Up form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                />
                <input
                  type="email" required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                />
                <div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required minLength={6}
                      placeholder="Password (min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'} required
                    placeholder="Confirm password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 dark:text-paper-100 placeholder:text-ink-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Account
                </button>
              </form>
            )}

            <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-4">
              By continuing, you agree to our terms of service.
            </p>
          </div>
        )}

        {/* Demo link */}
        {mode !== 'verify' && (
          <div className="text-center mt-6">
            <Link href="/demo" className="text-sm text-ink-500 hover:text-brand-600 transition-colors">
              Just browsing? <span className="font-medium text-brand-600">Try the demo →</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
