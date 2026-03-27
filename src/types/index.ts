// ─── Book Types ───────────────────────────────────────────────
export type BookSource = 'openlibrary' | 'googlebooks' | 'manual';

export interface Book {
  id: string;
  source: BookSource;
  source_id: string;
  isbn10?: string | null;
  isbn13?: string | null;
  title: string;
  authors: string[];
  published_year?: number | null;
  cover_url?: string | null;
  subjects?: string[];
  page_count?: number | null;
  description?: string | null;
  created_at: string;
}

export interface BookSearchResult {
  source: BookSource;
  source_id: string;
  title: string;
  authors: string[];
  cover_url?: string | null;
  published_year?: number | null;
  isbn13?: string | null;
  isbn10?: string | null;
  page_count?: number | null;
  subjects?: string[];
}

// ─── Shelf / UserBook Types ──────────────────────────────────
export type ShelfStatus = 'to_read' | 'reading' | 'read' | 'dnf';

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ShelfStatus;
  started_at?: string | null;
  finished_at?: string | null;
  rating?: number | null;
  review_text?: string | null;
  current_page?: number | null;
  tags: string[];
  mood?: string | null;
  visibility: 'public' | 'followers' | 'private';
  created_at: string;
  updated_at: string;
  book?: Book;
}

// ─── Session Types ───────────────────────────────────────────
export type SessionMode = 'pages' | 'minutes';

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  user_book_id: string;
  started_at: string;
  ended_at?: string | null;
  pages_start?: number | null;
  pages_end?: number | null;
  pages_delta: number;
  minutes_delta: number;
  mode: SessionMode;
  source: 'manual' | 'timer';
  notes?: string | null;
  created_at: string;
  book?: Book;
}

// ─── Stats Types ─────────────────────────────────────────────
export interface DailyStats {
  user_id: string;
  date: string;
  pages: number;
  minutes: number;
  sessions_count: number;
  is_streak_day: boolean;
}

export interface SessionInsights {
  avg_pages_per_session: number;
  avg_minutes_per_session: number;
  best_day_of_week: string | null;
  best_time_of_day: string | null;
  longest_session_pages: number;
  pages_per_day_30d: number;
}

export interface UserStats {
  total_books_read: number;
  total_pages: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  books_this_year: number;
  pages_this_month: number;
  avg_rating: number | null;
  top_genres: Array<{ name: string; count: number }>;
  reading_by_month: Array<{ month: string; books: number; pages: number }>;
  session_insights: SessionInsights;
}

export interface StreakInfo {
  current: number;
  longest: number;
  today_logged: boolean;
  streak_protection_available: boolean;
}

// ─── Social Types ────────────────────────────────────────────
export interface UserProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string | null;
  is_public: boolean;
  onboarding_complete: boolean;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  books_read_count?: number;
}

// ─── Share Card Types ────────────────────────────────────────
export type ShareCardTemplate =
  | 'now_reading'
  | 'streak_card'
  | 'monthly_recap'
  | 'year_recap'
  | 'five_star_shelf'
  | 'mood_shelf'
  | 'dnf_honesty'
  | 'reading_goal';

export interface ShareCard {
  id: string;
  user_id: string;
  template: ShareCardTemplate;
  payload: Record<string, unknown>;
  image_url?: string | null;
  created_at: string;
}

// ─── Library Import (Goodreads-compatible CSV format) ────────
export interface GoodreadsCSVRow {
  'Book Id': string;
  Title: string;
  Author: string;
  'Author l-f': string;
  'Additional Authors': string;
  ISBN: string;
  ISBN13: string;
  'My Rating': string;
  'Average Rating': string;
  Publisher: string;
  Binding: string;
  'Number of Pages': string;
  'Year Published': string;
  'Original Publication Year': string;
  'Date Read': string;
  'Date Added': string;
  Bookshelves: string;
  'Bookshelves with positions': string;
  'Exclusive Shelf': string;
  'My Review': string;
  Spoiler: string;
  'Private Notes': string;
  'Read Count': string;
  'Owned Copies': string;
}

// ─── API Wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: { total?: number; page?: number; per_page?: number };
}

// ─── Reading Challenge ───────────────────────────────────────
export interface ReadingChallenge {
  id: string;
  user_id: string;
  year: number;
  goal_books: number;
  current_books: number;
  current_pages: number;
  created_at: string;
}
