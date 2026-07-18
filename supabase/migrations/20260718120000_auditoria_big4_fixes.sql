-- ==============================================================================
-- 🔴 FIX 1 (CRÍTICO): Evitar que un Jefe de Área cambie el dueño de un reclamo
-- ==============================================================================
DROP POLICY IF EXISTS claims_admin_update ON public.claims;

CREATE POLICY claims_admin_update ON public.claims
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
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
  )
  WITH CHECK (
    -- Bloqueo estricto: El user_id original del reclamo es inmutable
    user_id = (SELECT c.user_id FROM public.claims c WHERE c.id = claims.id)
  );

-- ==============================================================================
-- 🟠 FIX 2 (ALTO): Bloquear la exposición pública de los emails de Intendentes
-- ==============================================================================
DROP POLICY IF EXISTS "settings_public_select" ON public.municipal_settings;

CREATE POLICY "settings_internal_select" ON public.municipal_settings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'mayor'::app_role, 'area_manager'::app_role)
        AND user_roles.municipality_id = municipal_settings.municipality_id
        AND user_roles.active = true
    )
  );

CREATE OR REPLACE VIEW public.settings_public 
WITH (security_invoker = on) AS
  SELECT municipality_id, emergency_phone FROM public.municipal_settings;

-- ==============================================================================
-- 🟠 FIX 3 (ALTO): Evitar bots y spam en calificaciones turísticas
-- ==============================================================================
DROP POLICY IF EXISTS tourist_ratings_public_insert ON public.tourist_ratings;

CREATE POLICY tourist_ratings_auth_insert ON public.tourist_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Evitar que el mismo usuario vote 100 veces negativas al mismo municipio
ALTER TABLE public.tourist_ratings 
  ADD CONSTRAINT unique_user_muni_rating UNIQUE (user_id, municipality_id);

-- ==============================================================================
-- 🟠 FIX 4 (ALTO): Evitar que mezclen eventos de un municipio en otro (BOLA)
-- ==============================================================================
DROP POLICY IF EXISTS registrations_public_insert ON public.registrations;

CREATE POLICY registrations_public_insert ON public.registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (
      (auth.uid() IS NULL AND user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
      OR 
      (auth.uid() = user_id)
    )
    AND municipality_id = (
      -- Blindaje cruzado: El municipio inyectado DEBE ser el del evento real
      SELECT municipality_id FROM public.content_items 
      WHERE content_items.id::text = event_id
    )
  );

-- ==============================================================================
-- 🟡 FIX 5 (MEDIO): Estabilizar la función de áreas (Asegurar determinismo)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_user_area()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area FROM public.user_roles
  WHERE user_id = auth.uid() 
    AND role = 'area_manager'::app_role
    AND active = true
  ORDER BY created_at ASC -- Forzamos orden para que sea predecible
  LIMIT 1
$$;

-- ==============================================================================
-- 🔵 FIX 6 (BAJO): Ocultar inscripciones borradas lógicamente (Soft Delete)
-- ==============================================================================
DROP POLICY IF EXISTS "registrations_owner_select" ON public.registrations;

CREATE POLICY "registrations_owner_select" ON public.registrations
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      auth.uid() = user_id 
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin'::app_role, 'mayor'::app_role)
          AND user_roles.municipality_id = registrations.municipality_id
          AND user_roles.active = true
      )
    )
  );