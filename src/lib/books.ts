import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookSearchResult, Book, BookSource } from '@/types';

// ─── Open Library ────────────────────────────────────────────
interface OLDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

export async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,isbn,number_of_pages_median,cover_i,subject`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.docs as OLDoc[]).map((doc) => ({
    source: 'openlibrary' as BookSource,
    source_id: doc.key.replace('/works/', ''),
    title: doc.title,
    authors: doc.author_name ?? ['Unknown'],
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,
    published_year: doc.first_publish_year ?? null,
    isbn13: doc.isbn?.find((i) => i.length === 13) ?? null,
    isbn10: doc.isbn?.find((i) => i.length === 10) ?? null,
    page_count: doc.number_of_pages_median ?? null,
  }));
}

// ─── Google Books ────────────────────────────────────────────
interface GBVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    description?: string;
    imageLinks?: { thumbnail?: string };
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    categories?: string[];
  };
}

export async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20${keyParam}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items) return [];

  return (data.items as GBVolume[]).map((vol) => {
    const info = vol.volumeInfo;
    return {
      source: 'googlebooks' as BookSource,
      source_id: vol.id,
      title: info.title,
      authors: info.authors ?? ['Unknown'],
      cover_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null,
      published_year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null,
      isbn13: info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ?? null,
      isbn10: info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier ?? null,
      page_count: info.pageCount ?? null,
    };
  });
}

// ─── Unified search (OL first, GB fallback, deduped) ─────────
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const [olResults, gbResults] = await Promise.allSettled([
    searchOpenLibrary(query),
    searchGoogleBooks(query),
  ]);

  const results: BookSearchResult[] = [];
  const seen = new Set<string>();

  const addUnique = (items: BookSearchResult[]) => {
    for (const r of items) {
      const key = r.isbn13 || `${r.title}-${r.authors[0]}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(r);
      }
    }
  };

  if (olResults.status === 'fulfilled') addUnique(olResults.value);
  if (gbResults.status === 'fulfilled') addUnique(gbResults.value);

  return results;
}

// ─── Get or create book record in Supabase ───────────────────
export async function getOrCreateBook(
  supabase: SupabaseClient,
  searchResult: BookSearchResult
): Promise<Book> {
  // Check if already exists
  const { data: existing } = await supabase
    .from('books')
    .select('*')
    .eq('source', searchResult.source)
    .eq('source_id', searchResult.source_id)
    .single();

  if (existing) return existing as Book;

  const { data: created, error } = await supabase
    .from('books')
    .insert({
      source: searchResult.source,
      source_id: searchResult.source_id,
      isbn10: searchResult.isbn10,
      isbn13: searchResult.isbn13,
      title: searchResult.title,
      authors: searchResult.authors,
      published_year: searchResult.published_year,
      cover_url: searchResult.cover_url,
      page_count: searchResult.page_count,
    })
    .select()
    .single();

  if (error) throw error;
  return created as Book;
}
