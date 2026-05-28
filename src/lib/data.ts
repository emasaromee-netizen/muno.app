// Helpers de datos backed por Lovable Cloud
import { supabase } from "@/integrations/supabase/client";

export async function fetchVisibleBusinesses() {
  // RLS ya filtra enabled=true para no-dueños. Por las dudas reforzamos.
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyClaims(userId: string) {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAnalyticsReports() {
  const { data, error } = await supabase
    .from("analytics_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
