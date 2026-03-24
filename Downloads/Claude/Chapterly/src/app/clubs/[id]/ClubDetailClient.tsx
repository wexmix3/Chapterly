'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import {
  BookOpen, Users, MessageSquare, Send, ArrowLeft,
  Loader2, Globe, Lock, UserPlus, UserMinus, AlertTriangle,
  Search, X, ChevronDown
} from 'lucide-react';

interface ClubBook {
  id: string;
  title: string;
  authors: string[];
  cover_url?: string | null;
  page_count?: number | null;
  description?: string | null;
}

interface ClubData {
  club: {
    id: string;
    name: string;
    description?: string | null;
    is_public: boolean;
    member_count: number;
    current_book_id?: string | null;
    book?: ClubBook | null;
    owner: { id: string; handle: string; display_name: string } | null;
  };
  members: Array<{
    role: string;
    joined_at: string;
    user: { id: string; handle: string; display_name: string; avatar_url?: string | null } | null;
  }>;
  is_member: boolean;
  is_owner: boolean;
  progress: Array<{
    user_id: string;
    current_page: number;
    percent_complete: number;
    user: { display_name: string; avatar_url?: string | null } | null;
  }>;
}

interface Post {
  id: string;
  body: string;
  contains_spoilers: boolean;
  created_at: string;
  author: { id: string; handle: string; display_name: string; avatar_url?: string | null } | null;
}

