'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { ExternalLink, CheckCircle, Loader2, BadgeCheck } from 'lucide-react';

type Platform = 'all' | 'tiktok' | 'instagram' | 'youtube';

const CREATORS = [
  {
    handle: '@cassiesbooktok',
    name: 'Cassie',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@cassiesbooktok',
    followers: '3.9M',
    genres: ['Romance', 'Fantasy', 'Romantasy'],
    bio: 'Romantasy queen. If it has dragons and slow-burn romance, she\'s read it — and probably cried.',
    picks: [
      { title: 'Fourth Wing', cover: 'https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg' },
      { title: 'A Court of Thorns and Roses', cover: 'https://covers.openlibrary.org/b/isbn/9781619635180-M.jpg' },
      { title: 'Iron Flame', cover: 'https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg' },
    ],
  },
  {
    handle: '@morgannbook',
    name: 'Morgann',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@morgannbook',
    followers: '2.6M',
    genres: ['Literary Fiction', 'Contemporary', 'Thriller'],
    bio: 'Reading everything. Reviewing honestly. No PR packages can buy her opinion.',
    picks: [
      { title: 'Tomorrow, and Tomorrow, and Tomorrow', cover: 'https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg' },
      { title: 'Lessons in Chemistry', cover: 'https://covers.openlibrary.org/b/isbn/9780385547345-M.jpg' },
      { title: 'The Midnight Library', cover: 'https://covers.openlibrary.org/b/isbn/9780525559474-M.jpg' },
    ],
  },
  {
    handle: '@abbysbooks',
    name: 'Abby',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@abbysbooks',
    followers: '465K',
    genres: ['Fantasy', 'Sci-Fi', 'YA'],
    bio: 'Speculative fiction enthusiast. Epic fantasies and emotional character arcs are her love language.',
    picks: [
      { title: 'The Name of the Wind', cover: 'https://covers.openlibrary.org/b/isbn/9780756404741-M.jpg' },
      { title: 'A Court of Thorns and Roses', cover: 'https://covers.openlibrary.org/b/isbn/9781619635180-M.jpg' },
      { title: 'The Way of Kings', cover: 'https://covers.openlibrary.org/b/isbn/9780765326355-M.jpg' },
    ],
  },
  {
    handle: '@jack_edwards',
    name: 'Jack Edwards',
    platform: 'youtube' as const,
    url: 'https://www.youtube.com/@jack_edwards',
    followers: '1.3M',
    genres: ['Literary Fiction', 'Classics', 'Nonfiction'],
    bio: 'Oxford grad turned BookTuber. Serious books reviewed with a sense of humor.',
    picks: [
      { title: 'Middlemarch', cover: 'https://covers.openlibrary.org/b/isbn/9780141439549-M.jpg' },
      { title: 'Normal People', cover: 'https://covers.openlibrary.org/b/isbn/9780571334650-M.jpg' },
      { title: 'Demon Copperhead', cover: 'https://covers.openlibrary.org/b/isbn/9780063251922-M.jpg' },
    ],
  },
  {
    handle: '@booksandquills',
    name: 'Sanne Vliegenthart',
    platform: 'youtube' as const,
    url: 'https://www.youtube.com/@booksandquills',
    followers: '590K',
    genres: ['Literary Fiction', 'Fantasy', 'Classics'],
    bio: 'One of BookTube\'s original voices. Thoughtful reviews across literary fiction, fantasy, and classics.',
    picks: [
      { title: 'The Priory of the Orange Tree', cover: 'https://covers.openlibrary.org/b/isbn/9781635570304-M.jpg' },
      { title: 'Jonathan Strange & Mr Norrell', cover: 'https://covers.openlibrary.org/b/isbn/9780765356154-M.jpg' },
      { title: 'Piranesi', cover: 'https://covers.openlibrary.org/b/isbn/9781635575644-M.jpg' },
    ],
  },
  {
    handle: '@amyjordanj',
    name: 'Amy Jordan',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@amyjordanj',
    followers: '459K',
    genres: ['Romance', 'Contemporary', 'Book Clubs'],
    bio: 'UK-based reader sharing honest book takes. Romance and contemporary fiction done right.',
    picks: [
      { title: 'Happy Place', cover: 'https://covers.openlibrary.org/b/isbn/9780593334867-M.jpg' },
      { title: 'People We Meet on Vacation', cover: 'https://covers.openlibrary.org/b/isbn/9781250786593-M.jpg' },
      { title: 'Book Lovers', cover: 'https://covers.openlibrary.org/b/isbn/9780593441794-M.jpg' },
    ],
  },
  {
    handle: '@stressinabox',
    name: 'Jess L.M. Anderson',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@stressinabox',
    followers: '2M',
    genres: ['Thriller', 'Romance', 'Fantasy'],
    bio: 'Known for emotional reactions and keeping it real. If a book broke her, she\'ll tell you.',
    picks: [
      { title: 'The Housemaid', cover: 'https://covers.openlibrary.org/b/isbn/9781538742549-M.jpg' },
      { title: 'Verity', cover: 'https://covers.openlibrary.org/b/isbn/9781538724736-M.jpg' },
      { title: 'It Ends with Us', cover: 'https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg' },
    ],
  },
  {
    handle: '@chamberofsecretbooks',
    name: 'Cameron Capello',
    platform: 'tiktok' as const,
    url: 'https://www.tiktok.com/@chamberofsecretbooks',
    followers: '462K',
    genres: ['Fantasy', 'Romance', 'YA'],
    bio: 'Fantasy and romance obsessive. Trusted voice for cozy reads and epic world-building.',
    picks: [
      { title: 'The House in the Cerulean Sea', cover: 'https://covers.openlibrary.org/b/isbn/9781250217318-M.jpg' },
      { title: 'Fourth Wing', cover: 'https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg' },
      { title: 'The Cruel Prince', cover: 'https://covers.openlibrary.org/b/isbn/9780316310314-M.jpg' },
    ],
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  youtube: '▶️',
  twitter: '🐦',
  blog: '✍️',
};

interface ApplicationStatus { status: string }

export default function CreatorsClient() {
  const [platform, setPlatform] = useState<Platform>('all');
  const [genre, setGenre] = useState<string>('all');
  const [showApply, setShowApply] = useState(false);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [applyForm, setApplyForm] = useState({ platform: 'tiktok', social_handle: '', profile_url: '', follower_count: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/creators/apply')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data) setAppStatus(j.data); })
      .catch(() => {});
  }, []);

  const submitApplication = async () => {
    if (!applyForm.social_handle || !applyForm.profile_url) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/creators/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...applyForm,
          follower_count: applyForm.follower_count ? parseInt(applyForm.follower_count) : null,
        }),
      });
      if (res.ok) { setSubmitted(true); setAppStatus({ status: 'pending' }); }
    } finally {
      setSubmitting(false);
    }
  };

  const allGenres = Array.from(new Set(CREATORS.flatMap(c => c.genres)));
  const filtered = CREATORS.filter(c =>
    (platform === 'all' || c.platform === platform) &&
    (genre === 'all' || c.genres.includes(genre))
  );

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-2">
              Creator Hub 🔥
            </h1>
            <p className="text-ink-500 text-sm">
              Discover books recommended by your favorite BookTok, Bookstagram, and BookTube creators.
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'tiktok', 'instagram', 'youtube'] as Platform[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    platform === p
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300'
                  }`}
                >
                  {p === 'all' ? 'All Platforms' : `${PLATFORM_ICONS[p]} ${p.charAt(0).toUpperCase() + p.slice(1)}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setGenre('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  genre === 'all' ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400'
                }`}
              >
                All Genres
              </button>
              {allGenres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? 'all' : g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    genre === g ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Creator grid */}
          <div className="space-y-4">
            {filtered.map(creator => (
              <CreatorCard key={creator.handle} creator={creator} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-ink-400">
                <p>No creators match these filters.</p>
              </div>
            )}
          </div>

          {/* Creator application CTA */}
          <div className="bg-gradient-to-br from-brand-50 to-amber-50 border border-brand-100 rounded-2xl p-6">
            {appStatus?.status === 'approved' ? (
              <div className="text-center">
                <BadgeCheck className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-800">You&apos;re a verified creator!</p>
                <p className="text-xs text-ink-500 mt-1">Your badge is showing on your profile.</p>
              </div>
            ) : appStatus?.status === 'pending' || submitted ? (
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-800">Application submitted!</p>
                <p className="text-xs text-ink-500 mt-1">We&apos;ll review it and get back to you within 48 hours.</p>
              </div>
            ) : !showApply ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-ink-800 mb-1">Are you a book creator?</p>
                <p className="text-xs text-ink-500 mb-4">Apply for a verified badge and get featured on the Creator Hub.</p>
                <button onClick={() => setShowApply(true)}
                  className="px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
                  Apply for verification →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink-800">Apply for Creator Verification</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-ink-500 block mb-1">Platform</label>
                    <select value={applyForm.platform} onChange={e => setApplyForm(p => ({ ...p, platform: e.target.value }))}
                      className="w-full px-3 py-2 border border-paper-200 rounded-xl text-xs bg-white text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300">
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="twitter">Twitter/X</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ink-500 block mb-1">Your handle</label>
                    <input value={applyForm.social_handle} onChange={e => setApplyForm(p => ({ ...p, social_handle: e.target.value }))}
                      placeholder="@yourbooktok"
                      className="w-full px-3 py-2 border border-paper-200 rounded-xl text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-ink-500 block mb-1">Profile URL</label>
                  <input value={applyForm.profile_url} onChange={e => setApplyForm(p => ({ ...p, profile_url: e.target.value }))}
                    placeholder="https://tiktok.com/@yourbooktok"
                    className="w-full px-3 py-2 border border-paper-200 rounded-xl text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-500 block mb-1">Approx. followers</label>
                  <input value={applyForm.follower_count} onChange={e => setApplyForm(p => ({ ...p, follower_count: e.target.value }))}
                    type="number" placeholder="e.g. 50000"
                    className="w-full px-3 py-2 border border-paper-200 rounded-xl text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowApply(false)} className="flex-1 py-2 rounded-xl text-xs text-ink-500 bg-paper-100 border border-paper-200">
                    Cancel
                  </button>
                  <button onClick={submitApplication} disabled={submitting || !applyForm.social_handle || !applyForm.profile_url}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function CreatorCard({ creator }: { creator: typeof CREATORS[0] }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-lg flex-shrink-0">
          {creator.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ink-900">{creator.handle}</p>
            <span className="text-[11px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
              {PLATFORM_ICONS[creator.platform]} {creator.followers}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {creator.genres.map(g => (
              <span key={g} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{g}</span>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-1.5 line-clamp-2">{creator.bio}</p>
        </div>
        <a
          href={creator.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Creator picks */}
      {creator.picks.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-2">
            {creator.handle}&apos;s picks
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {creator.picks.map(pick => (
              <div key={pick.title} className="flex-shrink-0 w-14">
                <div className="aspect-[2/3] bg-paper-200 rounded-lg overflow-hidden shadow-sm mb-1">
                  <img
                    src={pick.cover}
                    alt={pick.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <p className="text-[9px] text-ink-600 truncate">{pick.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
