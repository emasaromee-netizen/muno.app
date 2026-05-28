-- Helper: área actual del usuario (jefe de área)
CREATE OR REPLACE FUNCTION public.current_user_area()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'area_manager'::app_role
  LIMIT 1
$$;

-- Tabla de contenido publicado por áreas
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  days TEXT,
  schedule TEXT,
  photo_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  municipality_id UUID DEFAULT public.default_municipality_id(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_public_select" ON public.content_items
  FOR SELECT USING (published = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'area_manager'::app_role));

CREATE POLICY "content_admin_all" ON public.content_items
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "content_area_manager_insert" ON public.content_items
  FOR INSERT WITH CHECK (
    has_role(auth.uid(),'area_manager'::app_role)
    AND area = public.current_user_area()
  );

CREATE POLICY "content_area_manager_update" ON public.content_items
  FOR UPDATE USING (
    has_role(auth.uid(),'area_manager'::app_role)
    AND area = public.current_user_area()
  );

CREATE POLICY "content_area_manager_delete" ON public.content_items
  FOR DELETE USING (
    has_role(auth.uid(),'area_manager'::app_role)
    AND area = public.current_user_area()
  );

CREATE TRIGGER content_items_set_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reforzar políticas de announcements: MUNO fijo solo ISA
DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;

CREATE POLICY "announcements_admin_select" ON public.announcements
  FOR SELECT USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'area_manager'::app_role));

CREATE POLICY "announcements_admin_insert" ON public.announcements
  FOR INSERT WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );

CREATE POLICY "announcements_admin_update" ON public.announcements
  FOR UPDATE USING (
    has_role(auth.uid(),'admin'::app_role)
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );

CREATE POLICY "announcements_admin_delete" ON public.announcements
  FOR DELETE USING (
    has_role(auth.uid(),'admin'::app_role)
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );

-- Jefe de área: solo banners de su categoría
CREATE POLICY "announcements_area_manager_insert" ON public.announcements
  FOR INSERT WITH CHECK (
    has_role(auth.uid(),'area_manager'::app_role)
    AND public.current_user_area() = ANY(COALESCE(tags,'{}'::text[]))
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );

CREATE POLICY "announcements_area_manager_update" ON public.announcements
  FOR UPDATE USING (
    has_role(auth.uid(),'area_manager'::app_role)
    AND public.current_user_area() = ANY(COALESCE(tags,'{}'::text[]))
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );

CREATE POLICY "announcements_area_manager_delete" ON public.announcements
  FOR DELETE USING (
    has_role(auth.uid(),'area_manager'::app_role)
    AND public.current_user_area() = ANY(COALESCE(tags,'{}'::text[]))
    AND NOT ('muno_fixed' = ANY(COALESCE(tags,'{}'::text[])))
  );