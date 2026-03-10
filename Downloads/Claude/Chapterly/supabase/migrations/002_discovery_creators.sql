-- ──────────────────────────────────────────────────────────────────
-- Migration 002: Discovery, Creators, Reviews, Quotes
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- ──────────────────────────────────────────────────────────────────

-- Reviews table (community ratings + text reviews with half-star support)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_book_id UUID REFERENCES public.user_books(id) ON DELETE SET NULL,
  rating DECIMAL(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
  text TEXT,
  contains_spoilers BOOLEAN DEFAULT false,
  mood_tags TEXT[] DEFAULT '{}',
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly viewable"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Quotes table (saved passages from books)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  page_number INT,
  chapter TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public quotes are viewable by all"
  ON public.quotes FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- Trending books table (BookTok / editorial picks)
CREATE TABLE IF NOT EXISTS public.trending_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('booktok', 'bookstagram', 'editorial', 'nyt')),
  label TEXT,
  creator_handle TEXT,
  creator_platform TEXT,
  position INT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trending_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending books are publicly viewable"
  ON public.trending_books FOR SELECT USING (active = true);

-- Curated lists
CREATE TABLE IF NOT EXISTS public.curated_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.curated_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public lists are viewable"
  ON public.curated_lists FOR SELECT USING (is_public = true);

CREATE TABLE IF NOT EXISTS public.curated_list_items (
  list_id UUID REFERENCES public.curated_lists(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  position INT,
  note TEXT,
  PRIMARY KEY (list_id, book_id)
);

ALTER TABLE public.curated_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List items are publicly viewable"
  ON public.curated_list_items FOR SELECT USING (true);

-- Creators table (BookTok/Bookstagram/YouTube influencers)
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'twitter', 'blog')),
  platform_url TEXT NOT NULL,
  follower_count INT,
  genre_tags TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators are publicly viewable"
  ON public.creators FOR SELECT USING (is_active = true);

-- Creator picks
CREATE TABLE IF NOT EXISTS public.creator_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  note TEXT,
  position INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, book_id)
);

ALTER TABLE public.creator_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator picks are publicly viewable"
  ON public.creator_picks FOR SELECT USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON public.quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_trending_active ON public.trending_books(active, position);
CREATE INDEX IF NOT EXISTS idx_creator_picks_creator ON public.creator_picks(creator_id, position);
