-- 🔴 CRÍTICO 1: Índices para la tabla más leída de la plataforma (Turismo/Lugares/Eventos)
CREATE INDEX IF NOT EXISTS idx_content_items_muni_kind_pub_created
ON public.content_items (municipality_id, kind, created_at DESC)
WHERE published = true;

-- 🔴 CRÍTICO 2: Índices para contadores masivos (Salva la función get_municipality_counts)
CREATE INDEX IF NOT EXISTS idx_profiles_municipality ON public.profiles (municipality_id);
CREATE INDEX IF NOT EXISTS idx_staff_announcements_muni ON public.staff_announcements (municipality_id);

-- 🟡 MEDIO 1: Índice para NotificationsBell filtrado por municipio
CREATE INDEX IF NOT EXISTS idx_notifications_muni_created ON public.notifications (municipality_id, created_at DESC);