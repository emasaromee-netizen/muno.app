-- 1. BLINDAJE DE PERFILES CIUDADANOS (Protección de PII y DNI)
DROP POLICY IF EXISTS "profiles_owner_select" ON public.profiles;
CREATE POLICY "profiles_owner_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = profiles.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = profiles.municipality_id
        AND user_roles.active = true
    )
  );

-- 2. BLINDAJE DE INVITACIONES AL GABINETE
DROP POLICY IF EXISTS "invitations_admin_all" ON public.municipal_invitations;
CREATE POLICY "invitations_admin_all" ON public.municipal_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = municipal_invitations.municipality_id
        AND user_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = municipal_invitations.municipality_id
        AND user_roles.active = true
    )
  );

-- 3. BLINDAJE DE CONFIGURACIÓN DEL INTENDENTE
DROP POLICY IF EXISTS "settings_admin_insert" ON public.municipal_settings;
CREATE POLICY "settings_admin_insert" ON public.municipal_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = municipal_settings.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "settings_admin_update" ON public.municipal_settings;
CREATE POLICY "settings_admin_update" ON public.municipal_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = municipal_settings.municipality_id
        AND user_roles.active = true
    )
  );

-- 4. BLINDAJE DE NOTICIAS, EVENTOS CULTURALES Y DEPORTIVOS
DROP POLICY IF EXISTS "content_admin_all" ON public.content_items;
CREATE POLICY "content_admin_all" ON public.content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = content_items.municipality_id
        AND user_roles.active = true
    )
  );

-- 5. BLINDAJE DE RESPUESTAS RÁPIDAS Y MÉTRICAS DE ISA
DROP POLICY IF EXISTS "canned_admin_all" ON public.claim_canned_responses;
CREATE POLICY "canned_admin_all" ON public.claim_canned_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = claim_canned_responses.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "isa_metrics_admin_all" ON public.isa_metrics;
CREATE POLICY "isa_metrics_admin_all" ON public.isa_metrics
  FOR ALL TO public USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = isa_metrics.municipality_id
        AND user_roles.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.municipality_id = isa_metrics.municipality_id
        AND user_roles.active = true
    )
  );