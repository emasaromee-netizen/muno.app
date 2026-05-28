-- Tourism items
CREATE TABLE IF NOT EXISTS public.tourism_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid DEFAULT public.default_municipality_id(),
  category text NOT NULL CHECK (category IN ('commerce','gastronomy','lodging','nature','event')),
  title text NOT NULL,
  description text,
  photo_url text,
  location text,
  lat numeric,
  lng numeric,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tourism_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tourism_public_select ON public.tourism_items FOR SELECT USING (published = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tourism_chief') OR public.has_role(auth.uid(),'mayor'));
CREATE POLICY tourism_manage_insert ON public.tourism_items FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tourism_chief'));
CREATE POLICY tourism_manage_update ON public.tourism_items FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tourism_chief'));
CREATE POLICY tourism_manage_delete ON public.tourism_items FOR DELETE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tourism_chief'));

CREATE TRIGGER tourism_items_updated BEFORE UPDATE ON public.tourism_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Staff announcements (Intendente -> Jefes)
CREATE TABLE IF NOT EXISTS public.staff_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid DEFAULT public.default_municipality_id(),
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_ann_internal_select ON public.staff_announcements FOR SELECT USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'area_manager')
  OR public.has_role(auth.uid(),'tourism_chief') OR public.has_role(auth.uid(),'mayor')
);
CREATE POLICY staff_ann_mayor_admin_insert ON public.staff_announcements FOR INSERT WITH CHECK (
  public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY staff_ann_mayor_admin_update ON public.staff_announcements FOR UPDATE USING (
  public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY staff_ann_mayor_admin_delete ON public.staff_announcements FOR DELETE USING (
  public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'admin')
);

CREATE TRIGGER staff_ann_updated BEFORE UPDATE ON public.staff_announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Banners audience
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'residents' CHECK (audience IN ('residents','tourists','both'));

-- Mayor can also manage banners
CREATE POLICY announcements_mayor_insert ON public.announcements FOR INSERT WITH CHECK (public.has_role(auth.uid(),'mayor'));
CREATE POLICY announcements_mayor_update ON public.announcements FOR UPDATE USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY announcements_mayor_delete ON public.announcements FOR DELETE USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY announcements_mayor_select ON public.announcements FOR SELECT USING (public.has_role(auth.uid(),'mayor'));

-- Mayor read-only on supervision tables
CREATE POLICY claims_mayor_select ON public.claims FOR SELECT USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY content_mayor_select ON public.content_items FOR SELECT USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY businesses_mayor_select ON public.businesses FOR SELECT USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY isa_metrics_mayor_select ON public.isa_metrics FOR SELECT USING (public.has_role(auth.uid(),'mayor'));
CREATE POLICY registrations_mayor_select ON public.registrations FOR SELECT USING (public.has_role(auth.uid(),'mayor'));

-- CUIT linking commerce to neighbor profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cuit text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cuit text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_amount numeric;
CREATE INDEX IF NOT EXISTS idx_businesses_cuit ON public.businesses(cuit);