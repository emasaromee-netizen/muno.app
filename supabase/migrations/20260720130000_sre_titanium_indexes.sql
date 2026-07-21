-- 🔴 CRÍTICO 1: Índice parcial para Inscripciones Activas
CREATE INDEX IF NOT EXISTS idx_registrations_user_active 
ON public.registrations (user_id) 
WHERE (deleted_at IS NULL AND status = 'activa');

-- 🔴 CRÍTICO 2: Índice de Cobertura (INCLUDE) para evitar Heap Scans en RLS
CREATE INDEX IF NOT EXISTS idx_user_roles_rls_cover 
ON public.user_roles (user_id, active, role) 
INCLUDE (municipality_id, area);

-- 🟡 MEDIO 1: Índice parcial para la guía de Puntos Turísticos
CREATE INDEX IF NOT EXISTS idx_tourism_items_muni_category 
ON public.tourism_items (municipality_id, category) 
WHERE (published = true);

-- 🟡 MEDIO 2: Prevenir contención por alta concurrencia en calificaciones
ALTER INDEX IF EXISTS unique_user_muni_rating SET (fillfactor = 90);
REINDEX INDEX unique_user_muni_rating;

-- 🔴 CRÍTICO 1: Índice parcial para optimizar el conteo y filtrado de reclamos activos
-- Ignora por completo los reclamos cerrados, reduciendo el tamaño del índice en un ~90%
CREATE INDEX IF NOT EXISTS idx_claims_muni_active_status
ON public.claims (municipality_id, status)
WHERE (status != 'Cerrado'::public.claim_status);

-- 🔴 CRÍTICO 2: Índice compuesto de cobertura para consultas de auditoría
-- Evita el "External Merge Sort" (ordenamiento en disco) al listar logs de actividad
CREATE INDEX IF NOT EXISTS idx_activity_logs_muni_created_desc
ON public.activity_logs (municipality_id, created_at DESC);