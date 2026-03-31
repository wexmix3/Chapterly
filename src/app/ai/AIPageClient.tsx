'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import PremiumGate from '@/components/ui/PremiumGate';
import {
  Sparkles, BookOpen, RefreshCw, Loader2, Plus, Check,
  Brain, TrendingUp, Clock, Star, Zap, AlertCircle, Target, Dna,
  GraduationCap, MessageSquare, Lightbulb, Bell, ChevronDown, ChevronRight,
} from 'lucide-react';
import { track } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recommendation {
  title: string;
  author: string;
  why: string;
  genre: string;
  vibe: string;
  cover_url?: string | null;
  description?: string | null;
}

interface Insight {
  emoji: string;
  title: string;
  body: string;
  type: 'pattern' | 'achievement' | 'suggestion' | 'encouragement';
}

interface Personality {
  type: string;
  badge: string;
  tagline: string;
  element: string;
  traits: string[];
}

interface MoodRec {
  title: string;
  author: string;
  why: string;
  genre: string;
  vibe: string;
  cover_url?: string | null;
}

interface PacePrediction {
  user_book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  current_page: number;
  total_pages: number;
  progress_pct: number;
  pages_left: number;
  avg_pages_per_day: number;
  days_to_finish: number | null;
  finish_date: string | null;
  sessions_used: number;
}

interface GenreSlice {
  genre: string;
  pct: number;
  count: number;
}

interface DNAResult {
  top_genres: GenreSlice[];
  themes: string[];
  author_patterns: string;
  summary: string;
}

interface CoachPrompt {
  question: string;
  purpose: string;
}

interface PreSessionCoach {
  mode: 'pre_session';
  prompts: CoachPrompt[];
  tip: string;
  _cached?: boolean;
}

interface PostBookCoach {
  mode: 'post_book';
  discussion_questions: string[];
  key_themes: string[];
  retention_summary: string;
  read_alike_prompt: string;
  _cached?: boolean;
}

type CoachResult = PreSessionCoach | PostBookCoach;

interface HabitNudge {
  optimal_window: string;
  nudge_message: string;
  micro_goal: string;
  why_it_matters: string;
  current_streak: number;
  _cached?: boolean;
}

interface ShelfBook {
  id: string;
  status: string;
  current_page: number | null;
  book: { id: string; title: string; authors: string[] } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface ElementStyle {
  gradient: string;
  ring: string;
  glow: string;
  text: string;
  badge: string;
}

const ELEMENT_STYLES: Record<string, ElementStyle> = {
  fire:      { gradient: 'from-brand-100 to-brand-200',  ring: 'ring-brand-400', glow: 'shadow-brand-200',  text: 'text-brand-700', badge: 'bg-brand-500 text-white' },
  water:     { gradient: 'from-paper-100 to-brand-50',   ring: 'ring-brand-200', glow: 'shadow-brand-100',  text: 'text-brand-600', badge: 'bg-brand-400 text-white' },
  earth:     { gradient: 'from-brand-50 to-paper-200',   ring: 'ring-brand-300', glow: 'shadow-brand-150',  text: 'text-brand-800', badge: 'bg-brand-600 text-white' },
  air:       { gradient: 'from-paper-50 to-brand-50',    ring: 'ring-brand-200', glow: 'shadow-paper-300',  text: 'text-brand-500', badge: 'bg-brand-300 text-ink-800' },
  lightning: { gradient: 'from-brand-200 to-brand-300',  ring: 'ring-brand-500', glow: 'shadow-brand-300',  text: 'text-brand-900', badge: 'bg-brand-700 text-white' },
  moon:      { gradient: 'from-ink-50 to-brand-50',      ring: 'ring-brand-200', glow: 'shadow-brand-100',  text: 'text-ink-700',   badge: 'bg-ink-700 text-white' },
};

const INSIGHT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  pattern:      { border: 'border-l-brand-300',  bg: 'bg-brand-50',    icon: 'text-brand-600' },
  achievement:  { border: 'border-l-brand-400',  bg: 'bg-brand-50',    icon: 'text-brand-700' },
  suggestion:   { border: 'border-l-brand-200',  bg: 'bg-paper-100',   icon: 'text-brand-600' },
  encouragement:{ border: 'border-l-brand-300',  bg: 'bg-paper-50',    icon: 'text-brand-500' },
};

