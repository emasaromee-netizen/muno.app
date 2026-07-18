-- 1. Revocar la ejecución pública
REVOKE ALL ON FUNCTION public.get_municipality_counts() FROM PUBLIC, anon, authenticated;

-- 2. Conceder permisos al service_role
GRANT EXECUTE ON FUNCTION public.get_municipality_counts() TO service_role;

-- 3. Hardening interno de la función
CREATE OR REPLACE FUNCTION public.get_municipality_counts()
RETURNS TABLE (
  muni_id UUID,
  users_count BIGINT,
  businesses_count BIGINT,
  claims_count BIGINT,
  banners_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'isa_super_admin'::app_role
        AND user_roles.active = true
    )
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Privilegios de auditoría insuficientes';
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS muni_id,
    COALESCE(COUNT(DISTINCT u.id), 0) AS users_count,
    COALESCE(COUNT(DISTINCT b.id), 0) AS businesses_count,
    COALESCE(COUNT(DISTINCT c.id), 0) AS claims_count,
    COALESCE(COUNT(DISTINCT a.id), 0) AS banners_count
  FROM municipalities m
  LEFT JOIN profiles u ON u.municipality_id = m.id
  LEFT JOIN businesses b ON b.municipality_id = m.id
  LEFT JOIN claims c ON c.municipality_id = m.id
  LEFT JOIN announcements a ON a.municipality_id = m.id
  GROUP BY m.id;
END;
$$;