CREATE POLICY "reports_admin_select"
  ON public.analytics_reports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
  );