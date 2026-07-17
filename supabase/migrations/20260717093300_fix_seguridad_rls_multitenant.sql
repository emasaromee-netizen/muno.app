-- 1. BLINDAJE DE RECLAMOS (Solo el admin/manager del municipio correcto puede editar)
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
  );

-- 2. BLINDAJE DE ROLES (Un admin no puede darle roles a usuarios de otro municipio)
DROP POLICY IF EXISTS "roles_admin_all" ON public.user_roles;
CREATE POLICY "roles_admin_all" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles AS admin_role
      WHERE admin_role.user_id = auth.uid()
        AND admin_role.role = 'admin'::app_role
        AND admin_role.municipality_id = user_roles.municipality_id
        AND admin_role.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles AS admin_role
      WHERE admin_role.user_id = auth.uid()
        AND admin_role.role = 'admin'::app_role
        AND admin_role.municipality_id = user_roles.municipality_id
        AND admin_role.active = true
    )
  );

-- 3. PRIVACIDAD DE DATOS (Nadie de otro municipio puede ver los inscriptos a tus eventos)
DROP POLICY IF EXISTS "registrations_owner_select" ON public.registrations;
CREATE POLICY "registrations_owner_select" ON public.registrations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin'::app_role, 'mayor'::app_role)
        AND user_roles.municipality_id = registrations.municipality_id
        AND user_roles.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'area_manager'::app_role
        AND user_roles.area = registrations.event_type
        AND user_roles.municipality_id = registrations.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "registrations_owner_update" ON public.registrations;
CREATE POLICY "registrations_owner_update" ON public.registrations
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = registrations.municipality_id
        AND user_roles.active = true
    )
  );

DROP POLICY IF EXISTS "registrations_owner_delete" ON public.registrations;
CREATE POLICY "registrations_owner_delete" ON public.registrations
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = registrations.municipality_id
        AND user_roles.active = true
    )
  );

-- 4. PRIVACIDAD DE LOGS (Solo ISA o el Admin de ESE municipio puede ver qué hacen los empleados)
DROP POLICY IF EXISTS "logs_admin_isa_select" ON public.activity_logs;
CREATE POLICY "logs_admin_isa_select" ON public.activity_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'isa_consultant'::app_role)
    OR public.has_role(auth.uid(), 'isa_super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
        AND user_roles.municipality_id = activity_logs.municipality_id
        AND user_roles.active = true
    )
  );

-- 5. ANTI-HACKEO CIUDADANO (El vecino no puede cerrar su propio reclamo haciendo trampa)
DROP POLICY IF EXISTS claims_owner_update ON public.claims;
CREATE POLICY claims_owner_update ON public.claims
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'Pendiente'::claim_status
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'Pendiente'::claim_status
    AND resolved_by IS NULL
    AND resolved_at IS NULL
    AND resolution_note IS NULL
    AND rating IS NULL
  );