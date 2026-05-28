import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText } from "lucide-react";

type Log = {
  id: string;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: any;
  created_at: string;
};

export default function AdminAuditoria() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("activity_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setLogs((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-[16px] border p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center">
          <ScrollText strokeWidth={1.5} className="w-5 h-5" />
        </div>
        <div>
          <div className="font-extrabold text-isa-navy">Log de Auditoría</div>
          <p className="text-xs text-muted-foreground">
            Trazabilidad completa de las acciones del personal municipal. Acceso exclusivo Intendente · ISA.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted text-isa-navy">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Usuario</th>
                <th className="text-left p-3">Acción</th>
                <th className="text-left p-3">Entidad</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sin registros aún.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("es-AR")}</td>
                  <td className="p-3 font-bold text-isa-navy">{l.user_email || "—"}</td>
                  <td className="p-3">{l.action}</td>
                  <td className="p-3 text-muted-foreground">{l.entity || "—"}{l.entity_id ? ` · ${l.entity_id}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {logs.map((l) => (
            <div key={l.id} className="p-4">
              <div className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString("es-AR")}</div>
              <div className="font-bold text-isa-navy text-sm mt-1">{l.action}</div>
              <div className="text-[12px] text-muted-foreground">{l.user_email || "—"}</div>
              {l.entity && <div className="text-[11px] text-muted-foreground mt-1">{l.entity}{l.entity_id ? ` · ${l.entity_id}` : ""}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
