'use client';

/**
 * GoodreadsFriendsImport
 * Lets users paste or upload their Goodreads export CSV and find
 * matching Chapterly users to follow.
 *
 * Goodreads removed its public API — this works with the CSV export
 * the user downloads from their Goodreads settings.
 */

import { useState, useRef } from 'react';
import { Upload, Users, UserPlus, UserCheck, Loader2, ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react';

interface ChapterlyUser {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

interface MatchResult {
  goodreads_name: string;
  chapterly_user: ChapterlyUser;
}

export default function GoodreadsFriendsImport() {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [namesFound, setNamesFound] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    const text = await f.text();
    setCsvText(text);
  };

  const handleSearch = async () => {
    const text = csvText.trim();
    if (!text) { setError('Paste your Goodreads CSV or upload a file first.'); return; }
    setLoading(true);
    setError(null);
    setMatches([]);
    setSearched(false);

    try {
      const res = await fetch('/api/import/goodreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Search failed.'); return; }
      setMatches(json.matches ?? []);
      setNamesFound(json.names_found ?? 0);
      setSearched(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const follow = async (user: ChapterlyUser) => {
    setFollowingInProgress(user.id);
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followee_id: user.id }),
      });
      if (res.ok || res.status === 409) {
        setFollowingIds(prev => new Set([...prev, user.id]));
      }
    } finally {
      setFollowingInProgress(null);
    }
  };

  return (
    <div className="border border-ink-100 rounded-2xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-ink-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-800">Find Goodreads Friends</p>
          <p className="text-xs text-ink-500">Import your Goodreads CSV to find friends on Chapterly</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-ink-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-ink-100 p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Goodreads no longer has a public API. To find friends, export your data from{' '}
              <strong>Goodreads → My Account → Settings → Export library</strong>, then
              paste or upload the CSV below.
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Upload Goodreads export (.csv)</label>
            <div
              className="border-2 border-dashed border-ink-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="w-5 h-5 text-ink-300 mx-auto mb-1.5" />
              <p className="text-xs text-ink-500">
                {file ? file.name : 'Drop CSV here or click to browse'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          {/* Or paste */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Or paste CSV contents</label>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Paste your Goodreads CSV export here…"
              rows={4}
              className="w-full text-xs px-3 py-2.5 border border-ink-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 resize-none font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </p>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || !csvText.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Find Friends on Chapterly'}
          </button>

          {/* Results */}
          {searched && (
            <div className="space-y-3">
              <p className="text-xs text-ink-500">
                Found <strong>{namesFound ?? 0}</strong> name{namesFound !== 1 ? 's' : ''} in your CSV.
                {matches.length > 0
                  ? ` ${matches.length} matched Chapterly user${matches.length !== 1 ? 's' : ''}.`
                  : ' No Chapterly accounts found matching your Goodreads friends yet.'}
              </p>

              {matches.length > 0 && (
                <div className="space-y-2">
                  {matches.map(m => {
                    const followed = followingIds.has(m.chapterly_user.id);
                    const inProgress = followingInProgress === m.chapterly_user.id;
                    return (
                      <div key={m.chapterly_user.id} className="flex items-center gap-3 p-3 bg-paper-50 rounded-xl border border-ink-100">
                        {m.chapterly_user.avatar_url ? (
                          <img src={m.chapterly_user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
                            {m.chapterly_user.display_name[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{m.chapterly_user.display_name}</p>
                          <p className="text-xs text-ink-400 truncate">
                            @{m.chapterly_user.handle}
                            <span className="ml-1.5 text-ink-300">· matched &ldquo;{m.goodreads_name}&rdquo;</span>
                          </p>
                        </div>
                        <button
                          onClick={() => follow(m.chapterly_user)}
                          disabled={followed || inProgress}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                            followed
                              ? 'bg-ink-100 text-ink-500'
                              : 'bg-brand-500 text-white hover:bg-brand-600'
                          }`}
                        >
                          {inProgress
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : followed
                              ? <><UserCheck className="w-3.5 h-3.5" /> Following</>
                              : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
