-- ==============================================================================
-- 🔴 PARCHE 1: CORRECCIÓN DE COMPARACIONES NULAS EN TRIGGER DE FRAUDE (Anti-Tampering)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_closed_claim_tampering()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Si el reclamo ya estaba cerrado y sigue cerrado
  IF OLD.status = 'Cerrado' AND NEW.status = 'Cerrado' THEN
    -- Utilizar 'IS DISTINCT FROM' para evitar el bypass de evasión de valores NULL (Falla de Operador !=)
    IF NEW.description IS DISTINCT FROM OLD.description 
       OR NEW.category IS DISTINCT FROM OLD.category 
       OR NEW.evidence_photos IS DISTINCT FROM OLD.evidence_photos 
       OR NEW.municipality_id IS DISTINCT FROM OLD.municipality_id THEN
      RAISE EXCEPTION 'Fraude detectado: No se pueden alterar los datos periciales de un reclamo cerrado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- ==============================================================================
-- 🟠 PARCHE 2: HARDENING DE RLS PARA RECURSOS ANALÍTICOS (Previene Exfiltración de Informes)
-- ==============================================================================
DROP POLICY IF EXISTS "reports_admin_select" ON public.analytics_reports;

CREATE POLICY "reports_admin_select"
  ON public.analytics_reports FOR SELECT
  USING (
    (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'area_manager'::app_role)
    )
    AND municipality_id = (
      SELECT municipality_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- ==============================================================================
-- 🟠 PARCHE 3: HARDENING DE RLS PARA ANUNCIOS INSTITUCIONALES (Previene Defacement)
-- ==============================================================================
DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;

CREATE POLICY "announcements_admin_update" ON public.announcements
  FOR UPDATE USING (
    (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'mayor'::app_role)
    )
    AND municipality_id = (
      SELECT municipality_id FROM public.profiles WHERE id = auth.uid()
    )
    AND NOT ('muno_fixed' = ANY(COALESCE(tags, '{}'::text[])))
  );


-- ==============================================================================
-- 🟡 PARCHE 4: AUDITORÍA DE ÍNDICES SRE DE ALTO RENDIMIENTO
-- ==============================================================================
-- Garantizar Index Scans sobre la tabla activity_logs y evitar Sequential Scans catastróficos en consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_activity_logs_muni_created_desc
ON public.activity_logs (municipality_id, created_at DESC);

-- Garantizar Index Scans para el emparejamiento de CUITs comerciales aislados
CREATE INDEX IF NOT EXISTS idx_businesses_muni_cuit
ON public.businesses (municipality_id, cuit);