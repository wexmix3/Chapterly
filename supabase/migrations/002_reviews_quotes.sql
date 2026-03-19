-- =====================================================
-- CHAPTERLY — Migration 002: Reviews & Quotes
-- Run this in your Supabase SQL Editor after 001
-- =====================================================

-- ─── Reviews (community ratings + mood tags) ─────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_book_id UUID REFERENCES public.user_books(id) ON DELETE SET NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  text TEXT,
  mood_tags TEXT[] DEFAULT '{}',
  contains_spoilers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);
CREATE INDEX idx_reviews_book ON public.reviews(book_id, created_at DESC);
CREATE INDEX idx_reviews_user ON public.reviews(user_id, created_at DESC);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (user_id = auth.uid());

-- ─── Quotes (highlighted passages) ──────────────────
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
CREATE INDEX idx_quotes_user ON public.quotes(user_id, created_at DESC);
CREATE INDEX idx_quotes_book ON public.quotes(book_id);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_own_select" ON public.quotes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "quotes_public_select" ON public.quotes FOR SELECT USING (is_public = true);
CREATE POLICY "quotes_insert" ON public.quotes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "quotes_delete" ON public.quotes FOR DELETE USING (user_id = auth.uid());
