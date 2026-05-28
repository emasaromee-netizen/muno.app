
-- 1) Tabla de municipios
CREATE TABLE IF NOT EXISTS public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  province TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

INSERT INTO public.municipalities (slug, name, province, is_default)
VALUES
  ('san-francisco-monte-de-oro', 'San Francisco del Monte de Oro', 'San Luis', true),
  ('almafuerte', 'Almafuerte', 'Córdoba', false)
ON CONFLICT (slug) DO NOTHING;

-- 2) Helper
CREATE OR REPLACE FUNCTION public.default_municipality_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.municipalities WHERE is_default = true LIMIT 1 $$;

-- 3) Agregar municipality_id
ALTER TABLE public.businesses             ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.claims                 ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.announcements          ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.internal_announcements ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.profiles               ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.tourist_leads          ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.user_roles             ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.activity_logs          ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.analytics_reports      ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);
ALTER TABLE public.municipal_settings     ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id);

-- Backfill
UPDATE public.businesses             SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.claims                 SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.announcements          SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.internal_announcements SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.profiles               SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.tourist_leads          SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.user_roles             SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.activity_logs          SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.analytics_reports      SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;
UPDATE public.municipal_settings     SET municipality_id = public.default_municipality_id() WHERE municipality_id IS NULL;

-- Default
ALTER TABLE public.businesses             ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.claims                 ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.announcements          ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.internal_announcements ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.profiles               ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.tourist_leads          ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.user_roles             ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.activity_logs          ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.analytics_reports      ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();
ALTER TABLE public.municipal_settings     ALTER COLUMN municipality_id SET DEFAULT public.default_municipality_id();

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_businesses_muni             ON public.businesses(municipality_id);
CREATE INDEX IF NOT EXISTS idx_claims_muni                 ON public.claims(municipality_id);
CREATE INDEX IF NOT EXISTS idx_announcements_muni          ON public.announcements(municipality_id);
CREATE INDEX IF NOT EXISTS idx_internal_announcements_muni ON public.internal_announcements(municipality_id);

-- 5) RLS de municipalities
DROP POLICY IF EXISTS municipalities_public_select ON public.municipalities;
CREATE POLICY municipalities_public_select ON public.municipalities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS municipalities_super_admin_all ON public.municipalities;
CREATE POLICY municipalities_super_admin_all ON public.municipalities
  FOR ALL
  USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

-- 6) Super Admin cross-municipio
DROP POLICY IF EXISTS announcements_super_admin_all ON public.announcements;
CREATE POLICY announcements_super_admin_all ON public.announcements
  FOR ALL
  USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

DROP POLICY IF EXISTS internal_ann_super_admin_all ON public.internal_announcements;
CREATE POLICY internal_ann_super_admin_all ON public.internal_announcements
  FOR ALL
  USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

DROP POLICY IF EXISTS businesses_super_admin_select ON public.businesses;
CREATE POLICY businesses_super_admin_select ON public.businesses
  FOR SELECT USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

DROP POLICY IF EXISTS claims_super_admin_select ON public.claims;
CREATE POLICY claims_super_admin_select ON public.claims
  FOR SELECT USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

DROP POLICY IF EXISTS profiles_super_admin_select ON public.profiles;
CREATE POLICY profiles_super_admin_select ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role));
