import { supabase } from "@/integrations/supabase/client";

// SOLUCIÓN TS: Tipado estricto sin usar 'any' para proteger el JSONB
export type IntentEvent = {
  ts: number;
  kind: "search_zone" | "category_click" | "wifi_lead" | "reserva_lead" | "rating";
  zone?: string;
  category?: string;
  userType?: string;
  origin?: string;
  rating?: number;
  meta?: Record<string, string | number | boolean | null>; 
};

const KEY = "muno_analytics_v1";

export const track = async (e: Omit<IntentEvent, "ts">) => {
  // 1. Guardar localmente (Mantenemos fallback offline)
  const list = readAll();
  list.push({ ...e, ts: Date.now() });
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("[ANALYTICS] LocalStorage lleno o deshabilitado:", err);
  }

  // 2. Transmitir de forma asíncrona a Supabase (Fire-and-forget)
  try {
    await supabase.from("analytics_events").insert({
      kind: e.kind,
      zone: e.zone || null,
      category: e.category || null,
      user_type: e.userType || null,
      meta: e.meta || {},
    });
  } catch (err) {
    // Silenciamos el error para no arruinar la experiencia del usuario si falla la conexión móvil
    console.warn("[ANALYTICS] Falló sincronización remota:", err);
  }
};

export const readAll = (): IntentEvent[] => {
  try { 
    return JSON.parse(localStorage.getItem(KEY) || "[]"); 
  } catch { 
    return []; 
  }
};

// SOLUCIÓN TS: Eliminación del casteo 'as any' usando conversión segura
export const groupCount = (
  items: IntentEvent[], 
  key: keyof IntentEvent
): { name: string; count: number }[] => {
  const acc: Record<string, number> = {};
  items.forEach((i) => {
    const val = i[key];
    // Convertimos a string de forma segura. Si es un objeto (como 'meta') o nulo, lo ignoramos.
    const v = val !== undefined && val !== null && typeof val !== "object" ? String(val) : "—";
    acc[v] = (acc[v] || 0) + 1;
  });
  return Object.entries(acc)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};