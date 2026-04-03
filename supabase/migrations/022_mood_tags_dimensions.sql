-- Migration 022: Add mood_tags and dimension_ratings to user_books
-- mood_tags: array of vibe/mood strings saved per user_book for AI recommendations
-- dimension_ratings: JSONB ratings per dimension (plot, characters, writing, pacing)

ALTER TABLE user_books
  ADD COLUMN IF NOT EXISTS mood_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dimension_ratings JSONB DEFAULT '{}';
