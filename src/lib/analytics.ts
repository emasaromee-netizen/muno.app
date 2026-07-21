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

// Tipado estricto para el payload que va a la base de datos
type AnalyticsPayload = {
  kind: string;
  zone: string | null;
  category: string | null;
  user_type: string | null;
  meta: Record<string, string | number | boolean | null>;
};

// 🔴 FIX ALTO SRE: Cola en memoria para Batching sin 'any'
let eventQueue: AnalyticsPayload[] = [];
let flushTimeout: number | null = null;
const FLUSH_INTERVAL = 15000; // 15 segundos
const BATCH_SIZE = 20;        // O cada 20 eventos

const flushQueue = async () => {
  if (eventQueue.length === 0) return;
  
  // Extraemos los eventos actuales y vaciamos la cola al instante para seguir recolectando
  const batch = [...eventQueue];
  eventQueue = [];

  try {
    // Un solo INSERT multi-fila a Supabase en lugar de 20 peticiones separadas
    await supabase.from("analytics_events").insert(batch);
  } catch (err) {
    console.warn("[ANALYTICS] Falló sincronización remota del lote:", err);
    // Nota: Es analítica fire-and-forget. Si falla, priorizamos no trabar la UI.
  }
};

export const track = async (e: Omit<IntentEvent, "ts">) => {
  const localEvent = { ...e, ts: Date.now() };

  // 1. Guardar localmente (Mantenemos fallback offline)
  try {
    const list = readAll();
    list.push(localEvent);
    // Evitamos que el localStorage crezca infinitamente en dispositivos viejos
    if (list.length > 2000) list.splice(0, list.length - 2000);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("[ANALYTICS] LocalStorage lleno o deshabilitado:", err);
  }

  // 2. Encolar para transmisión remota
  eventQueue.push({
    kind: e.kind,
    zone: e.zone || null,
    category: e.category || null,
    user_type: e.userType || null,
    meta: e.meta || {},
  });

  // 3. Evaluar si disparamos el envío (Flush)
  if (eventQueue.length >= BATCH_SIZE) {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    flushQueue();
  } else if (!flushTimeout) {
    // Utilizamos window.setTimeout para evitar conflictos con el tipado de NodeJS en TS
    flushTimeout = window.setTimeout(() => {
      flushTimeout = null;
      flushQueue();
    }, FLUSH_INTERVAL);
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