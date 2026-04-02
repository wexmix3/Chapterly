-- Migration 019: book_series + series_books
-- Tracks series metadata and which books belong to each series.

CREATE TABLE IF NOT EXISTS book_series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS book_series_name_idx ON book_series (name);

ALTER TABLE book_series ENABLE ROW LEVEL SECURITY;

-- Public read, admin write (via CRON_SECRET-gated API route)
CREATE POLICY "book_series_select" ON book_series
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "book_series_insert" ON book_series
  FOR INSERT TO service_role USING (true);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS series_books (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  book_id   UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  UNIQUE (series_id, book_id),
  UNIQUE (series_id, position)
);

CREATE INDEX IF NOT EXISTS series_books_book_idx ON series_books (book_id);
CREATE INDEX IF NOT EXISTS series_books_series_idx ON series_books (series_id, position);

ALTER TABLE series_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_books_select" ON series_books
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "series_books_insert" ON series_books
  FOR INSERT TO service_role USING (true);
