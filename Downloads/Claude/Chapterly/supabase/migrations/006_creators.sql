-- =====================================================
-- CHAPTERLY — Migration 006: Creator Verification
-- =====================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_platform TEXT, -- tiktok, instagram, youtube, etc.
  ADD COLUMN IF NOT EXISTS creator_handle TEXT,   -- their social handle
  ADD COLUMN IF NOT EXISTS creator_followers INT DEFAULT 0;

-- Creator applications
CREATE TABLE IF NOT EXISTS public.creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  social_handle TEXT NOT NULL,
  follower_count INT,
  profile_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_own" ON public.creator_applications FOR ALL USING (user_id = auth.uid());