const REC_GRADIENTS = [
  'from-brand-50 to-paper-200',
  'from-brand-100 to-paper-100',
  'from-paper-100 to-brand-50',
  'from-brand-50 to-brand-100',
  'from-paper-200 to-brand-50',
  'from-brand-100 to-paper-200',
];

const MOODS = [
  { label: 'Adventurous', emoji: '🗺️', prompt: 'exciting adventure or travel' },
  { label: 'Cozy', emoji: '☕', prompt: 'cozy, warm, feel-good' },
  { label: 'Thoughtful', emoji: '🧠', prompt: 'thought-provoking, philosophical, or literary' },
  { label: 'Thrilled', emoji: '😱', prompt: 'gripping thriller or suspense' },
  { label: 'Romantic', emoji: '💕', prompt: 'romantic and heartfelt' },
  { label: 'Inspired', emoji: '✨', prompt: 'motivating or inspiring nonfiction' },
  { label: 'Escapist', emoji: '🔮', prompt: 'fantasy or magical escapism' },
  { label: 'Funny', emoji: '😂', prompt: 'funny, witty, or lighthearted' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIPageClient() {
  const [activeTab, setActiveTab] = useState<'picks' | 'insights' | 'personality' | 'mood' | 'coach'>('picks');

  // Recommendations
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);
  const [recsError, setRecsError] = useState('');
  const [recsMessage, setRecsMessage] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Insights
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [insightsCached, setInsightsCached] = useState(false);
  const [insightsLoadedAt, setInsightsLoadedAt] = useState<Date | null>(null);

  // Personality
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [personalityLoading, setPersonalityLoading] = useState(false);
  const [personalityLoaded, setPersonalityLoaded] = useState(false);
  const [personalityError, setPersonalityError] = useState('');
  const [personalityCached, setPersonalityCached] = useState(false);

  // Mood
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number] | null>(null);
  const [moodRecs, setMoodRecs] = useState<MoodRec[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState('');

  // Pace predictions
  const [pace, setPace] = useState<PacePrediction[]>([]);
  const [paceLoading, setPaceLoading] = useState(false);
  const [paceLoaded, setPaceLoaded] = useState(false);

  // DNA
  const [dna, setDna] = useState<DNAResult | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [dnaLoaded, setDnaLoaded] = useState(false);

  // Reading Coach
  const [coachBooks, setCoachBooks] = useState<ShelfBook[]>([]);
  const [selectedCoachBook, setSelectedCoachBook] = useState<ShelfBook | null>(null);
  const [coachMode, setCoachMode] = useState<'pre_session' | 'post_book'>('pre_session');
  const [coachResult, setCoachResult] = useState<CoachResult | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');

  // Habit Nudge
  const [nudge, setNudge] = useState<HabitNudge | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeLoaded, setNudgeLoaded] = useState(false);

  // Premium status
  const [isPremium, setIsPremium] = useState(false);

  // Load premium status once on mount
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data?.is_premium) setIsPremium(true); })
      .catch(() => {});
  }, []);

  // Load on tab switch
  useEffect(() => {
    if (activeTab === 'picks' && !recsLoaded) loadRecs();
    if (activeTab === 'insights') {
      if (!insightsLoaded) loadInsights();
      if (!paceLoaded) loadPace();
      if (!dnaLoaded) loadDNA();
    }
    if (activeTab === 'personality' && !personalityLoaded) loadPersonality();
    if (activeTab === 'coach') {
      loadCoachBooks();
      if (!nudgeLoaded) loadNudge();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecs = async (refresh = false) => {
    setRecsLoading(true); setRecsError('');
    try {
      const url = refresh ? '/api/ai/recommend?refresh=true' : '/api/ai/recommend';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecs(data.recommendations ?? []);
      if (data.message) setRecsMessage(data.message);
      setRecsLoaded(true);
      track({ event: 'ai_feature_used', properties: { feature: 'recommend' } });
    } catch (e) {
      setRecsError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setRecsLoading(false);
    }
  };

  const loadInsights = async (refresh = false) => {
    setInsightsLoading(true); setInsightsError('');
    try {
      const url = refresh ? '/api/ai/insights?refresh=true' : '/api/ai/insights';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInsights(data.insights ?? []);
      setInsightsCached(!!data._cached);
      setInsightsLoadedAt(new Date());
      setInsightsLoaded(true);
      track({ event: 'ai_feature_used', properties: { feature: 'insights' } });
    } catch (e) {
      setInsightsError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setInsightsLoading(false);
    }
  };

  const loadPersonality = async (refresh = false) => {
    setPersonalityLoading(true); setPersonalityError('');
    try {
      const url = refresh ? '/api/ai/personality?refresh=true' : '/api/ai/personality';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPersonality(data);
      setPersonalityCached(!!data._cached);
      setPersonalityLoaded(true);
      track({ event: 'ai_feature_used', properties: { feature: 'personality' } });
    } catch (e) {
      setPersonalityError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setPersonalityLoading(false);
    }
  };

  const loadMoodRecs = async (mood: typeof MOODS[number]) => {
    setSelectedMood(mood); setMoodLoading(true); setMoodError(''); setMoodRecs([]);
    try {
      const res = await fetch(`/api/ai/mood?mood=${encodeURIComponent(mood.label)}&prompt=${encodeURIComponent(mood.prompt)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMoodRecs(data.recommendations ?? []);
      track({ event: 'ai_feature_used', properties: { feature: 'mood' } });
    } catch (e) {
      setMoodError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setMoodLoading(false);
    }
  };

  const loadPace = async () => {
    setPaceLoading(true);
    try {
      const res = await fetch('/api/ai/pace');
      const data = await res.json();
      if (res.ok) setPace(data.predictions ?? []);
      setPaceLoaded(true);
    } catch {
      setPaceLoaded(true);
    } finally {
      setPaceLoading(false);
    }
  };

  const loadDNA = async () => {
    setDnaLoading(true);
    try {
      const res = await fetch('/api/ai/dna');
      const data = await res.json();
      if (res.ok) setDna(data);
      setDnaLoaded(true);
    } catch {
      setDnaLoaded(true);
    } finally {
      setDnaLoading(false);
    }
  };

  const loadCoachBooks = async () => {
    try {
      const [readingRes, readRes] = await Promise.all([
        fetch('/api/user-books?status=reading&limit=10'),
        fetch('/api/user-books?status=read&limit=10'),
      ]);
      const [readingData, readData] = await Promise.all([
        readingRes.ok ? readingRes.json() : { data: [] },
        readRes.ok ? readRes.json() : { data: [] },
      ]);
      const books: ShelfBook[] = [
        ...((readingData.data ?? []) as ShelfBook[]),
        ...((readData.data ?? []) as ShelfBook[]),
      ];
      setCoachBooks(books);
      const reading = books.find(b => b.status === 'reading');
      if (reading && !selectedCoachBook) setSelectedCoachBook(reading);
    } catch { /* ignore */ }
  };

  const loadCoach = async (book: ShelfBook, mode: 'pre_session' | 'post_book', refresh = false) => {
    setCoachLoading(true); setCoachError(''); setCoachResult(null);
    try {
      const res = await fetch('/api/ai/reading-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_book_id: book.id, mode, refresh }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setCoachResult(data as CoachResult);
      track({ event: 'ai_feature_used', properties: { feature: 'reading-coach', mode } });
    } catch (e) {
      setCoachError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setCoachLoading(false);
    }
  };

  const loadNudge = async () => {
    setNudgeLoading(true);
    try {
      const res = await fetch('/api/ai/habit-nudge');
      const data = await res.json();
      if (res.ok) { setNudge(data as HabitNudge); setNudgeLoaded(true); }
    } catch { /* ignore */ } finally {
      setNudgeLoading(false);
    }
  };

  const handleAddToShelf = async (title: string, author: string) => {
    const key = `${title}-${author}`;
    if (added.has(key)) return;
    try {
      const searchRes = await fetch(`/api/books/search?q=${encodeURIComponent(`${title} ${author}`)}`);
      const searchData = await searchRes.json();
      const book = searchData.data?.[0];
      if (!book) return;
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResult: book, status: 'to_read' }),
      });
      if (res.ok || res.status === 409) setAdded(prev => new Set(prev).add(key));
    } catch { /* ignore */ }
  };

  const TABS = [
    { id: 'picks' as const,       label: 'For You',    icon: Star },
    { id: 'insights' as const,    label: 'Insights',   icon: TrendingUp },
    { id: 'personality' as const, label: 'My Type',    icon: Brain },
    { id: 'mood' as const,        label: 'By Mood',    icon: Zap },
    { id: 'coach' as const,       label: 'Coach',      icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink-900">AI Reading Hub</h1>
            </div>
            <p className="text-sm text-ink-400 ml-12">Powered by Claude — personalized to your reading life</p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-white border border-ink-100 rounded-2xl p-1 mb-6 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-ink-400 hover:text-ink-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab: For You ── */}
          {activeTab === 'picks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-800">Picked For You</h2>
                  <p className="text-xs text-ink-400">Claude analyzed your shelf to find these</p>
                </div>
                {recsLoaded && (
                  <button onClick={() => loadRecs(true)}
                    disabled={recsLoading}
                    title="Refresh recommendations"
                    className="w-8 h-8 rounded-xl bg-paper-100 border border-paper-200 flex items-center justify-center hover:bg-paper-200 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 text-ink-500 ${recsLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {recsLoading ? (
                <LoadingCard message="Claude is analyzing your taste…" />
              ) : recsError ? (
                <ErrorCard message={recsError} onRetry={() => { setRecsLoaded(false); loadRecs(); }} />
              ) : recsMessage && recs.length === 0 ? (
                <EmptyCard icon="📚" message={recsMessage} />
              ) : (
                <div className="space-y-3">
                  {recs.map((rec, i) => (
                    <RecommendationCard
                      key={`${rec.title}-${i}`}
                      rec={rec}
                      gradient={REC_GRADIENTS[i % REC_GRADIENTS.length]}
                      isAdded={added.has(`${rec.title}-${rec.author}`)}
                      onAdd={() => handleAddToShelf(rec.title, rec.author)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Insights ── */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Reading Insights section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-800">Reading Insights</h2>
                    <p className="text-xs text-ink-400">Patterns and coaching from your last 30 days</p>
                  </div>
                    {insightsLoaded && (
                    <div className="flex items-center gap-2">
                      {insightsCached && insightsLoadedAt && (
                        <span className="text-[10px] text-ink-400">Updated just now</span>
                      )}
                      <button onClick={() => loadInsights(true)}
                        disabled={insightsLoading}
                        title="Refresh insights"
                        className="w-8 h-8 rounded-xl bg-paper-100 border border-paper-200 flex items-center justify-center hover:bg-paper-200 transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 text-ink-500 ${insightsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>

                {insightsLoading ? (
                  <LoadingCard message="Analyzing your reading patterns…" />
                ) : insightsError ? (
                  <ErrorCard message={insightsError} onRetry={() => { setInsightsLoaded(false); loadInsights(); }} />
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight, i) => {
                      const cfg = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.encouragement;
                      return (
                        <div key={i} className={`rounded-2xl p-4 border-l-2 ${cfg.border} ${cfg.bg} border border-ink-100 bg-white`}>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{insight.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm text-ink-900 leading-snug">{insight.title}</p>
                              <p className="text-xs text-ink-500 leading-relaxed mt-1">{insight.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {insights.length === 0 && !insightsLoading && (
                      <EmptyCard icon="📖" message="Log 3+ reading sessions to unlock your insights." />
                    )}
                  </div>
                )}
              </div>

              {/* Finish Line card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-500" />
                  <h2 className="font-display text-base font-semibold text-ink-800">Finish Line</h2>
                </div>
                <p className="text-xs text-ink-400 -mt-1">At your current pace, you&apos;ll finish these by…</p>

                {paceLoading ? (
                  <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    <span className="text-sm text-ink-400">Calculating your pace…</span>
                  </div>
                ) : pace.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-ink-100 p-5 text-center">
                    <BookOpen className="w-7 h-7 text-ink-200 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Start a book to see your finish line.</p>
                    <p className="text-xs text-ink-400 mt-1">Log a few reading sessions and we&apos;ll predict when you&apos;ll finish.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pace.map((p) => (
                      <FinishLineCard key={p.user_book_id} prediction={p} />
                    ))}
                  </div>
                )}
              </div>

              {/* Reading DNA card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-brand-500" />
                  <h2 className="font-display text-base font-semibold text-ink-800">Reading DNA</h2>
                </div>

                <PremiumGate isPremium={isPremium} featureName="Reading DNA" compact>
                  {dnaLoading ? (
                    <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                      <span className="text-sm text-ink-400">Analyzing your reading DNA…</span>
                    </div>
                  ) : dna ? (
                    <DNACard dna={dna} />
                  ) : (
                    <div className="bg-white rounded-2xl border border-ink-100 p-5 text-center">
                      <span className="text-3xl block mb-2">🧬</span>
                      <p className="text-sm text-ink-500">Read more books to unlock your DNA.</p>
                    </div>
                  )}
                </PremiumGate>
              </div>
            </div>
          )}

          {/* ── Tab: Personality ── */}
          {activeTab === 'personality' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-800">Your Reading Type</h2>
                  <p className="text-xs text-ink-400">Claude&apos;s take on what kind of reader you are</p>
                </div>
                {personalityLoaded && isPremium && (
                  <div className="flex items-center gap-2">
                    {personalityCached && <span className="text-[10px] text-ink-400">From cache</span>}
                    <button onClick={() => loadPersonality(true)}
                      disabled={personalityLoading}
                      title="Refresh personality"
                      className="w-8 h-8 rounded-xl bg-paper-100 border border-paper-200 flex items-center justify-center hover:bg-paper-200 transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 text-ink-500 ${personalityLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              <PremiumGate isPremium={isPremium} featureName="Reading Personality">
                {personalityLoading ? (
                  <LoadingCard message="Discovering your reading personality…" />
                ) : personalityError ? (
                  <ErrorCard message={personalityError} onRetry={() => { setPersonalityLoaded(false); loadPersonality(); }} />
                ) : personality ? (
                  <PersonalityCard personality={personality} />
                ) : null}
              </PremiumGate>
            </div>
          )}

          {/* ── Tab: Mood ── */}
          {activeTab === 'mood' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-800">What&apos;s Your Mood?</h2>
                <p className="text-xs text-ink-400">Pick a vibe and Claude will find the perfect read</p>
              </div>

              <PremiumGate isPremium={isPremium} featureName="Mood Recommendations">
                <div className="grid grid-cols-4 gap-2">
                  {MOODS.map(mood => (
                    <button
                      key={mood.label}
                      onClick={() => loadMoodRecs(mood)}
                      disabled={moodLoading}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-center transition-all ${
                        selectedMood?.label === mood.label
                          ? 'bg-brand-500 border-transparent text-white shadow-md shadow-brand-500/20'
                          : 'bg-white border-ink-100 text-ink-700 hover:border-brand-200 hover:bg-brand-50'
                      }`}
                    >
                      <span className="text-xl">{mood.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{mood.label}</span>
                    </button>
                  ))}
                </div>

                {moodLoading && <LoadingCard message={`Finding ${selectedMood?.label?.toLowerCase()} reads for you…`} />}
                {moodError && <ErrorCard message={moodError} onRetry={() => selectedMood && loadMoodRecs(selectedMood)} />}

                {!moodLoading && moodRecs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
                      {selectedMood?.emoji} {selectedMood?.label} picks
                    </p>
                    {moodRecs.map((rec, i) => (
                      <RecommendationCard
                        key={`${rec.title}-${i}`}
                        rec={rec}
                        gradient={REC_GRADIENTS[i % REC_GRADIENTS.length]}
                        isAdded={added.has(`${rec.title}-${rec.author}`)}
                        onAdd={() => handleAddToShelf(rec.title, rec.author)}
                      />
                    ))}
                  </div>
                )}

                {!moodLoading && !selectedMood && (
                  <div className="text-center py-12 text-ink-300">
                    <span className="text-5xl block mb-3">🎭</span>
                    <p className="text-sm text-ink-400">Tap a mood above to get your picks</p>
                  </div>
                )}
              </PremiumGate>
            </div>
          )}

          {/* ── Tab: Coach ── */}
          {activeTab === 'coach' && (
            <div className="space-y-6">

              {/* Habit Nudge card */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-500" />
                  <h2 className="font-display text-base font-semibold text-ink-800">Today&apos;s Nudge</h2>
                </div>
                <p className="text-xs text-ink-400 -mt-1">Your personalized reading habit check-in</p>

                {nudgeLoading ? (
                  <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    <span className="text-sm text-ink-400">Analyzing your reading habits…</span>
                  </div>
                ) : nudge ? (
                  <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
                    {/* Streak + window */}
                    <div className="bg-gradient-to-r from-brand-50 to-paper-50 px-5 py-3 border-b border-brand-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{nudge.current_streak > 0 ? '🔥' : '📚'}</span>
                        <div>
                          <p className="text-xs font-bold text-brand-700">
                            {nudge.current_streak > 0
                              ? `${nudge.current_streak}-day streak`
                              : 'Start a streak today'}
                          </p>
                          <p className="text-[10px] text-brand-500">Best window: {nudge.optimal_window}</p>
                        </div>
                      </div>
                      <button
                        onClick={loadNudge}
                        disabled={nudgeLoading}
                        className="w-7 h-7 rounded-lg bg-white border border-brand-100 flex items-center justify-center hover:bg-brand-50 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 text-ink-400 ${nudgeLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="p-5 space-y-3">
                      {/* Nudge message */}
                      <p className="text-sm text-ink-700 leading-relaxed">{nudge.nudge_message}</p>

                      {/* Micro goal */}
                      <div className="flex items-start gap-2.5 bg-brand-50 rounded-xl px-3 py-2.5">
                        <Target className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide mb-0.5">Today&apos;s micro-goal</p>
                          <p className="text-sm text-brand-800 font-medium">{nudge.micro_goal}</p>
                        </div>
                      </div>

                      {/* Why it matters */}
                      <p className="text-xs text-ink-400 italic">{nudge.why_it_matters}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-ink-100 p-5 text-center">
                    <Bell className="w-7 h-7 text-ink-200 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Log some reading sessions to unlock your daily nudge.</p>
                  </div>
                )}
              </div>

              {/* Reading Coach */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-500" />
                  <h2 className="font-display text-base font-semibold text-ink-800">Reading Coach</h2>
                </div>
                <p className="text-xs text-ink-400 -mt-1">Get focus questions before a session, or a deep-reflection package after finishing</p>

                <PremiumGate isPremium={isPremium} featureName="Reading Coach">
                {/* Book selector */}
                {coachBooks.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-ink-100 p-4 space-y-4">
                    {/* Book picker */}
                    <div>
                      <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wide mb-2">Choose a book</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {coachBooks.slice(0, 10).map(b => (
                          <button
                            key={b.id}
                            onClick={() => { setSelectedCoachBook(b); setCoachResult(null); setCoachError(''); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                              selectedCoachBook?.id === b.id
                                ? 'bg-brand-50 border border-brand-200 text-brand-800'
                                : 'hover:bg-ink-50 text-ink-700'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-ink-300" />
                            <span className="truncate font-medium">{b.book?.title ?? 'Unknown'}</span>
                            <span className={`text-[10px] ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium ${
                              b.status === 'reading' ? 'bg-brand-100 text-brand-600' : 'bg-ink-100 text-ink-500'
                            }`}>{b.status === 'reading' ? 'Reading' : 'Finished'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mode selector */}
                    {selectedCoachBook && (
                      <div>
                        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wide mb-2">What do you need?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setCoachMode('pre_session')}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-sm transition-colors ${
                              coachMode === 'pre_session'
                                ? 'bg-brand-50 border-brand-200 text-brand-800'
                                : 'bg-paper-50 border-ink-100 text-ink-600 hover:border-brand-200'
                            }`}
                          >
                            <Lightbulb className="w-4 h-4" />
                            <span className="font-semibold text-xs">Focus questions</span>
                            <span className="text-[10px] text-ink-400">Before your next session</span>
                          </button>
                          <button
                            onClick={() => setCoachMode('post_book')}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-sm transition-colors ${
                              coachMode === 'post_book'
                                ? 'bg-brand-50 border-brand-200 text-brand-800'
                                : 'bg-paper-50 border-ink-100 text-ink-600 hover:border-brand-200'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-semibold text-xs">Deep reflection</span>
                            <span className="text-[10px] text-ink-400">After finishing the book</span>
                          </button>
                        </div>
                        <button
                          onClick={() => loadCoach(selectedCoachBook, coachMode)}
                          disabled={coachLoading}
                          className="mt-3 w-full py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                          {coachLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                          {coachLoading ? 'Generating…' : `Get ${coachMode === 'pre_session' ? 'focus questions' : 'reflection package'}`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-ink-100 p-5 text-center">
                    <BookOpen className="w-7 h-7 text-ink-200 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Add books to your shelf to use the reading coach.</p>
                  </div>
                )}

                {/* Coach error */}
                {coachError && <ErrorCard message={coachError} onRetry={() => selectedCoachBook && loadCoach(selectedCoachBook, coachMode)} />}

                {/* Coach result */}
                {!coachLoading && coachResult && (
                  <CoachResultCard result={coachResult} onRefresh={() => selectedCoachBook && loadCoach(selectedCoachBook, coachMode, true)} />
                )}
                </PremiumGate>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-10 flex flex-col items-center gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 opacity-20 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink-700">{message}</p>
        <p className="text-xs text-ink-400 mt-0.5">This takes about 5 seconds</p>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center gap-3">
      <AlertCircle className="w-8 h-8 text-red-300" />
      <p className="text-sm text-ink-500 text-center">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-100 text-xs font-medium text-ink-600 hover:bg-paper-200 transition-colors">
        <RefreshCw className="w-3 h-3" /> Try again
      </button>
    </div>
  );
}

function EmptyCard({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-10 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}

function RecommendationCard({
  rec,
  gradient,
  isAdded,
  onAdd,
}: {
  rec: Recommendation | MoodRec;
  gradient: string;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await onAdd();
    setAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all">
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="flex-shrink-0">
          {rec.cover_url && !imgError ? (
            <img
              src={rec.cover_url}
              alt={rec.title}
              onError={() => setImgError(true)}
              className="w-16 h-24 object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className={`w-16 h-24 rounded-xl bg-gradient-to-br ${gradient} flex items-end justify-end p-1.5 shadow-sm`}>
              <BookOpen className="w-4 h-4 text-white/70" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm text-ink-900 leading-snug">{rec.title}</p>
            <span className="text-[10px] bg-brand-50 border border-brand-100 text-brand-700 px-2 py-0.5 rounded-full flex-shrink-0 font-medium whitespace-nowrap">
              {rec.vibe}
            </span>
          </div>
          <p className="text-xs text-ink-400 mb-2">
            {rec.author}
            {rec.genre ? <span className="text-ink-300"> · {rec.genre}</span> : null}
          </p>

          {/* Why Claude picked it */}
          <p className="text-xs text-ink-600 italic border-l-2 border-brand-200 pl-2 leading-relaxed mb-2">
            &ldquo;{rec.why}&rdquo;
          </p>

          {'description' in rec && rec.description && (
            <p className="text-[11px] text-ink-400 leading-relaxed line-clamp-2">{rec.description}</p>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isAdded || adding}
            className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isAdded
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100'
            }`}
          >
            {adding ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isAdded ? (
              <><Check className="w-3 h-3" /> Added to shelf</>
            ) : (
              <><Plus className="w-3 h-3" /> Add to shelf</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonalityCard({ personality }: { personality: Personality }) {
  const style = ELEMENT_STYLES[personality.element] ?? ELEMENT_STYLES.moon;

  return (
    <div className="space-y-4">
      {/* Main personality hero */}
      <div className={`rounded-3xl bg-gradient-to-br ${style.gradient} p-6 shadow-lg ${style.glow}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-3xl ring-2 ${style.ring} shadow-md`}>
            {personality.badge}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${style.text} opacity-70`}>Your Reading Type</p>
            <h3 className={`font-display text-xl font-bold leading-tight ${style.text}`}>{personality.type}</h3>
          </div>
        </div>
        <p className={`text-sm leading-relaxed italic ${style.text} opacity-80`}>&ldquo;{personality.tagline}&rdquo;</p>
      </div>

      {/* Traits */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5">
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5" /> Your Reading Traits
        </p>
        <div className="space-y-2.5">
          {personality.traits.map((trait, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-lg ${style.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-[10px] font-bold">{i + 1}</span>
              </div>
              <p className="text-sm text-ink-700 leading-snug">{trait}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-paper-50 rounded-2xl border border-paper-200 p-4 flex items-center gap-3">
        <Clock className="w-4 h-4 text-ink-400 flex-shrink-0" />
        <p className="text-xs text-ink-500">
          Your personality is recalculated each time based on your latest reading data — come back after a few more sessions to see how you evolve.
        </p>
      </div>
    </div>
  );
}

function FinishLineCard({ prediction }: { prediction: PacePrediction }) {
  const { title, author, cover_url, progress_pct, pages_left, avg_pages_per_day, days_to_finish, finish_date, sessions_used } = prediction;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4">
      {/* Cover */}
      <div className="flex-shrink-0 w-10 h-14 bg-paper-200 rounded-lg overflow-hidden shadow-sm">
        {cover_url && !imgError ? (
          <img src={cover_url} alt={title} onError={() => setImgError(true)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-ink-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 truncate">{title}</p>
        <p className="text-xs text-ink-400 truncate mb-1.5">{author}</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${progress_pct}%` }} />
        </div>

        {days_to_finish !== null && finish_date ? (
          <p className="text-xs text-ink-500">
            <span className="font-semibold text-brand-600">{days_to_finish === 1 ? 'Tomorrow' : `${days_to_finish} days`}</span>
            {' '}&mdash; around <span className="font-medium text-ink-700">{finish_date}</span>
            {avg_pages_per_day > 0 && (
              <span className="text-ink-400"> ({avg_pages_per_day} pg/day, {pages_left} left)</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-ink-400">
            {sessions_used === 0
              ? 'Log a reading session to see your finish estimate.'
              : `${pages_left} pages left — log more sessions to see a prediction.`}
          </p>
        )}
      </div>
    </div>
  );
}

function DNACard({ dna }: { dna: DNAResult }) {
  if (dna.top_genres.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-ink-100 p-5 text-center">
        <span className="text-3xl block mb-2">🧬</span>
        <p className="text-sm text-ink-500">{dna.author_patterns}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
      {/* Summary */}
      {dna.summary && (
        <p className="text-sm text-ink-600 italic border-l-2 border-brand-200 pl-3 leading-relaxed">
          &ldquo;{dna.summary}&rdquo;
        </p>
      )}

      {/* Genre bars */}
      {dna.top_genres.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Top Genres</p>
          {dna.top_genres.map((g) => (
            <div key={g.genre}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-700 truncate max-w-[60%]">{g.genre}</span>
                <span className="text-[10px] text-ink-400">{g.count} book{g.count !== 1 ? 's' : ''} · {g.pct}%</span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Themes */}
      {dna.themes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">Themes You Love</p>
          <div className="flex flex-wrap gap-1.5">
            {dna.themes.map((theme) => (
              <span key={theme} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-medium">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Author patterns */}
      {dna.author_patterns && (
        <div className="pt-1 border-t border-ink-50">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Author Patterns</p>
          <p className="text-xs text-ink-600 leading-relaxed">{dna.author_patterns}</p>
        </div>
      )}
    </div>
  );
}

// ─── Coach Result Card ────────────────────────────────────────────────────────

function CoachResultCard({ result, onRefresh }: { result: CoachResult; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (result.mode === 'pre_session') {
    return (
      <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-brand-500" />
            <p className="font-semibold text-sm text-ink-800">Focus Questions</p>
          </div>
          <button onClick={onRefresh} className="w-7 h-7 rounded-lg bg-paper-100 border border-paper-200 flex items-center justify-center hover:bg-paper-200 transition-colors">
            <RefreshCw className="w-3 h-3 text-ink-400" />
          </button>
        </div>
        <p className="text-xs text-ink-400">Keep these questions in mind as you read — they activate deeper comprehension.</p>
        <div className="space-y-3">
          {result.prompts.map((p, i) => (
            <button
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left"
            >
              <div className={`rounded-xl border p-3.5 transition-colors ${expanded === i ? 'bg-brand-50 border-brand-200' : 'bg-paper-50 border-paper-200 hover:border-brand-200'}`}>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800 leading-snug">{p.question}</p>
                    {expanded === i && (
                      <p className="text-xs text-ink-500 mt-1.5 leading-relaxed border-t border-paper-200 pt-1.5">{p.purpose}</p>
                    )}
                  </div>
                  {expanded === i
                    ? <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-1" />
                    : <ChevronRight className="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-1" />}
                </div>
              </div>
            </button>
          ))}
        </div>
        {result.tip && (
          <div className="bg-ink-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <span className="text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-ink-600 italic leading-relaxed">{result.tip}</p>
          </div>
        )}
      </div>
    );
  }

  // post_book
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <p className="font-semibold text-sm text-ink-800">Deep Reflection Package</p>
        </div>
        <button onClick={onRefresh} className="w-7 h-7 rounded-lg bg-paper-100 border border-paper-200 flex items-center justify-center hover:bg-paper-200 transition-colors">
          <RefreshCw className="w-3 h-3 text-ink-400" />
        </button>
      </div>

      {/* Discussion questions */}
      <div>
        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2.5">Discussion Questions</p>
        <div className="space-y-2">
          {result.discussion_questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-paper-50 rounded-xl px-3 py-2.5">
              <span className="w-5 h-5 rounded-lg bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-ink-700 leading-snug">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key themes */}
      <div>
        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">Key Themes</p>
        <div className="flex flex-wrap gap-1.5">
          {result.key_themes.map(t => (
            <span key={t} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Retention summary */}
      <div>
        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2">Retention Summary</p>
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
          <p className="text-sm text-brand-800 leading-relaxed italic">&ldquo;{result.retention_summary}&rdquo;</p>
        </div>
      </div>

      {/* Read-alike */}
      <div className="flex items-start gap-2.5 border-t border-paper-100 pt-4">
        <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-600 leading-relaxed"><span className="font-semibold text-ink-800">What to read next: </span>{result.read_alike_prompt}</p>
      </div>
    </div>
  );
}
