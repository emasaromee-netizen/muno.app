-- Add merchant role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'merchant';

-- Tourist leads table
CREATE TABLE IF NOT EXISTS public.tourist_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text NOT NULL,
  email text,
  source text DEFAULT 'wifi',
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tourist_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tourist_leads_public_insert"
  ON public.tourist_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "tourist_leads_internal_select"
  ON public.tourist_leads FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
    OR public.has_role(auth.uid(), 'isa_consultant'::app_role)
  );