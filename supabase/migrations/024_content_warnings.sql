-- Migration 024: Add content_warnings to books
-- Community-submitted trigger/content warnings, stored as a text array on the shared books table

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS content_warnings TEXT[] DEFAULT '{}';