export default function ClubDetailClient({ clubId, viewerId }: { clubId: string; viewerId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ClubData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussion' | 'members' | 'progress'>('discussion');
  const [postBody, setPostBody] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Book-of-the-month state
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<Array<{ source_id: string; title: string; authors: string[]; cover_url?: string | null }>>([]);
  const [bookSearchLoading, setBookSearchLoading] = useState(false);
  const [changingBook, setChangingBook] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);

  const loadClub = useCallback(async () => {
    const res = await fetch(`/api/clubs/${clubId}`);
    if (!res.ok) { router.push('/clubs'); return; }
    setData(await res.json());
    setLoading(false);
  }, [clubId, router]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    const res = await fetch(`/api/clubs/${clubId}/posts`);
    if (res.ok) setPosts((await res.json()).data ?? []);
    setPostsLoading(false);
  }, [clubId]);

  useEffect(() => { loadClub(); loadPosts(); }, [loadClub, loadPosts]);

  const handleJoinLeave = async () => {
    if (!data) return;
    setJoinLoading(true);
    const method = data.is_member ? 'DELETE' : 'POST';
    const res = await fetch(`/api/clubs/${clubId}/members`, { method });
    if (res.ok) {
      setData(prev => prev ? {
        ...prev,
        is_member: !prev.is_member,
        club: { ...prev.club, member_count: prev.is_member ? prev.club.member_count - 1 : prev.club.member_count + 1 },
      } : prev);
    }
    setJoinLoading(false);
  };

  const submitPost = async () => {
    if (!postBody.trim() || posting) return;
    setPosting(true);
    const res = await fetch(`/api/clubs/${clubId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: postBody.trim(), contains_spoilers: spoiler }),
    });
    if (res.ok) {
      const { data: newPost } = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setPostBody('');
      setSpoiler(false);
    }
    setPosting(false);
  };

  // Book search for owner book picker
  useEffect(() => {
    if (bookSearchQuery.length < 2) { setBookSearchResults([]); return; }
    const t = setTimeout(async () => {
      setBookSearchLoading(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(bookSearchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setBookSearchResults((json.data ?? []).slice(0, 6));
        }
      } finally {
        setBookSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [bookSearchQuery]);

  const handleSetBook = async (bookId: string) => {
    setChangingBook(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_book_id: bookId }),
      });
      if (res.ok) {
        setShowBookSearch(false);
        setBookSearchQuery('');
        setBookSearchResults([]);
        await loadClub();
      }
    } finally {
      setChangingBook(false);
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

  if (!data) return null;
  const { club, members, is_member, is_owner, progress } = data;

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-5">

          {/* Back */}
          <button onClick={() => router.push('/clubs')} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All clubs
          </button>

          {/* Club header */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-paper-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center shadow-sm">
                {club.book?.cover_url ? (
                  <img src={club.book.cover_url} alt={club.book.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold text-ink-900">{club.name}</h1>
                  {club.is_public
                    ? <Globe className="w-3.5 h-3.5 text-ink-400" />
                    : <Lock className="w-3.5 h-3.5 text-ink-400" />}
                </div>
                {club.description && <p className="text-sm text-ink-500 mt-1">{club.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{club.member_count} members</span>
                  {club.book && (
                    <span className="text-brand-600 font-medium truncate max-w-[160px]">
                      Reading: {club.book.title}
                    </span>
                  )}
                </div>
              </div>
              {!is_owner && (
                <button
                  onClick={handleJoinLeave}
                  disabled={joinLoading}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    is_member
                      ? 'bg-paper-100 text-ink-700 hover:bg-red-50 hover:text-red-600 border border-paper-200'
                      : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                  }`}
                >
                  {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                    is_member ? <><UserMinus className="w-4 h-4" /> Leave</> : <><UserPlus className="w-4 h-4" /> Join</>}
                </button>
              )}
            </div>
          </div>

          {/* Current book progress bar */}
          {club.book && progress.length > 0 && (
            <section className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Group progress</p>
              <div className="space-y-2">
                {progress.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-700 flex-shrink-0 overflow-hidden">
                      {p.user?.avatar_url
                        ? <img src={p.user.avatar_url} className="w-full h-full object-cover" alt="" />
                        : p.user?.display_name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-ink-500 mb-0.5">
                        <span>{p.user?.display_name}</span>
                        <span>{Math.round(p.percent_complete)}%</span>
                      </div>
                      <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full" style={{ width: `${p.percent_complete}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-paper-100 rounded-xl p-1">
            {([
              ['discussion', `Discussion (${posts.length})`],
              ['members', `Members (${members.length})`],
              ['progress', 'Progress'],
            ] as const).map(([t, label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Discussion tab */}
          {activeTab === 'discussion' && (
            <div className="space-y-4">

              {/* Current Book section (visible to all when set; owner can change) */}
              {(club.book || is_owner) && (
                <section className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      Current Book
                    </p>
                    {is_owner && (
                      <button
                        onClick={() => setShowBookSearch(s => !s)}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {club.book ? 'Change book' : 'Set a book'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showBookSearch ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {club.book && !showBookSearch && (
                    <div className="flex gap-3">
                      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-paper-200">
                        {club.book.cover_url
                          ? <img src={club.book.cover_url} alt={club.book.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-ink-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-ink-900 truncate">{club.book.title}</p>
                        <p className="text-xs text-ink-400 truncate">{club.book.authors?.[0]}</p>
                        {club.book.page_count && (
                          <p className="text-xs text-ink-400 mt-0.5">{club.book.page_count} pages</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Owner book search picker */}
                  {is_owner && showBookSearch && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 bg-paper-50 border border-ink-200 rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-ink-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={bookSearchQuery}
                          onChange={e => setBookSearchQuery(e.target.value)}
                          placeholder="Search for a book..."
                          className="flex-1 text-sm bg-transparent text-ink-800 placeholder-ink-400 focus:outline-none"
                          autoFocus
                        />
                        {bookSearchQuery && (
                          <button onClick={() => { setBookSearchQuery(''); setBookSearchResults([]); }}>
                            <X className="w-3.5 h-3.5 text-ink-400" />
                          </button>
                        )}
                      </div>
                      {bookSearchLoading && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                        </div>
                      )}
                      {bookSearchResults.length > 0 && (
                        <div className="space-y-1 max-h-56 overflow-y-auto">
                          {bookSearchResults.map(book => (
                            <button
                              key={book.source_id}
                              disabled={changingBook}
                              onClick={() => handleSetBook(book.source_id)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-brand-50 transition-colors text-left"
                            >
                              <div className="w-8 h-12 rounded bg-paper-200 flex-shrink-0 overflow-hidden">
                                {book.cover_url
                                  ? <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                                  : <BookOpen className="w-3 h-3 text-ink-300 m-auto mt-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink-800 truncate">{book.title}</p>
                                <p className="text-xs text-ink-400 truncate">{book.authors?.[0]}</p>
                              </div>
                              {changingBook && <Loader2 className="w-3 h-3 animate-spin text-brand-400 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Static discussion prompts when a book is set */}
              {club.book && (
                <div className="bg-gradient-to-br from-brand-50 to-paper-50 rounded-xl p-4 border border-brand-100">
                  <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-3">
                    Discussion Starters
                  </p>
                  <div className="space-y-2">
                    {[
                      'What surprised you most so far?',
                      'Which character resonates with you and why?',
                      'How does the setting shape the story?',
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => {
                          if (textareaRef.current) {
                            setPostBody(prompt + ' ');
                            textareaRef.current.focus();
                          }
                        }}
                        className="w-full text-left text-xs text-ink-600 bg-white border border-paper-200 rounded-lg px-3 py-2 hover:border-brand-300 hover:text-brand-700 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {is_member ? (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
                  <textarea
                    ref={textareaRef}
                    value={postBody}
                    onChange={e => setPostBody(e.target.value)}
                    placeholder="Share a thought, question, or reaction..."
                    rows={3}
                    className="w-full text-sm text-ink-800 placeholder-ink-400 resize-none focus:outline-none"
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-paper-100">
                    <button
                      onClick={() => setSpoiler(s => !s)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                        spoiler ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-ink-400 hover:text-ink-600'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {spoiler ? 'Spoiler tagged' : 'Tag spoiler'}
                    </button>
                    <button
                      onClick={submitPost}
                      disabled={!postBody.trim() || posting}
                      className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                    >
                      {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-paper-50 rounded-xl p-4 text-center text-sm text-ink-400 border border-paper-200">
                  Join the club to participate in discussions.
                </div>
              )}

              {postsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">No discussion posts yet. Start the conversation!</p>
                </div>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} viewerId={viewerId} />)
              )}
            </div>
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              {members.map((m, i) => {
                const u = m.user;
                if (!u) return null;
                return (
                  <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-paper-200">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0 overflow-hidden">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : u.display_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{u.display_name}</p>
                      <p className="text-xs text-ink-400">@{u.handle}</p>
                    </div>
                    {m.role === 'owner' && (
                      <span className="text-[10px] bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded-full font-medium">Owner</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress tab */}
          {activeTab === 'progress' && (
            <div>
              {!club.book ? (
                <div className="text-center py-10 text-sm text-ink-400">
                  No book selected yet.
                  {is_owner && <p className="mt-1 text-brand-600 cursor-pointer hover:underline">Set a book to read →</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-paper-200 flex gap-3">
                    <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-paper-200">
                      {club.book.cover_url
                        ? <img src={club.book.cover_url} alt={club.book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-ink-300" /></div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink-900 text-sm">{club.book.title}</p>
                      <p className="text-xs text-ink-400">{club.book.authors[0]}</p>
                      {club.book.page_count && <p className="text-xs text-ink-400 mt-0.5">{club.book.page_count} pages</p>}
                    </div>
                  </div>
                  {progress.length === 0 ? (
                    <p className="text-center text-sm text-ink-400 py-4">No progress logged yet.</p>
                  ) : (
                    progress.map((p, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.user?.avatar_url ? <img src={p.user.avatar_url} className="w-full h-full object-cover" alt="" /> : p.user?.display_name[0]}
                          </div>
                          <p className="text-sm font-medium text-ink-800">{p.user?.display_name}</p>
                          <p className="text-xs text-ink-400 ml-auto">p. {p.current_page}</p>
                        </div>
                        <div className="h-2 bg-paper-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, p.percent_complete)}%` }} />
                        </div>
                        <p className="text-[10px] text-ink-400 mt-1 text-right">{Math.round(p.percent_complete)}% complete</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PostCard({ post, viewerId }: { post: Post; viewerId: string }) {
  const [revealed, setRevealed] = useState(false);
  const isOwn = post.author?.id === viewerId;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-paper-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {post.author?.avatar_url
            ? <img src={post.author.avatar_url} className="w-full h-full object-cover" alt="" />
            : post.author?.display_name[0]}
        </div>
        <p className="text-sm font-medium text-ink-800">{post.author?.display_name}</p>
        {isOwn && <span className="text-[10px] text-ink-400">(you)</span>}
        <p className="text-xs text-ink-400 ml-auto">
          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
      {post.contains_spoilers && !revealed ? (
        <button onClick={() => setRevealed(true)} className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-full justify-center">
          <AlertTriangle className="w-3 h-3" /> Contains spoilers — tap to reveal
        </button>
      ) : (
        <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{post.body}</p>
      )}
    </div>
  );
}
