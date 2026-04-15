-- Migration 025: Buddy Reads
-- buddy_reads: pair of users reading the same book together
-- buddy_read_checkpoints: page/note updates within a buddy read

CREATE TABLE IF NOT EXISTS public.buddy_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, inviter_id, invitee_id),
  CHECK (inviter_id != invitee_id)
);
CREATE INDEX idx_buddy_reads_inviter ON public.buddy_reads(inviter_id, status);
CREATE INDEX idx_buddy_reads_invitee ON public.buddy_reads(invitee_id, status);
ALTER TABLE public.buddy_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "br_select" ON public.buddy_reads FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());
CREATE POLICY "br_insert" ON public.buddy_reads FOR INSERT WITH CHECK (inviter_id = auth.uid());
CREATE POLICY "br_update" ON public.buddy_reads FOR UPDATE USING (inviter_id = auth.uid() OR invitee_id = auth.uid());
CREATE POLICY "br_delete" ON public.buddy_reads FOR DELETE USING (inviter_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.buddy_read_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buddy_read_id UUID NOT NULL REFERENCES public.buddy_reads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  page INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_brc_buddy_read ON public.buddy_read_checkpoints(buddy_read_id, created_at DESC);
ALTER TABLE public.buddy_read_checkpoints ENABLE ROW LEVEL SECURITY;
-- Participants can see all checkpoints within their buddy read
CREATE POLICY "brc_select" ON public.buddy_read_checkpoints FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.buddy_reads br
      WHERE br.id = buddy_read_id
        AND (br.inviter_id = auth.uid() OR br.invitee_id = auth.uid())
    )
  );
CREATE POLICY "brc_insert" ON public.buddy_read_checkpoints FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "brc_delete" ON public.buddy_read_checkpoints FOR DELETE USING (user_id = auth.uid());
