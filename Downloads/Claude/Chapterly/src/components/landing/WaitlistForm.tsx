'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Something went wrong');
      }
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
        <p className="text-sm font-medium text-ink-700">
          You&apos;re on the list! We&apos;ll keep you posted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${compact ? 'flex-row max-w-xs mx-auto' : 'flex-col sm:flex-row max-w-md mx-auto'}`}>
      <div className="relative flex-1">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={compact ? 'Email address' : 'Your email address'}
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-ink-200 bg-white text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 bg-ink-200 text-ink-700 hover:bg-ink-300 rounded-full text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap`}
      >
        {status === 'loading' ? 'Joining…' : compact ? 'Notify me' : 'Get notified'}
        {status !== 'loading' && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center w-full">{error}</p>
      )}
    </form>
  );
}
