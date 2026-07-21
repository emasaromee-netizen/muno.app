-- 🔴 CRÍTICO 1: BOLA Fix para Jefes de Área en content_items
DROP POLICY IF EXISTS "content_area_manager_insert" ON public.content_items;
DROP POLICY IF EXISTS "content_area_manager_update" ON public.content_items;
DROP POLICY IF EXISTS "content_area_manager_delete" ON public.content_items;

CREATE POLICY "content_area_manager_insert" ON public.content_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = content_items.area
        AND user_roles.municipality_id = content_items.municipality_id
        AND user_roles.active = true
    )
  );

CREATE POLICY "content_area_manager_update" ON public.content_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = content_items.area
        AND user_roles.municipality_id = content_items.municipality_id
        AND user_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = content_items.area
        AND user_roles.municipality_id = content_items.municipality_id
        AND user_roles.active = true
    )
  );

CREATE POLICY "content_area_manager_delete" ON public.content_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = content_items.area
        AND user_roles.municipality_id = content_items.municipality_id
        AND user_roles.active = true
    )
  );

-- 🔴 CRÍTICO 2: BOLA Fix para Jefes de Turismo
DROP POLICY IF EXISTS tourism_manage_insert ON public.tourism_items;
DROP POLICY IF EXISTS tourism_manage_update ON public.tourism_items;
DROP POLICY IF EXISTS tourism_manage_delete ON public.tourism_items;

CREATE POLICY tourism_manage_insert ON public.tourism_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'tourism_chief'::app_role)
        AND user_roles.municipality_id = tourism_items.municipality_id
        AND user_roles.active = true
    )
  );

CREATE POLICY tourism_manage_update ON public.tourism_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'tourism_chief'::app_role)
        AND user_roles.municipality_id = tourism_items.municipality_id
        AND user_roles.active = true
    )
  );

CREATE POLICY tourism_manage_delete ON public.tourism_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'tourism_chief'::app_role)
        AND user_roles.municipality_id = tourism_items.municipality_id
        AND user_roles.active = true
    )
  );

-- 🔴 CRÍTICO 3: BOLA Fix para Comercios y Hacienda
DROP POLICY IF EXISTS "businesses_owner_update" ON public.businesses;
CREATE POLICY "businesses_owner_update" ON public.businesses
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = businesses.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "businesses_owner_insert" ON public.businesses;
CREATE POLICY "businesses_owner_insert" ON public.businesses
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = businesses.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "businesses_admin_delete" ON public.businesses;
CREATE POLICY "businesses_admin_delete" ON public.businesses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = businesses.municipality_id
        AND user_roles.active = true
    )
  );