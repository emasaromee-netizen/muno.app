import { useState, useMemo } from "react";
import { admin_commerces, type AdminCommerce } from "@/data/mock";
import { CheckCircle2, AlertTriangle, Mail, Send, X } from "lucide-react";
import { formatARS } from "@/lib/format";
import { toast } from "sonner";
import { logActivity } from "@/lib/audit";

const DAY = 86400000;
const isOverdue = (due: string) => new Date(due).getTime() < Date.now();
const dueSoon = (due: string) => {
  const diff = new Date(due).getTime() - Date.now();
  return diff >= 0 && diff <= 15 * DAY;
};

export default function AdminComercios() {
  const [items, setItems] = useState<AdminCommerce[]>(admin_commerces);
  const [active, setActive] = useState<AdminCommerce | null>(null);
  const [msg, setMsg] = useState("");

  const enriched = useMemo(() => items.map((c) => {
    const overdue = !c.tax_paid && isOverdue(c.tax_due);
    const soon = !c.tax_paid && !overdue && dueSoon(c.tax_due);
    return { ...c, visible: c.enabled && !overdue, overdue, soon };
  }), [items]);

  const update = (c: AdminCommerce) => setItems((p) => p.map((x) => x.id === c.id ? c : x));

  const totalRecaudado = items.filter((c) => c.tax_paid).reduce((a, b) => a + b.tax_amount, 0);
  const totalPendiente = items.filter((c) => !c.tax_paid).reduce((a, b) => a + b.tax_amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="isa-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Recaudado</div>
          <div className="text-xl font-extrabold text-muno-teal mt-0.5">{formatARS(totalRecaudado)}</div>
        </div>
        <div className="isa-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pendiente</div>
          <div className="text-xl font-extrabold text-muno-red mt-0.5">{formatARS(totalPendiente)}</div>
        </div>
      </div>

      <div className="space-y-3">
        {enriched.map((c) => (
          <div
            key={c.id}
            className="isa-card p-4 flex items-start gap-3 border-l-4"
            style={{
              borderLeftColor: c.overdue ? "#EF4444" : c.soon ? "#F59E0B" : "transparent",
              background: c.overdue ? "#FEF2F2" : c.soon ? "#FFFBEB" : undefined,
            }}
          >
            <img src={c.photo} className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-extrabold text-isa-navy text-sm truncate">{c.name}</div>
                {c.enabled
                  ? <span className="isa-chip bg-muno-teal/15 text-muno-teal"><CheckCircle2 className="w-3 h-3" />Habilitado</span>
                  : <span className="isa-chip bg-muted text-muted-foreground">Pendiente de validación</span>}
                {c.overdue && <span className="isa-chip bg-muno-red/15 text-muno-red"><AlertTriangle className="w-3 h-3" />Tasa vencida · oculto</span>}
                {c.soon && <span className="isa-chip" style={{ background: "#FEF3C7", color: "#92400E" }}><AlertTriangle className="w-3 h-3" />Vence en ≤ 15 días</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.category} · {c.zone} · {c.owner}</div>
              <div className="text-xs mt-1"><span className="text-muted-foreground">Tasa: </span><b className="text-isa-navy">{formatARS(c.tax_amount)}</b> · vence {c.tax_due} {c.tax_paid && <span className="text-muno-teal font-bold">· Pagada</span>}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {!c.enabled && (
                  <button
                    onClick={() => { update({ ...c, enabled: true }); logActivity("Aprobar comercio", { entity: "business", entity_id: c.id, meta: { name: c.name } }); toast.success(`${c.name} habilitado y visible para turistas`); }}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-muno-teal text-white inline-flex items-center gap-1 min-h-[32px]"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Aprobar y habilitar
                  </button>
                )}
                {c.enabled && (
                  <button onClick={() => update({ ...c, enabled: false })} className="text-[11px] font-bold px-2.5 py-1 rounded-full border min-h-[32px]">
                    Inhabilitar
                  </button>
                )}
                <button onClick={() => update({ ...c, tax_paid: !c.tax_paid })} className="text-[11px] font-bold px-2.5 py-1 rounded-full border min-h-[32px]">
                  {c.tax_paid ? "Marcar impaga" : "Marcar pagada"}
                </button>
                <button onClick={() => setActive(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muno-blue text-white flex items-center gap-1 min-h-[32px]"><Mail className="w-3 h-3" /> Notificar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="isa-card p-5 max-w-sm w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-isa-navy">Notificar a {active.owner}</h3>
              <button onClick={() => { setActive(null); setMsg(""); }} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{active.email}</p>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Tu habilitación vence en 5 días…" className="w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none mb-3" />
            <button onClick={() => { toast.success("Notificación enviada"); setActive(null); setMsg(""); }} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
