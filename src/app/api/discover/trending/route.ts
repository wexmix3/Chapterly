export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── Hardcoded fallback (no emoji) ───────────────────────────────────────────
const FALLBACK_BOOKS = [
  { book_id: 'fallback-1', title: 'Fourth Wing', authors: ['Rebecca Yarros'], cover_url: 'https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg', count: 0, source: 'internal' as const, label: 'Popular this week' },
  { book_id: 'fallback-2', title: 'Iron Flame', authors: ['Rebecca Yarros'], cover_url: 'https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg', count: 0, source: 'internal' as const, label: 'Popular this week' },
  { book_id: 'fallback-3', title: 'A Court of Thorns and Roses', authors: ['Sarah J. Maas'], cover_url: 'https://covers.openlibrary.org/b/isbn/9781619635180-M.jpg', count: 0, source: 'internal' as const, label: 'Classic pick' },
  { book_id: 'fallback-4', title: 'Happy Place', authors: ['Emily Henry'], cover_url: 'https://covers.openlibrary.org/b/isbn/9780593334867-M.jpg', count: 0, source: 'internal' as const, label: 'Romance fave' },
  { book_id: 'fallback-5', title: 'Lessons in Chemistry', authors: ['Bonnie Garmus'], cover_url: 'https://covers.openlibrary.org/b/isbn/9780385547345-M.jpg', count: 0, source: 'internal' as const, label: 'Must-read' },
  { book_id: 'fallback-6', title: 'The Housemaid', authors: ['Freida McFadden'], cover_url: 'https://covers.openlibrary.org/b/isbn/9781538742549-M.jpg', count: 0, source: 'internal' as const, label: 'Thriller of the year' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface TrendingResult {
  book_id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  count: number;
  source: 'reddit' | 'internal' | 'both';
  subreddit?: string;
  label?: string;
}

interface RedditPost {
  data: {
    title: string;
    score: number;
    url: string;
    permalink: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    pageCount?: number;
  };
}

// ─── Book title extraction from Reddit post titles ────────────────────────────

function extractBookTitle(postTitle: string): string | null {
  // Filter out questions and generic discussions
  const genericStarters = ['what ', 'which ', 'anyone ', 'how ', 'why ', 'does ', 'is ', 'are ', 'can ', 'do ', 'should ', 'would ', 'has ', 'have ', 'did ', 'was ', 'were '];
  const lower = postTitle.toLowerCase().trim();
  if (lower.includes('?')) return null;
  if (genericStarters.some(s => lower.startsWith(s))) return null;

  let title = postTitle;

  // Strip subreddit flair like [Fantasy], (self.books)
  title = title.replace(/\[[^\]]+\]/g, '').replace(/\([^)]*self\.[^)]*\)/gi, '').trim();

  // Strip common prefixes
  const prefixPatterns = [
    /^just\s+finished\s+/i,
    /^finished\s+reading\s+/i,
    /^finished\s+/i,
    /^review:\s*/i,
    /^\[review\]\s*/i,
    /^discussion:\s*/i,
    /^\[discussion\]\s*/i,
    /^thoughts\s+on\s+/i,
    /^finally\s+finished\s+/i,
    /^currently\s+reading\s+/i,
    /^i\s+just\s+finished\s+/i,
    /^i\s+finished\s+/i,
    /^read\s+/i,
  ];
  for (const pattern of prefixPatterns) {
    title = title.replace(pattern, '');
  }
  title = title.trim();

  // Extract text before " - " or " by " patterns
  // "[Author] - Book Title" or "Book Title by Author" or "Book Title - author thoughts"
  const byMatch = title.match(/^(.+?)\s+by\s+/i);
  if (byMatch) {
    title = byMatch[1].trim();
  } else {
    const dashParts = title.split(/\s+[-–—]\s+/);
    if (dashParts.length >= 2) {
      // Heuristic: if first part looks like a name (short, capitalized), take the second
      const first = dashParts[0].trim();
      const words = first.split(' ');
      if (words.length <= 3 && words.every(w => /^[A-Z]/.test(w))) {
        // Looks like author name first
        title = dashParts[1].trim();
      } else {
        title = first;
      }
    }
  }

  title = title.trim();
  if (title.length < 3) return null;

  return title;
}

// ─── Google Books lookup ─────────────────────────────────────────────────────

async function lookupGoogleBooks(bookTitle: string): Promise<{ id: string; title: string; authors: string[]; cover_url: string | null } | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}&maxResults=1&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h for individual lookups
    if (!res.ok) return null;
    const data = await res.json() as { items?: GoogleBooksVolume[] };
    const item = data.items?.[0];
    if (!item) return null;

    return {
      id: `google-${item.id}`,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors ?? [],
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Fetch Reddit subreddit ───────────────────────────────────────────────────

async function fetchRedditHot(subreddit: string, limit: number): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Chapterly/1.0' },
    next: { revalidate: 3600 }, // cache 1 hour
  });
  if (!res.ok) throw new Error(`Reddit ${subreddit} responded ${res.status}`);
  const json = await res.json() as RedditResponse;
  return json.data.children;
}

// ─── GET /api/discover/trending ─────────────────────────────────────────────

