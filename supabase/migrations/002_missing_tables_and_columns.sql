-- =====================================================
-- CHAPTERLY — Migration 002: Missing Tables & Columns
-- Run this in your Supabase SQL Editor AFTER 001.
-- =====================================================

-- ─── Add missing columns to users ────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ─── Add missing column to user_books ────────────────
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS dnf_reason TEXT;

-- ─── Subscriptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'premium_monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_own" ON public.subscriptions FOR ALL USING (user_id = auth.uid());

-- ─── Stripe Webhook Events (idempotency) ─────────────
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,         -- Stripe event ID (evt_...)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Streak Milestones ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_days INT NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, milestone_days)
);
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_own" ON public.streak_milestones FOR ALL USING (user_id = auth.uid());

-- ─── Quotes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  page_number INT,
  note TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON public.quotes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_book ON public.quotes(book_id);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_own" ON public.quotes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "quotes_public_read" ON public.quotes FOR SELECT USING (is_public = true);

-- ─── Notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_follower', 'book_recommendation', 'review_comment',
    'streak_milestone', 'friend_finished', 'friend_started',
    'challenge_update', 'weekly_digest'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ─── Review Comments ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_book_id UUID NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_comments_ub ON public.review_comments(user_book_id, created_at ASC);
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rc_select" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "rc_insert" ON public.review_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "rc_update" ON public.review_comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "rc_delete" ON public.review_comments FOR DELETE USING (author_id = auth.uid());

-- ─── Book Recommendations (friend-to-friend) ──────────
CREATE TABLE IF NOT EXISTS public.book_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  message TEXT,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (sender_id != recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_rec_recipient ON public.book_recommendations(recipient_id, created_at DESC);
ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brec_sender" ON public.book_recommendations FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "brec_parties" ON public.book_recommendations FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "brec_recipient_update" ON public.book_recommendations FOR UPDATE USING (recipient_id = auth.uid());

-- ─── AI Rate Limiting ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  call_count INT DEFAULT 1,
  PRIMARY KEY (user_id, endpoint, window_start)
);
-- Auto-clean old windows via expiry index
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_window ON public.ai_rate_limits(window_start);

-- ─── Function: notify on new follower ────────────────
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_name TEXT;
BEGIN
  SELECT display_name INTO actor_name FROM public.users WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
  VALUES (
    NEW.followee_id,
    NEW.follower_id,
    'new_follower',
    actor_name || ' started following you',
    NULL,
    '/u/' || (SELECT handle FROM public.users WHERE id = NEW.follower_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.social_follow;
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON public.social_follow
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- ─── Function: notify when friend finishes a book ────
CREATE OR REPLACE FUNCTION public.notify_friend_finished()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  book_title TEXT;
  actor_name TEXT;
  follower RECORD;
BEGIN
  -- Only fire when status changes to 'read'
  IF NEW.status = 'read' AND (OLD.status IS DISTINCT FROM 'read') THEN
    SELECT title INTO book_title FROM public.books WHERE id = NEW.book_id;
    SELECT display_name INTO actor_name FROM public.users WHERE id = NEW.user_id;

    FOR follower IN
      SELECT follower_id FROM public.social_follow WHERE followee_id = NEW.user_id
    LOOP
      INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
      VALUES (
        follower.follower_id,
        NEW.user_id,
        'friend_finished',
        actor_name || ' finished "' || book_title || '"',
        NULL,
        '/book/' || NEW.book_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friend_finished ON public.user_books;
CREATE TRIGGER trg_notify_friend_finished
  AFTER UPDATE ON public.user_books
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_finished();
