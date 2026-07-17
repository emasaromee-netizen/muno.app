import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Save, Loader2, BarChart3, Users, AlertTriangle, Calendar } from "lucide-react";

// SOLUCIÓN TS: Tipado estricto para el icono y los campos
const FIELDS: { key: string; label: string; icon: React.ElementType; group: string }[] = [
  { key: "poblacion",           label: "Población total",          icon: Users,         group: "Comunidad" },
  { key: "vecinos_activos",     label: "Vecinos activos en MUNO",  icon: Users,         group: "Comunidad" },
  { key: "reclamos_resueltos",  label: "Reclamos resueltos",       icon: AlertTriangle, group: "Reclamos" },
  { key: "reclamos_pendientes", label: "Reclamos pendientes",      icon: AlertTriangle, group: "Reclamos" },
  { key: "eventos_cultura",     label: "Eventos de Cultura",       icon: Calendar,      group: "Eventos" },
  { key: "eventos_deporte",     label: "Eventos de Deporte",       icon: Calendar,      group: "Eventos" },
  { key: "asistentes_eventos",  label: "Asistentes a eventos",     icon: Calendar,      group: "Eventos" },
];

// SOLUCIÓN TS: Interfaz para el historial de métricas
interface DBMetricHistory {
  period: string;
  vecinos_activos?: number | null;
  reclamos_resueltos?: number | null;
  reclamos_pendientes?: number | null;
  eventos_cultura?: number | null;
  eventos_deporte?: number | null;
  updated_at?: string;
}

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function AdminMetricasInput() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(currentPeriod());
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<DBMetricHistory[]>([]);

  // SOLUCIÓN: Referencia mutable para prevenir condiciones de carrera
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("isa_metrics")
      .select("*")
      .eq("period", period)
      .maybeSingle();
      
    // Leemos el valor actual de la referencia en memoria
    if (!isMounted.current) return;

    if (data) {
      const v: Record<string, string> = {};
      FIELDS.forEach((f) => {
        const val = data[f.key as keyof typeof data];
        v[f.key] = val != null ? String(val) : "";
      });
      setValues(v);
      setNotes(data.notes || "");
    } else {
      setValues({});
      setNotes("");
    }
    
    const { data: hist } = await supabase
      .from("isa_metrics")
      .select("period, vecinos_activos, reclamos_resueltos, reclamos_pendientes, eventos_cultura, eventos_deporte, updated_at")
      .order("period", { ascending: false })
      .limit(12);
      
    if (!isMounted.current) return;
      
    setHistory((hist as DBMetricHistory[]) || []);
    setLoading(false);
  }, [period]);

  useEffect(() => { 
    isMounted.current = true;
    load(); 
    
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  const save = async () => {
    setSaving(true);
    
    // SOLUCIÓN TS: Construcción explícita del payload. 
    // TypeScript validará perfectamente esto contra el tipo Insert de Supabase.
    const { error } = await supabase
      .from("isa_metrics")
      .upsert({
        period,
        notes: notes || null,
        updated_by: user?.id || null,
        poblacion: values["poblacion"] ? Number(values["poblacion"]) : null,
        vecinos_activos: values["vecinos_activos"] ? Number(values["vecinos_activos"]) : null,
        reclamos_resueltos: values["reclamos_resueltos"] ? Number(values["reclamos_resueltos"]) : null,
        reclamos_pendientes: values["reclamos_pendientes"] ? Number(values["reclamos_pendientes"]) : null,
        eventos_cultura: values["eventos_cultura"] ? Number(values["eventos_cultura"]) : null,
        eventos_deporte: values["eventos_deporte"] ? Number(values["eventos_deporte"]) : null,
        asistentes_eventos: values["asistentes_eventos"] ? Number(values["asistentes_eventos"]) : null,
      }, { onConflict: "municipality_id,period" });
      
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Métricas guardadas", { description: `Período ${period}` });
    load();
  };

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[16px] p-5 border flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-isa-light text-isa-navy grid place-items-center">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-extrabold text-isa-navy text-[18px]">
            Carga manual de métricas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estos datos alimentan los gráficos del informe ISA. Una fila por mes.
          </p>
        </div>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-background text-sm font-bold text-isa-navy"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin inline" />
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <div key={g} className="bg-white rounded-[16px] p-5 border">
              <h3 className="font-extrabold text-isa-navy text-sm mb-4">{g}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FIELDS.filter((f) => f.group === g).map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
                      <f.icon className="w-3 h-3" /> {f.label}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm tabular-nums"
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-[16px] p-5 border">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Notas para el analista ISA
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none"
              placeholder="Observaciones, contexto, eventos relevantes…"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-isa-navy text-white rounded-[16px] py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar período {period}
          </button>

          {history.length > 0 && (
            <div className="bg-white rounded-[16px] p-5 border">
              <h3 className="font-extrabold text-isa-navy text-sm mb-3">Historial reciente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground text-left">
                    <tr>
                      <th className="py-2 pr-3">Período</th>
                      <th className="py-2 pr-3 text-right">Vecinos</th>
                      <th className="py-2 pr-3 text-right">Reclamos OK</th>
                      <th className="py-2 pr-3 text-right">Reclamos pend.</th>
                      <th className="py-2 pr-3 text-right">Cultura</th>
                      <th className="py-2 pr-3 text-right">Deporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.period} className="border-t">
                        <td className="py-2 pr-3 font-bold text-isa-navy">{h.period}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{h.vecinos_activos ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{h.reclamos_resueltos ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{h.reclamos_pendientes ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{h.eventos_cultura ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{h.eventos_deporte ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}