export async function GET() {
  // ── 1. Internal trending (last 7 days) ──────────────────────────────────
  let internalTrending: Map<string, { count: number; title: string; authors: string[]; cover_url: string | null }> = new Map();

  try {
    const supabase = createServerSupabaseClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('user_books')
      .select('book_id, books(id, title, authors, cover_url)')
      .gte('created_at', since)
      .not('book_id', 'is', null);

    if (data && data.length > 0) {
      for (const row of data) {
        const id = row.book_id as string;
        if (!id) continue;
        const book = (row.books as unknown) as { id: string; title: string; authors: string[]; cover_url?: string | null } | null;
        const existing = internalTrending.get(id);
        if (existing) {
          existing.count += 1;
        } else {
          internalTrending.set(id, {
            count: 1,
            title: book?.title ?? '',
            authors: book?.authors ?? [],
            cover_url: book?.cover_url ?? null,
          });
        }
      }
    }
  } catch {
    // Internal fetch failed — continue with Reddit data only
  }

  // ── 2. Reddit trending ───────────────────────────────────────────────────
  const redditBookMap: Map<string, { count: number; title: string; authors: string[]; cover_url: string | null; subreddit: string; label: string }> = new Map();

  const [booktokResult, booksResult, fiftyTwoResult] = await Promise.allSettled([
    fetchRedditHot('booktok', 25),
    fetchRedditHot('books', 25),
    fetchRedditHot('52books', 15),
  ]);

  const subredditResults: [PromiseSettledResult<RedditPost[]>, string, string][] = [
    [booktokResult, 'booktok', 'Trending on BookTok'],
    [booksResult, 'books', 'Popular on r/books'],
    [fiftyTwoResult, '52books', 'Popular on r/52books'],
  ];

  // Process Reddit results — limit Google Books lookups to avoid slow responses
  const lookupQueue: Array<{ postTitle: string; score: number; subreddit: string; label: string }> = [];

  for (const [result, subreddit, label] of subredditResults) {
    if (result.status !== 'fulfilled') continue;
    for (const post of result.value) {
      const extracted = extractBookTitle(post.data.title);
      if (!extracted) continue;
      lookupQueue.push({ postTitle: extracted, score: post.data.score, subreddit, label });
    }
  }

  // Sort by score and take top 20 to limit API calls
  lookupQueue.sort((a, b) => b.score - a.score);
  const topQueue = lookupQueue.slice(0, 20);

  // Lookup each in parallel (batched)
  const lookupResults = await Promise.allSettled(
    topQueue.map(async (item) => {
      const book = await lookupGoogleBooks(item.postTitle);
      return { book, ...item };
    })
  );

  for (const res of lookupResults) {
    if (res.status !== 'fulfilled' || !res.value.book) continue;
    const { book, score, subreddit, label } = res.value;
    const titleKey = book.title.toLowerCase();
    const existing = redditBookMap.get(titleKey);
    if (existing) {
      existing.count += score;
    } else {
      redditBookMap.set(titleKey, {
        count: score,
        title: book.title,
        authors: book.authors,
        cover_url: book.cover_url,
        subreddit,
        label,
      });
    }
  }

  // ── 3. Merge internal + Reddit ───────────────────────────────────────────
  const merged: TrendingResult[] = [];

  // Add Reddit results
  for (const [titleKey, item] of redditBookMap) {
    // Check if this title appears in internal trending (fuzzy match by title)
    let internalBoost = 0;
    let internalId: string | null = null;
    for (const [id, internal] of internalTrending) {
      if (internal.title.toLowerCase() === titleKey) {
        internalBoost = internal.count * 10; // weight internal data
        internalId = id;
        break;
      }
    }

    merged.push({
      book_id: internalId ?? `reddit-${titleKey.replace(/\s+/g, '-')}`,
      title: item.title,
      authors: item.authors,
      cover_url: item.cover_url,
      count: item.count + internalBoost,
      source: internalBoost > 0 ? 'both' : 'reddit',
      subreddit: item.subreddit,
      label: item.label,
    });

    // Remove from internal so we don't double-add
    if (internalId) internalTrending.delete(internalId);
  }

  // Add remaining internal books
  for (const [id, item] of internalTrending) {
    merged.push({
      book_id: id,
      title: item.title,
      authors: item.authors,
      cover_url: item.cover_url,
      count: item.count,
      source: 'internal',
      label: 'Popular this week',
    });
  }

  // Sort by count descending, deduplicate by book_id, take top 12
  merged.sort((a, b) => b.count - a.count);
  const seen = new Set<string>();
  const deduped: TrendingResult[] = [];
  for (const item of merged) {
    if (!seen.has(item.book_id)) {
      seen.add(item.book_id);
      deduped.push(item);
    }
    if (deduped.length >= 12) break;
  }

  // ── 4. Fallback ──────────────────────────────────────────────────────────
  if (deduped.length === 0) {
    return NextResponse.json({ data: FALLBACK_BOOKS });
  }

  // Transform to response format (book nested for DiscoverClient compatibility)
  const responseData = deduped.map(item => ({
    book_id: item.book_id,
    count: item.count,
    source: item.source,
    subreddit: item.subreddit,
    label: item.label,
    book: {
      id: item.book_id,
      title: item.title,
      authors: item.authors,
      cover_url: item.cover_url,
    },
  }));

  return NextResponse.json({ data: responseData });
}
