-- =====================================================
-- CHAPTERLY — Migration 003: Book Clubs
-- =====================================================

-- ─── Clubs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  member_count INT DEFAULT 1,
  current_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX idx_clubs_public ON public.clubs(is_public, created_at DESC);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_select_public" ON public.clubs FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "clubs_insert" ON public.clubs FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "clubs_update" ON public.clubs FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "clubs_delete" ON public.clubs FOR DELETE USING (owner_id = auth.uid());

-- ─── Club Members ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_members (
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm_select" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON public.club_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cm_delete" ON public.club_members FOR DELETE USING (user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid()));

-- ─── Club Discussions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.club_posts(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  contains_spoilers BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_club_posts_club ON public.club_posts(club_id, created_at DESC);
CREATE INDEX idx_club_posts_parent ON public.club_posts(parent_id);
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
-- Members of the club can see posts
CREATE POLICY "cp_select" ON public.club_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_posts.club_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.clubs WHERE id = club_posts.club_id AND is_public = true)
);
CREATE POLICY "cp_insert" ON public.club_posts FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_posts.club_id AND user_id = auth.uid())
);
CREATE POLICY "cp_update" ON public.club_posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cp_delete" ON public.club_posts FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.clubs WHERE id = club_posts.club_id AND owner_id = auth.uid())
);

-- ─── Reading Progress within club ────────────────────
CREATE TABLE IF NOT EXISTS public.club_progress (
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_page INT DEFAULT 0,
  percent_complete DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (club_id, user_id, book_id)
);
ALTER TABLE public.club_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cprog_select" ON public.club_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_progress.club_id AND user_id = auth.uid())
);
CREATE POLICY "cprog_upsert" ON public.club_progress FOR ALL USING (user_id = auth.uid());

-- ─── Helper RPC functions ─────────────────────────────
CREATE OR REPLACE FUNCTION increment_club_members(club_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.clubs SET member_count = member_count + 1 WHERE id = club_id;
$$;

CREATE OR REPLACE FUNCTION decrement_club_members(club_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = club_id;
$$;
