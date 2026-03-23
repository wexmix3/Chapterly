'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import {
  BookOpen, Star, Users, UserPlus, UserCheck, BookMarked,
  Lock, ChevronRight, MessageSquare, Loader2, BarChart3,
  Calendar, Award, BadgeCheck
} from 'lucide-react';

interface BookEntry {
  status: string;
  rating?: number | null;
  book?: {
    id: string;
    title: string;
    authors: string[];
    cover_url?: string | null;
    page_count?: number | null;
  } | null;
}

interface ReviewEntry {
  rating: number;
  text?: string | null;
  mood_tags: string[];
  contains_spoilers: boolean;
  created_at: string;
  book?: {
    id: string;
    title: string;
    authors: string[];
    cover_url?: string | null;
  } | null;
}

interface ProfileData {
  profile: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url?: string | null;
    bio?: string | null;
    is_public: boolean;
    created_at: string;
    followers_count: number;
    following_count: number;
    books_read_count: number;
    want_to_read_count: number;
    total_pages: number;
    avg_rating: number | null;
    is_creator?: boolean;
    creator_platform?: string | null;
  };
  currently_reading: BookEntry[];
  recently_read: BookEntry[];
  recent_reviews: ReviewEntry[];
  is_following: boolean;
  is_own_profile: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}`}
        />
      ))}
    </span>
  );
}

function BookCover({ book, size = 'md' }: { book: BookEntry['book']; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-10 h-14' : size === 'lg' ? 'w-20 h-28' : 'w-14 h-20';
  return (
    <div className={`${dims} bg-paper-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm`}>
      {book?.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-ink-300" />
        </div>
      )}
    </div>
  );
}

export default function ProfileClient({
  handle,
  viewerId,
}: {
  handle: string;
  viewerId: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'reviews'>('reading');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(handle)}`);
      if (res.status === 404) { setError('not_found'); return; }
      if (res.status === 403) { setError('private'); return; }
      if (!res.ok) { setError('error'); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = async () => {
    if (!viewerId) { router.push('/login'); return; }
    if (!data) return;
    setFollowLoading(true);
    try {
      const method = data.is_following ? 'DELETE' : 'POST';
      const res = await fetch('/api/social', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followee_id: data.profile.id }),
      });
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          is_following: !prev.is_following,
          profile: {
            ...prev.profile,
            followers_count: prev.is_following
              ? prev.profile.followers_count - 1
              : prev.profile.followers_count + 1,
          },
        } : prev);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-paper-50">
        <Navigation />
        <main className="md:ml-64 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-3 px-4">
            <BookOpen className="w-12 h-12 text-ink-300 mx-auto" />
            <h1 className="font-display text-2xl font-bold text-ink-800">Reader not found</h1>
            <p className="text-ink-500">@{handle} doesn&apos;t exist on Chapterly yet.</p>
            <button onClick={() => router.push('/discover')}
              className="mt-2 text-sm text-brand-600 hover:underline">
              Discover readers →
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (error === 'private') {
    return (
      <div className="min-h-screen bg-paper-50">
        <Navigation />
        <main className="md:ml-64 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-3 px-4">
            <Lock className="w-12 h-12 text-ink-300 mx-auto" />
            <h1 className="font-display text-2xl font-bold text-ink-800">Private profile</h1>
            <p className="text-ink-500">@{handle} has a private profile.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { profile, currently_reading, recently_read, recent_reviews, is_following, is_own_profile } = data;

  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-6">

          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-paper-200">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold font-display">
                    {profile.display_name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold text-ink-900 truncate">
                    {profile.display_name}
                  </h1>
                  {profile.is_creator && (
                    <span title="Verified Creator" className="flex items-center gap-1 bg-brand-50 text-brand-600 border border-brand-100 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0">
                      <BadgeCheck className="w-3 h-3" /> Creator
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-400">@{profile.handle}</p>
                {profile.bio && (
                  <p className="text-sm text-ink-600 mt-2 leading-relaxed">{profile.bio}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                  <Calendar className="w-3 h-3" />
                  <span>Reading since {joinYear}</span>
                </div>
              </div>

              {/* Follow / Edit button */}
              <div className="flex-shrink-0">
                {is_own_profile ? (
                  <button
                    onClick={() => router.push('/dashboard?tab=overview')}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-paper-100 text-ink-700 hover:bg-paper-200 transition-colors border border-paper-200"
                  >
                    Edit profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      is_following
                        ? 'bg-paper-100 text-ink-700 hover:bg-red-50 hover:text-red-600 border border-paper-200'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : is_following ? (
                      <><UserCheck className="w-4 h-4" /> Following</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Follow</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Books Read', value: profile.books_read_count, icon: BookMarked },
              { label: 'Followers', value: profile.followers_count, icon: Users },
              { label: 'Following', value: profile.following_count, icon: Users },
              { label: 'Pages', value: profile.total_pages.toLocaleString(), icon: BarChart3 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-paper-200">
                <Icon className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-ink-900">{value}</p>
                <p className="text-[10px] text-ink-400 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Currently Reading */}
          {currently_reading.length > 0 && (
            <section>
              <h2 className="font-display text-base font-semibold text-ink-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-500" />
                Currently Reading
              </h2>
              <div className="space-y-3">
                {currently_reading.map((entry, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 flex gap-3 shadow-sm border border-paper-200">
                    <BookCover book={entry.book} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm truncate">{entry.book?.title}</p>
                      <p className="text-xs text-ink-400 truncate">{entry.book?.authors?.[0]}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                        <span className="text-xs text-brand-600 font-medium">Reading now</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tabs: Reading / Reviews */}
          <div>
            <div className="flex gap-1 bg-paper-100 rounded-xl p-1 mb-4">
              {(['reading', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {tab === 'reading' ? `Books (${recently_read.length})` : `Reviews (${recent_reviews.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'reading' && (
              <div>
                {recently_read.length === 0 ? (
                  <div className="text-center py-10 text-ink-400 text-sm">
                    No public books yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {recently_read.map((entry, i) => (
                      <div key={i} className="group relative">
                        <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                          {entry.book?.cover_url ? (
                            <img
                              src={entry.book.cover_url}
                              alt={entry.book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <BookOpen className="w-5 h-5 text-ink-300 mb-1" />
                              <span className="text-[9px] text-ink-400 leading-tight line-clamp-3">
                                {entry.book?.title}
                              </span>
                            </div>
                          )}
                        </div>
                        {entry.rating && (
                          <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star className="w-2 h-2 fill-amber-400 text-amber-400" />
                            {entry.rating}
                          </div>
                        )}
                        <p className="text-[10px] font-medium text-ink-700 mt-1 truncate">{entry.book?.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {recent_reviews.length === 0 ? (
                  <div className="text-center py-10 text-ink-400 text-sm">
                    No reviews yet.
                  </div>
                ) : (
                  recent_reviews.map((review, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
                      <div className="flex gap-3">
                        <BookCover book={review.book} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{review.book?.title}</p>
                          <p className="text-xs text-ink-400 truncate">{review.book?.authors?.[0]}</p>
                          <div className="mt-1">
                            <StarRating rating={review.rating} />
                          </div>
                          {review.mood_tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {review.mood_tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {review.text && (
                            <p className={`text-xs text-ink-600 mt-2 leading-relaxed ${review.contains_spoilers ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}`}>
                              {review.contains_spoilers && (
                                <span className="text-[10px] text-amber-600 font-medium not-italic block mb-0.5">[Spoilers — hover to reveal]</span>
                              )}
                              {review.text}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-paper-100">
                        <span className="text-[10px] text-ink-400">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <MessageSquare className="w-3 h-3 text-ink-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Achievement strip */}
          {profile.books_read_count > 0 && (
            <section className="bg-gradient-to-r from-brand-50 to-amber-50 rounded-2xl p-4 border border-brand-100">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-brand-500" />
                <h2 className="font-display text-sm font-semibold text-ink-800">Reading milestones</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {profile.books_read_count >= 1 && <Badge label="First Book" emoji="📖" />}
                {profile.books_read_count >= 5 && <Badge label="5 Books" emoji="🌟" />}
                {profile.books_read_count >= 12 && <Badge label="12 Books" emoji="🎯" />}
                {profile.books_read_count >= 25 && <Badge label="25 Books" emoji="🏆" />}
                {profile.books_read_count >= 50 && <Badge label="50 Books" emoji="🔥" />}
                {profile.books_read_count >= 100 && <Badge label="Century Reader" emoji="💯" />}
                {profile.total_pages >= 10000 && <Badge label="10K Pages" emoji="📚" />}
                {(profile.avg_rating ?? 0) >= 4 && profile.books_read_count >= 5 && (
                  <Badge label="Discerning Reader" emoji="⭐" />
                )}
              </div>
            </section>
          )}

          {/* CTA for non-authenticated visitors */}
          {!viewerId && (
            <div className="bg-ink-900 rounded-2xl p-6 text-center space-y-3">
              <p className="text-white font-display text-lg font-semibold">
                Track your reading journey
              </p>
              <p className="text-ink-300 text-sm">
                Join Chapterly free. Track books, build streaks, share with friends.
              </p>
              <button
                onClick={() => router.push('/login?mode=signup')}
                className="flex items-center gap-2 bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors mx-auto text-sm"
              >
                Start reading <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function Badge({ label, emoji }: { label: string; emoji: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-paper-200 text-xs font-medium text-ink-700">
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
