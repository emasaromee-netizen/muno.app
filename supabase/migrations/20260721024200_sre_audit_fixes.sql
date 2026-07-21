-- 🔴 FIX CRÍTICO 1: Reescribir el RPC para evitar la Explosión Cartesiana
-- Destruimos la función anterior porque cambió la estructura de retorno
DROP FUNCTION IF EXISTS get_municipality_counts();

-- Creamos la versión optimizada con subconsultas aisladas (O(N) en lugar de O(N^4))
CREATE OR REPLACE FUNCTION get_municipality_counts()
RETURNS TABLE(
    municipality_id uuid, 
    name text, 
    profiles_count bigint, 
    businesses_count bigint, 
    claims_count bigint, 
    announcements_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, 
    m.name,
    (SELECT count(*) FROM public.profiles p WHERE p.municipality_id = m.id) as profiles_count,
    (SELECT count(*) FROM public.businesses b WHERE b.municipality_id = m.id) as businesses_count,
    (SELECT count(*) FROM public.claims c WHERE c.municipality_id = m.id) as claims_count,
    (SELECT count(*) FROM public.staff_announcements sa WHERE sa.municipality_id = m.id) as announcements_count
  FROM public.municipalities m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔴 FIX CRÍTICO 2: Índices compuestos faltantes en Claims (Reclamos)
CREATE INDEX IF NOT EXISTS idx_claims_created_desc ON public.claims (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_muni_created_desc ON public.claims (municipality_id, created_at DESC);

-- 🔴 FIX CRÍTICO 3: Arreglar el RLS de Registrations que anulaba la Primary Key
DROP POLICY IF EXISTS "registrations_public_insert" ON public.registrations;
CREATE POLICY "registrations_public_insert" ON public.registrations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_items 
    WHERE content_items.id = registrations.event_id::uuid
  )
);