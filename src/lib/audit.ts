import { supabase } from "@/integrations/supabase/client";

// SOLUCIÓN TS: Tipado estricto para 'meta' usando tipos primitivos compatibles con JSON
export async function logActivity(
  action: string, 
  opts?: {
    entity?: string;
    entity_id?: string;
    meta?: Record<string, string | number | boolean | null>;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 1. Resolver de forma segura la jurisdicción (tenant) del funcionario
    const { data: profile } = await supabase
      .from("profiles")
      .select("municipality_id")
      .eq("id", user.id)
      .maybeSingle();

    const userMuniId = profile?.municipality_id || null;

    // 2. Insertar el registro con el ID de municipio real resuelto y SIN 'as any'
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      action,
      entity: opts?.entity ?? null,
      entity_id: opts?.entity_id ?? null,
      meta: opts?.meta ?? {},
      // Inyectar municipality_id si se resolvió exitosamente
      ...(userMuniId ? { municipality_id: userMuniId } : {})
    });
  } catch (err) {
    console.error("[AUDIT] Falló el registro de auditoría en base de datos:", err);
  }
}