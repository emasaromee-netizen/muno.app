// Analytics interno (mock con localStorage)
export type IntentEvent = {
  ts: number;
  kind: "search_zone" | "category_click" | "wifi_lead" | "reserva_lead" | "rating";
  zone?: string;
  category?: string;
  userType?: string;
  origin?: string;
  rating?: number;
  meta?: Record<string, any>;
};

const KEY = "muno_analytics_v1";

export const track = (e: Omit<IntentEvent, "ts">) => {
  const list = readAll();
  list.push({ ...e, ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list));
};

export const readAll = (): IntentEvent[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

export const groupCount = <T extends string>(items: IntentEvent[], key: keyof IntentEvent): { name: string; count: number }[] => {
  const acc: Record<string, number> = {};
  items.forEach((i) => {
    const v = (i[key] as any) || "—";
    acc[v] = (acc[v] || 0) + 1;
  });
  return Object.entries(acc).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};
