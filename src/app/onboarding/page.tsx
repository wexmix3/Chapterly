'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import GoodreadsImport from '@/components/books/GoodreadsImport';
import { ChevronRight, Minus, Plus, Loader2, Brain, Sparkles, BarChart2, BookOpen } from 'lucide-react';

const GOAL_PRESETS = [6, 12, 24, 52];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(12);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const handleFinish = async () => {
    setSaving(true);
    // Save yearly reading challenge + mark onboarding complete
    const [challengeRes, profileRes] = await Promise.all([
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: new Date().getFullYear(), goal_books: goal }),
      }).catch(() => null),
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_complete: true }),
      }).catch(() => null),
    ]);

    setSaving(false);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-brand-500' : s < step ? 'w-4 bg-brand-300' : 'w-4 bg-ink-200'
              }`} />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <span className="text-6xl block">📖</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">
                Welcome, {name}!
              </h1>
              <p className="text-ink-500">Let&apos;s set up your reading journal in two quick steps.</p>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2">
              Let&apos;s go <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Import */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">Import your library</h2>
              <p className="text-ink-500 text-sm">Already on Goodreads? Bring your books over.</p>
            </div>
            <GoodreadsImport />
            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className="flex-1 py-3 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-2xl font-medium transition-colors text-sm">
                Skip
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-medium transition-colors text-sm flex items-center justify-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">Set your reading goal</h2>
              <p className="text-ink-500 text-sm">How many books do you want to read this year?</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setGoal(Math.max(1, goal - 1))}
                className="w-12 h-12 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors">
                <Minus className="w-4 h-4 text-ink-700" />
              </button>
              <div className="text-center">
                <span className="font-display text-5xl font-bold text-ink-950">{goal}</span>
                <p className="text-sm text-ink-500 mt-1">books in {new Date().getFullYear()}</p>
              </div>
              <button onClick={() => setGoal(goal + 1)}
                className="w-12 h-12 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-ink-700" />
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2">
              {GOAL_PRESETS.map((p) => (
                <button key={p} onClick={() => setGoal(p)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    goal === p ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-ink-400">
              {goal <= 6 ? 'Casual reader 🌱' : goal <= 12 ? 'One a month 📅' : goal <= 24 ? 'Avid reader 📚' : 'Bookworm 🐛'}
            </p>

            <button onClick={() => setStep(4)}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4: AI Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-5xl block mb-3">🤖</span>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">Your AI reading companion</h2>
              <p className="text-ink-500 text-sm">After your first book, Chapterly unlocks personalized insights just for you.</p>
            </div>

            {/* Sample insight cards */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-violet-50 to-brand-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-0.5">Reading Personality</p>
                  <p className="text-sm font-medium text-ink-800">&ldquo;Adventure Seeker&rdquo;</p>
                  <p className="text-xs text-ink-500">You gravitate toward fast-paced stories with high stakes and bold protagonists.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">Next Read</p>
                  <p className="text-sm font-medium text-ink-800">Tailored recommendations</p>
                  <p className="text-xs text-ink-500">AI picks based on your taste, mood, and reading history — not bestseller lists.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Reading Patterns</p>
                  <p className="text-sm font-medium text-ink-800">When &amp; how you read best</p>
                  <p className="text-xs text-ink-500">Discover your peak reading hours, average pace, and genre trends.</p>
                </div>
              </div>
            </div>

            <button onClick={handleFinish} disabled={saving}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Start Reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
