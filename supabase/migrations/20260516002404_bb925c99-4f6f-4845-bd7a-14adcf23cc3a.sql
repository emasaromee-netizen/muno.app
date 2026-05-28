
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS area text;
CREATE INDEX IF NOT EXISTS claims_area_idx ON public.claims(area);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- Tighten claim SELECT/UPDATE for area_manager to own area only
DROP POLICY IF EXISTS claims_owner_select ON public.claims;
DROP POLICY IF EXISTS claims_admin_update ON public.claims;

CREATE POLICY claims_owner_select ON public.claims
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mayor'::app_role)
    OR (public.has_role(auth.uid(), 'area_manager'::app_role) AND area = public.current_user_area())
  );

CREATE POLICY claims_admin_update ON public.claims
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (public.has_role(auth.uid(), 'area_manager'::app_role) AND area = public.current_user_area())
  );
