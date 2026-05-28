CREATE TABLE public.internal_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_ann_admin_manager_select" ON public.internal_announcements
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
  );

CREATE POLICY "internal_ann_admin_insert" ON public.internal_announcements
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "internal_ann_admin_update" ON public.internal_announcements
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "internal_ann_admin_delete" ON public.internal_announcements
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER internal_ann_set_updated_at
  BEFORE UPDATE ON public.internal_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();