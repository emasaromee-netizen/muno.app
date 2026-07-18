// Helpers de datos backed por Lovable Cloud
import { supabase } from "@/integrations/supabase/client";

export async function fetchVisibleBusinesses() {
  // RLS ya filtra enabled=true para no-dueños. Por las dudas reforzamos.
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .limit(100); // <-- FIX COMPLIANCE 1.2: Evitamos Unbounded Payload en móviles
    
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyClaims(userId: string) {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50); // <-- FIX COMPLIANCE 1.2: Límite de carga de historial
    
  if (error) throw error;
  return data ?? [];
}

export async function fetchAnalyticsReports() {
  const { data, error } = await supabase
    .from("analytics_reports")
    .select("id, title, period, created_at") // <-- FIX 2.1: Eliminado el overfetching de JSONB
    .order("created_at", { ascending: false })
    .limit(20); // <-- FIX COMPLIANCE 1.2: Limitamos a los reportes más recientes
    
  if (error) throw error;
  return data ?? [];
}