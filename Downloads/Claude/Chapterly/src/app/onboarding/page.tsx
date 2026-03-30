'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { ChevronRight, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';

const AVATAR_OPTIONS = ['📚', '🦉', '🐉', '🌙', '☕', '🌿', '🦋', '⚡'];

const GENRES = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Fantasy', 'Science Fiction',
  'Romance', 'Biography', 'History', 'Science', 'Self-Help',
  'Horror', 'Thriller', 'Literary Fiction', 'Young Adult', 'Graphic Novel',
];

const GOAL_OPTIONS = [
  { value: 6, label: '6 books', badge: 'Casual', desc: 'One every two months' },
  { value: 12, label: '12 books', badge: 'Steady', desc: 'One per month' },
  { value: 24, label: '24 books', badge: 'Avid', desc: 'Two per month' },
  { value: 36, label: '36 books', badge: 'Dedicated', desc: 'Three per month' },
  { value: 52, label: '52 books', badge: 'One per week', desc: 'A book every week' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('📚');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [goal, setGoal] = useState(12);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : prev.length < 5
          ? [...prev, genre]
          : prev
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    await Promise.all([
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || firstName,
          avatar_url: selectedAvatar,
          genres: selectedGenres,
          onboarding_complete: true,
        }),
      }).catch(() => null),
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: new Date().getFullYear(), goal_books: goal }),
      }).catch(() => null),
    ]);
    setSaving(false);
    track({ event: 'goal_set', properties: { goal_books: goal } });
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-all ${
                s === step
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : s < step
                    ? 'border-brand-300 bg-brand-100 text-brand-600'
                    : 'border-ink-200 bg-white text-ink-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-colors ${s < step ? 'bg-brand-300' : 'bg-ink-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Name & Avatar */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-950 mb-1">
                Welcome, {firstName}!
              </h1>
              <p className="text-ink-500">Let&apos;s personalize your reading profile.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">What should we call you?</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={firstName}
                className="w-full px-4 py-3 bg-white border border-ink-200 rounded-2xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-2">Choose your avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center border-2 transition-all ${
                      selectedAvatar === emoji
                        ? 'border-brand-400 bg-brand-50 scale-105 shadow-sm'
                        : 'border-ink-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Genre Interests */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">What do you love to read?</h2>
              <p className="text-ink-500 text-sm">Pick 3–5 genres. We&apos;ll tailor your recommendations.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                const isDisabled = !isSelected && selectedGenres.length >= 5;
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 scale-105'
                        : isDisabled
                          ? 'bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed'
                          : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-ink-400 text-center">
              {selectedGenres.length}/5 selected
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-2xl font-medium transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedGenres.length < 3}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-2xl font-medium transition-colors text-sm flex items-center justify-center gap-1"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Reading Goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">Set your reading goal</h2>
              <p className="text-ink-500 text-sm">How many books do you want to read in {new Date().getFullYear()}?</p>
            </div>

            <div className="space-y-2">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                    goal === opt.value
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-ink-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-semibold ${goal === opt.value ? 'text-brand-700' : 'text-ink-800'}`}>
                      {opt.label}
                    </span>
                    <p className="text-xs text-ink-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    goal === opt.value
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-ink-100 text-ink-500'
                  }`}>
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-2xl font-medium transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Setting up…' : 'Start Reading'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
