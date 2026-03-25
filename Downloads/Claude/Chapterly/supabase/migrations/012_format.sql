-- Migration 012: Add format column to user_books
-- Tracks whether a book was read as physical, ebook, or audiobook

ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS format TEXT CHECK (format IN ('physical', 'ebook', 'audiobook')) DEFAULT NULL;
