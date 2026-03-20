'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

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

const TYPE_COLORS: Record<string, string> = {
  pattern: 'bg-blue-50 border-blue-100 text-blue-900',
  achievement: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  suggestion: 'bg-brand-50 border-brand-100 text-brand-900',
  encouragement: 'bg-amber-50 border-amber-100 text-amber-900',
};

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
    <div className="bg-white rounded-2xl shadow-sm border border-paper-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-amber-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="font-display text-base font-semibold text-ink-800">AI Insights</h2>
          <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        {(loaded || error) && (
          <button onClick={load} disabled={loading} className="text-ink-400 hover:text-ink-700 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper-50 mx-5 mt-4 rounded-xl p-1">
        {(['insights', 'recommendations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab === 'insights' ? '✨ Insights' : '📚 For You'}
          </button>
        ))}
      </div>

      <div className="p-5 pt-3">
        {loading && !loaded ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <Loader2 className="w-8 h-8 animate-spin text-brand-200 absolute -top-1 -left-1" />
            </div>
            <p className="text-xs text-ink-400">Claude is reading your reading history...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="w-8 h-8 text-ink-200" />
            <p className="text-xs text-ink-400 text-center">Couldn&apos;t load insights right now.</p>
            <button
              onClick={load}
              disabled={loading}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Try again
            </button>
          </div>
        ) : activeTab === 'insights' ? (
          <div className="space-y-2">
            {insights.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-xs text-ink-400">Log more reading sessions to unlock insights.</p>
              </div>
            ) : (
              insights.map((insight, i) => (
                <div key={i} className={`rounded-xl p-3.5 border ${TYPE_COLORS[insight.type] ?? TYPE_COLORS.encouragement}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg leading-none">{insight.emoji}</span>
                    <p className="font-semibold text-sm">{insight.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{insight.body}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {message && (
              <p className="text-xs text-ink-400 text-center py-2">{message}</p>
            )}
            {recs.length === 0 && !message ? (
              <div className="text-center py-6">
                <BookOpen className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-xs text-ink-400">Rate some books to get personalized picks.</p>
              </div>
            ) : (
              recs.map((rec, i) => (
                <div key={i} className="bg-paper-50 rounded-xl p-3.5 border border-paper-200">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-900 truncate">{rec.title}</p>
                      <p className="text-xs text-ink-400">{rec.author}</p>
                    </div>
                    <span className="text-[10px] bg-white border border-paper-200 px-2 py-0.5 rounded-full text-ink-600 flex-shrink-0 whitespace-nowrap">
                      {rec.vibe}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed italic">&ldquo;{rec.why}&rdquo;</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
