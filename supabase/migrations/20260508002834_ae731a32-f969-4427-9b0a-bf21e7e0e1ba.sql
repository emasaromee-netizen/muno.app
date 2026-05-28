
-- ============ INVITACIONES MUNICIPALES ============
CREATE TABLE public.municipal_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID DEFAULT public.default_municipality_id(),
  email TEXT NOT NULL,
  role app_role NOT NULL,
  area TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID,
  invited_by_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.municipal_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_admin_all ON public.municipal_invitations
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY invitations_super_admin_all ON public.municipal_invitations
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'isa_super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'isa_super_admin'::app_role));

-- Permitir leer una invitación con el token (para la página de claim sin login)
CREATE POLICY invitations_public_token_select ON public.municipal_invitations
  FOR SELECT TO public
  USING (true);

CREATE TRIGGER set_invitations_updated_at
BEFORE UPDATE ON public.municipal_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_invitations_email ON public.municipal_invitations(email);
CREATE INDEX idx_invitations_status ON public.municipal_invitations(status);

-- ============ MÉTRICAS ISA (carga manual) ============
CREATE TABLE public.isa_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID DEFAULT public.default_municipality_id(),
  period TEXT NOT NULL, -- 'YYYY-MM'
  poblacion INTEGER,
  vecinos_activos INTEGER,
  reclamos_resueltos INTEGER,
  reclamos_pendientes INTEGER,
  eventos_cultura INTEGER,
  eventos_deporte INTEGER,
  asistentes_eventos INTEGER,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (municipality_id, period)
);

ALTER TABLE public.isa_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY isa_metrics_admin_all ON public.isa_metrics
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'area_manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'area_manager'::app_role));

CREATE POLICY isa_metrics_isa_select ON public.isa_metrics
  FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'isa_consultant'::app_role) OR public.has_role(auth.uid(), 'isa_super_admin'::app_role));

CREATE TRIGGER set_isa_metrics_updated_at
BEFORE UPDATE ON public.isa_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
