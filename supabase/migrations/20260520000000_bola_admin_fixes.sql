-- =========================================================
-- MUNO · Blindaje de Políticas RLS contra ataques BOLA
-- =========================================================

-- 1. RECLAMOS (claims): Forzar validación de municipio en consultas administrativas
DROP POLICY IF EXISTS claims_owner_select ON public.claims;
CREATE POLICY claims_owner_select ON public.claims
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'mayor'::app_role)
        AND user_roles.municipality_id = claims.municipality_id
        AND user_roles.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = claims.area
        AND user_roles.municipality_id = claims.municipality_id
        AND user_roles.active = true
    )
  );

-- 2. COMERCIOS (businesses): Bloquear cruce de datos en consultas administrativas
DROP POLICY IF EXISTS businesses_admin_select ON public.businesses;
CREATE POLICY businesses_admin_select ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'mayor'::app_role)
        AND user_roles.municipality_id = businesses.municipality_id
        AND user_roles.active = true
    )
  );

-- 3. TURISMO (tourism_items): Solo personal del mismo municipio gestiona los lugares
DROP POLICY IF EXISTS tourism_public_select ON public.tourism_items;
CREATE POLICY tourism_public_select ON public.tourism_items 
  FOR SELECT USING (
    published = true 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'tourism_chief'::app_role, 'mayor'::app_role)
        AND user_roles.municipality_id = tourism_items.municipality_id
        AND user_roles.active = true
    )
  );

-- 4. ANUNCIOS INTERNOS (staff_announcements): Aislamiento estricto de novedades
DROP POLICY IF EXISTS staff_ann_internal_select ON public.staff_announcements;
CREATE POLICY staff_ann_internal_select ON public.staff_announcements 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'area_manager'::app_role, 'tourism_chief'::app_role, 'mayor'::app_role)
        AND user_roles.municipality_id = staff_announcements.municipality_id
        AND user_roles.active = true
    )
  );