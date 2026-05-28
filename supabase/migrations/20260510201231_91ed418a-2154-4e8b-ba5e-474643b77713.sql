ALTER TABLE public.registrations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS people_count integer NOT NULL DEFAULT 1;

DROP POLICY IF EXISTS registrations_public_insert ON public.registrations;
CREATE POLICY registrations_public_insert ON public.registrations
FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
  OR (auth.uid() = user_id)
);