-- =====================================================
-- CHAPTERLY — Migration 004: Reading Lists
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reading_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  cover_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_rlists_user ON public.reading_lists(user_id, created_at DESC);
CREATE INDEX idx_rlists_public ON public.reading_lists(is_public, created_at DESC);
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rl_select" ON public.reading_lists FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "rl_insert" ON public.reading_lists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "rl_update" ON public.reading_lists FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rl_delete" ON public.reading_lists FOR DELETE USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.reading_list_books (
  list_id UUID NOT NULL REFERENCES public.reading_lists(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  note TEXT,
  position INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (list_id, book_id)
);
CREATE INDEX idx_rlb_list ON public.reading_list_books(list_id, position);
ALTER TABLE public.reading_list_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rlb_select" ON public.reading_list_books FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "rlb_insert" ON public.reading_list_books FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid())
);
CREATE POLICY "rlb_delete" ON public.reading_list_books FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.reading_lists WHERE id = list_id AND user_id = auth.uid())
);
