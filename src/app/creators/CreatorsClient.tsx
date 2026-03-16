'use client';

import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { ExternalLink } from 'lucide-react';

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

export default function CreatorsClient() {
  const [platform, setPlatform] = useState<Platform>('all');
  const [genre, setGenre] = useState<string>('all');

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

          {/* Submit creator */}
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-ink-700 mb-2 font-medium">Are you a book creator?</p>
            <p className="text-xs text-ink-500 mb-4">Claim your profile and share your reading lists directly with your audience.</p>
            <a href="mailto:hello@chapterly.app?subject=Creator%20Profile%20Request"
              className="inline-flex px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
              Apply for a creator profile →
            </a>
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
