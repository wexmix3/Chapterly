'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, BookOpen, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Insight {
  emoji: string;
  title: string;
  body: string;
  type: 'pattern' | 'achievement' | 'suggestion' | 'encouragement';
}

interface Recommendation {
  title: string;
  author: string;
  why: string;
  genre: string;
  vibe: string;
}

const TYPE_CONFIG: Record<string, { border: string; bg: string }> = {
  pattern:      { border: 'border-l-blue-400',    bg: 'bg-blue-50/60' },
  achievement:  { border: 'border-l-emerald-400', bg: 'bg-emerald-50/60' },
  suggestion:   { border: 'border-l-violet-400',  bg: 'bg-violet-50/60' },
  encouragement:{ border: 'border-l-amber-400',   bg: 'bg-amber-50/60' },
};

const REC_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-violet-500',
];

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [insightsRes, recsRes] = await Promise.all([
        fetch('/api/ai/insights', { method: 'POST' }),
        fetch('/api/ai/recommend', { method: 'POST' }),
      ]);
      if (!insightsRes.ok || !recsRes.ok) throw new Error('API error');
      const [insightsData, recsData] = await Promise.all([
        insightsRes.json(),
        recsRes.json(),
      ]);
      setInsights(insightsData.insights ?? []);
      setRecs(recsData.recommendations ?? []);
      if (recsData.message) setMessage(recsData.message);
      setLoaded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl overflow-hidden border border-ink-100 shadow-sm">
      {/* Premium gradient header */}
      <div className="bg-gradient-to-r from-violet-600 via-brand-500 to-brand-400 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-white leading-none">AI Insights</h2>
              <p className="text-[10px] text-white/60 mt-0.5 tracking-wide">Powered by Claude</p>
            </div>
          </div>
          {(loaded || error) && (
            <button
              onClick={load}
              disabled={loading}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white">
        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="flex gap-1 bg-paper-50 rounded-xl p-1">
            {(['insights', 'recommendations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                {tab === 'insights' ? '✨ Insights' : '📚 For You'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 pt-3">
          {/* Loading */}
          {loading && !loaded ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-brand-400 opacity-20 animate-ping" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink-700">Analyzing your reading DNA…</p>
                <p className="text-xs text-ink-400 mt-0.5">Claude is working on it</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <AlertCircle className="w-8 h-8 text-ink-200" />
              <p className="text-xs text-ink-400 text-center">Couldn&apos;t load insights right now.</p>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paper-100 text-xs font-medium text-ink-600 hover:bg-paper-200 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Try again
              </button>
            </div>
          ) : activeTab === 'insights' ? (
            <div className="space-y-2.5">
              {insights.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-ink-100 mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink-500">Log 3+ sessions to unlock insights</p>
                  <p className="text-xs text-ink-400 mt-1">Claude will analyze your reading patterns</p>
                </div>
              ) : (
                insights.map((insight, i) => {
                  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.encouragement;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-4 border-l-[3px] ${cfg.border} ${cfg.bg} border border-ink-100`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{insight.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm text-ink-900 leading-snug">{insight.title}</p>
                          <p className="text-xs text-ink-500 leading-relaxed mt-1">{insight.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {message && (
                <p className="text-xs text-ink-400 text-center pb-1">{message}</p>
              )}
              {recs.length === 0 && !message ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-ink-100 mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink-500">Rate some books for personalized picks</p>
                  <p className="text-xs text-ink-400 mt-1">Claude learns your taste from your ratings</p>
                </div>
              ) : (
                recs.map((rec, i) => (
                  <div key={i} className="rounded-xl border border-paper-200 overflow-hidden">
                    <div className="flex items-start gap-3 p-3.5">
                      {/* Colored book icon placeholder */}
                      <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${REC_GRADIENTS[i % REC_GRADIENTS.length]} shadow-sm`}>
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-ink-900 leading-tight">{rec.title}</p>
                          <span className="text-[10px] bg-paper-100 border border-paper-200 px-2 py-0.5 rounded-full text-ink-500 flex-shrink-0 whitespace-nowrap">
                            {rec.vibe}
                          </span>
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {rec.author}
                          {rec.genre ? <span className="text-ink-300"> · {rec.genre}</span> : null}
                        </p>
                        <p className="text-xs text-ink-500 italic leading-relaxed mt-1.5 border-l-2 border-violet-200 pl-2">
                          &ldquo;{rec.why}&rdquo;
                        </p>
                        <Link
                          href="/dashboard?tab=search"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          Find this book <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
