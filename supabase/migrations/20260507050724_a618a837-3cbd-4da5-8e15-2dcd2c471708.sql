-- 1) Audit log
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_admin_isa_select" ON public.activity_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'isa_consultant'::app_role)
  );

CREATE POLICY "logs_self_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_created ON public.activity_logs (created_at DESC);

-- 2) Municipal settings (single row pattern)
CREATE TABLE public.municipal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_phone text,
  mayor_name text,
  contact_email text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.municipal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_public_select" ON public.municipal_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_admin_insert" ON public.municipal_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "settings_admin_update" ON public.municipal_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER municipal_settings_updated
  BEFORE UPDATE ON public.municipal_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.municipal_settings (emergency_phone, mayor_name, contact_email)
VALUES ('911', 'Sr. Intendente', 'contacto@muno.gob.ar');

-- 3) Canned responses for claims
CREATE TABLE public.claim_canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.claim_canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canned_internal_select" ON public.claim_canned_responses
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
  );

CREATE POLICY "canned_admin_all" ON public.claim_canned_responses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.claim_canned_responses (label, body) VALUES
  ('Personal en camino', 'El personal municipal se encuentra en camino al lugar del reclamo.'),
  ('Reparación programada', 'La reparación se encuentra programada para la próxima semana.'),
  ('Derivado a cooperativa eléctrica', 'El reclamo fue derivado a la cooperativa eléctrica para su resolución.');

-- 4) user_roles.active flag
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;