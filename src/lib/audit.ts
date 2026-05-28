import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, opts?: {
  entity?: string;
  entity_id?: string;
  meta?: Record<string, any>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activity_logs" as any).insert({
    user_id: user.id,
    user_email: user.email ?? null,
    action,
    entity: opts?.entity ?? null,
    entity_id: opts?.entity_id ?? null,
    meta: opts?.meta ?? {},
  });
}
