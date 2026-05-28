
-- =========================================================
-- MUNO · Esquema base, roles, RLS y automatizaciones
-- =========================================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('tourist', 'resident', 'admin', 'area_manager', 'isa_consultant');
CREATE TYPE public.claim_status AS ENUM ('Pendiente', 'En curso', 'Cerrado');
CREATE TYPE public.banner_color AS ENUM ('navy', 'red', 'emerald');

-- =========================================================
-- PROFILES (datos personales sensibles)
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  dni TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES (separadas para evitar escalada de privilegios)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================================
-- USERS VIEW pública (sin DNI ni dirección)
-- =========================================================
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, full_name, created_at FROM public.profiles;

-- =========================================================
-- CLAIMS (Reclamos)
-- =========================================================
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  address TEXT,
  status claim_status NOT NULL DEFAULT 'Pendiente',
  evidence_photos TEXT[] DEFAULT '{}',
  resolution_photos TEXT[] DEFAULT '{}',
  resolution_note TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  rating SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- BUSINESSES (Comercios)
-- =========================================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  zone TEXT,
  address TEXT,
  photo_url TEXT,
  schedule TEXT,
  price NUMERIC,
  enabled BOOLEAN NOT NULL DEFAULT true,
  tax_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Auto-disable on tax expiration (validation trigger, no CHECK)
CREATE OR REPLACE FUNCTION public.businesses_auto_disable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tax_expires_at IS NOT NULL AND NEW.tax_expires_at < now() THEN
    NEW.enabled := false;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_businesses_auto_disable
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.businesses_auto_disable();

-- =========================================================
-- ANALYTICS REPORTS (solo ISA)
-- =========================================================
CREATE TABLE public.analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  period TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- ANNOUNCEMENTS (Banners de Home)
-- =========================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  color banner_color NOT NULL DEFAULT 'navy',
  cta_label TEXT,
  cta_to TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- updated_at helper trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.analytics_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- handle_new_user: crea profile + rol "resident" por defecto
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'resident')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- PROFILES: dueño y admin (DNI/dirección sólo aquí)
CREATE POLICY "profiles_owner_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_owner_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES: lectura propia + admin gestiona
CREATE POLICY "roles_self_select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CLAIMS: vecino ve los suyos; admin/area_manager ven todos
CREATE POLICY "claims_owner_select" ON public.claims
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'area_manager')
  );
CREATE POLICY "claims_owner_insert" ON public.claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "claims_owner_update" ON public.claims
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "claims_admin_update" ON public.claims
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'area_manager')
  );

-- BUSINESSES: público sólo enabled=true; dueño ve los suyos; admin gestiona
CREATE POLICY "businesses_public_enabled" ON public.businesses
  FOR SELECT USING (enabled = true);
CREATE POLICY "businesses_owner_select" ON public.businesses
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "businesses_admin_select" ON public.businesses
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'area_manager')
  );
CREATE POLICY "businesses_owner_insert" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "businesses_owner_update" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "businesses_admin_delete" ON public.businesses
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ANALYTICS_REPORTS: solo ISA
CREATE POLICY "reports_isa_select" ON public.analytics_reports
  FOR SELECT USING (public.has_role(auth.uid(), 'isa_consultant'));
CREATE POLICY "reports_isa_all" ON public.analytics_reports
  FOR ALL USING (public.has_role(auth.uid(), 'isa_consultant'))
  WITH CHECK (public.has_role(auth.uid(), 'isa_consultant'));

-- ANNOUNCEMENTS: lectura pública (anon ok); admin gestiona
CREATE POLICY "announcements_public_select" ON public.announcements
  FOR SELECT USING (true);
CREATE POLICY "announcements_admin_all" ON public.announcements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SEED inicial de banners
-- =========================================================
INSERT INTO public.announcements (title, description, color, order_index, enabled, cta_label) VALUES
  ('MUNO', 'La huella digital de nuestra comunidad. Reclamos, talleres, deporte y agenda. Sin filas.', 'navy', 1, true, NULL),
  ('Corte de agua programado', 'Hoy de 14 a 18hs en Barrio Centro. Cuadrillas de Aguas del Portezuelo trabajan en una rotura de caño troncal. Recomendamos juntar reserva.', 'red', 2, true, 'Ver detalle'),
  ('Festival Folclórico de San Luis', 'Tres noches de música popular en el Anfiteatro Municipal. Entrada gratuita.', 'emerald', 3, true, 'Ver agenda');
