-- =====================================================
-- Migration 013: Fix notification RLS for server inserts
-- Run in Supabase SQL Editor.
-- =====================================================

-- The existing policy only allows users to read/write their OWN notification rows.
-- The notify_new_follower trigger is SECURITY DEFINER so it bypasses RLS correctly,
-- but the app-level service-role client also needs to be able to insert.
-- The service role bypasses RLS entirely, so no policy change is needed for that.

-- What IS needed: ensure the trigger function exists and the notifications table
-- has the correct structure. This migration is idempotent.

-- Re-create the trigger function in case migration 002 wasn't applied:
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_name TEXT;
  actor_handle TEXT;
BEGIN
  SELECT display_name, handle
    INTO actor_name, actor_handle
    FROM public.users WHERE id = NEW.follower_id;

  INSERT INTO public.notifications (user_id, actor_id, type, title, link)
  VALUES (
    NEW.followee_id,
    NEW.follower_id,
    'new_follower',
    COALESCE(actor_name, 'Someone') || ' started following you',
    CASE WHEN actor_handle IS NOT NULL THEN '/u/' || actor_handle ELSE NULL END
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.social_follow;
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON public.social_follow
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Re-create the friend-finished trigger too (idempotent):
CREATE OR REPLACE FUNCTION public.notify_friend_finished()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  book_title TEXT;
  actor_name TEXT;
  follower RECORD;
BEGIN
  IF NEW.status = 'read' AND (OLD.status IS DISTINCT FROM 'read') THEN
    SELECT title INTO book_title FROM public.books WHERE id = NEW.book_id;
    SELECT display_name INTO actor_name FROM public.users WHERE id = NEW.user_id;

    FOR follower IN
      SELECT follower_id FROM public.social_follow WHERE followee_id = NEW.user_id
    LOOP
      INSERT INTO public.notifications (user_id, actor_id, type, title, link)
      VALUES (
        follower.follower_id,
        NEW.user_id,
        'friend_finished',
        COALESCE(actor_name, 'Someone') || ' finished "' || COALESCE(book_title, 'a book') || '"',
        '/book/' || NEW.book_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friend_finished ON public.user_books;
CREATE TRIGGER trg_notify_friend_finished
  AFTER UPDATE ON public.user_books
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_finished();
