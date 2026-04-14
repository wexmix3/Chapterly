-- Migration 023: Add owned flag to user_books
-- Lets users mark books they physically own, independent of shelf status

ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS owned BOOLEAN DEFAULT FALSE;
