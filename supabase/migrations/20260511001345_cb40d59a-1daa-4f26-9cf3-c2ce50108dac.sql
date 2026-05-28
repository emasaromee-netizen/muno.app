ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS guest_city text,
  ADD COLUMN IF NOT EXISTS guest_country text;