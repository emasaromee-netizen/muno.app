ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_announcements_tags ON public.announcements USING GIN (tags);