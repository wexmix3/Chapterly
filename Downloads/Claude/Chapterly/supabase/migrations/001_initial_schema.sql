-- =====================================================
-- CHAPTERLY — Full Database Schema
-- Run this in your Supabase SQL Editor (supabase.com)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Reader',
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_public BOOLEAN DEFAULT true,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (is_public = true OR id = auth.uid());
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- ─── Books (shared metadata, readable by all) ───────
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('openlibrary', 'googlebooks', 'manual')),
  source_id TEXT NOT NULL,
  isbn10 TEXT,
  isbn13 TEXT,
  title TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]',
  published_year INT,
  cover_url TEXT,
  page_count INT,
  description TEXT,
  subjects JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_select" ON public.books FOR SELECT USING (true);
CREATE POLICY "books_insert" ON public.books FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── User Books (shelf items) ────────────────────────
CREATE TABLE IF NOT EXISTS public.user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('to_read', 'reading', 'read', 'dnf')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  rating DECIMAL(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
  review_text TEXT,
  current_page INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  mood TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);
CREATE INDEX idx_user_books_user_status ON public.user_books(user_id, status);
CREATE INDEX idx_user_books_updated ON public.user_books(user_id, updated_at DESC);
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ub_own_select" ON public.user_books FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ub_public_select" ON public.user_books FOR SELECT USING (visibility = 'public');
CREATE POLICY "ub_insert" ON public.user_books FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ub_update" ON public.user_books FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ub_delete" ON public.user_books FOR DELETE USING (user_id = auth.uid());

-- ─── Reading Sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_book_id UUID NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  pages_start INT,
  pages_end INT,
  pages_delta INT DEFAULT 0,
  minutes_delta INT DEFAULT 0,
  mode TEXT DEFAULT 'pages' CHECK (mode IN ('pages', 'minutes')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'timer')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sessions_user ON public.sessions(user_id, created_at DESC);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Daily Stats (pre-aggregated for streaks) ────────
CREATE TABLE IF NOT EXISTS public.stats_daily (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pages INT DEFAULT 0,
  minutes INT DEFAULT 0,
  sessions_count INT DEFAULT 0,
  is_streak_day BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, date)
);
CREATE INDEX idx_stats_daily ON public.stats_daily(user_id, date DESC);
ALTER TABLE public.stats_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sd_select" ON public.stats_daily FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sd_insert" ON public.stats_daily FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sd_update" ON public.stats_daily FOR UPDATE USING (user_id = auth.uid());

-- ─── Social Follow Graph ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_follow (
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);
CREATE INDEX idx_follow_followee ON public.social_follow(followee_id);
ALTER TABLE public.social_follow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_select" ON public.social_follow FOR SELECT USING (true);
CREATE POLICY "follow_insert" ON public.social_follow FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follow_delete" ON public.social_follow FOR DELETE USING (follower_id = auth.uid());

-- ─── Share Cards ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.share_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_share_cards ON public.share_cards(user_id, created_at DESC);
ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_select" ON public.share_cards FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sc_insert" ON public.share_cards FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Reading Challenges ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.reading_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  goal_books INT NOT NULL DEFAULT 12,
  goal_pages INT,
  current_books INT DEFAULT 0,
  current_pages INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);
ALTER TABLE public.reading_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rc_all" ON public.reading_challenges FOR ALL USING (user_id = auth.uid());

-- ─── Storage for share card images ───────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('share-cards', 'share-cards', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "sc_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'share-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "sc_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'share-cards');
