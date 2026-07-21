import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Mail, Send, X, Loader2 } from "lucide-react";
import { formatARS } from "@/lib/format";
import { toast } from "sonner";
import { logActivity } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const DAY = 86400000;
const isOverdue = (due: string | null) => due ? new Date(due).getTime() < Date.now() : true;
const dueSoon = (due: string | null) => {
  if (!due) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff >= 0 && diff <= 15 * DAY;
};

// Interface tipada para la BD real
interface RealCommerce {
  id: string;
  name: string;
  type: string;
  zone: string;
  photo_url: string;
  enabled: boolean;
  tax_amount: number;
  tax_expires_at: string | null;
  owner_name: string;
  owner_email: string;
  // Campos calculados para la UI
  tax_paid: boolean;
  tax_due: string;
}

// 🔴 FIX TS: Interfaz para la respuesta cruda de Supabase
interface DBBusinessResponse {
  id: string;
  name: string | null;
  type: string | null;
  zone: string | null;
  photo_url: string | null;
  enabled: boolean;
  tax_amount: number | null;
  tax_expires_at: string | null;
  owner: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminComercios() {
  const { user } = useAuth();
  const [items, setItems] = useState<RealCommerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<RealCommerce | null>(null);
  const [msg, setMsg] = useState("");

  // 1. CARGA REAL DESDE SUPABASE
  useEffect(() => {
    let isMounted = true;
    
    const loadBusinesses = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("municipality_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.municipality_id) {
        if (isMounted) setLoading(false);
        return;
      }

      // Hacemos un JOIN con profiles para traer el nombre y email del dueño
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          *,
          owner:profiles!businesses_owner_id_fkey(full_name, email)
        `)
        .eq("municipality_id", profile.municipality_id)
        .order("created_at", { ascending: false });

      if (!error && isMounted) {
        // 🔴 FIX TS: Casteamos la respuesta cruda a nuestra interfaz estricta
        const rawData = (data || []) as unknown as DBBusinessResponse[];
        
        // Formateamos la respuesta de la BD para que encaje con la UI existente
        const formatted = rawData.map((b) => ({
          id: b.id,
          name: b.name || "Sin nombre",
          type: b.type || "Comercio",
          zone: b.zone || "Zona no definida",
          photo_url: b.photo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
          enabled: b.enabled,
          tax_amount: b.tax_amount || 0,
          tax_expires_at: b.tax_expires_at,
          owner_name: b.owner?.full_name || "Sin asignar",
          owner_email: b.owner?.email || "Sin email",
          // Lógica de pagos
          tax_paid: b.tax_expires_at ? new Date(b.tax_expires_at).getTime() > Date.now() : false,
          tax_due: b.tax_expires_at ? new Date(b.tax_expires_at).toLocaleDateString("es-AR") : "Sin registro",
        }));
        setItems(formatted);
      }
      
      if (isMounted) setLoading(false);
    };

    loadBusinesses();
    return () => { isMounted = false; };
  }, [user]);

  // 2. ENRIQUECIMIENTO DE ESTADOS
  const enriched = useMemo(() => items.map((c) => {
    const overdue = !c.tax_paid && isOverdue(c.tax_expires_at);
    const soon = !c.tax_paid && !overdue && dueSoon(c.tax_expires_at);
    return { ...c, visible: c.enabled && !overdue, overdue, soon };
  }), [items]);

  // 3. MUTACIONES REALES A BASE DE DATOS
  const toggleEnabled = async (c: RealCommerce) => {
    const newStatus = !c.enabled;
    const { error } = await supabase.from("businesses").update({ enabled: newStatus }).eq("id", c.id);
    
    if (error) {
      toast.error("Error al actualizar conexión con base de datos.");
      return;
    }

    setItems((p) => p.map((x) => x.id === c.id ? { ...x, enabled: newStatus } : x));
    
    if (newStatus) {
      logActivity("Aprobar comercio", { entity: "business", entity_id: c.id, meta: { name: c.name } });
      toast.success(`${c.name} habilitado y visible.`);
    } else {
      logActivity("Inhabilitar comercio", { entity: "business", entity_id: c.id, meta: { name: c.name } });
      toast.success(`${c.name} inhabilitado.`);
    }
  };

  const toggleTax = async (c: RealCommerce) => {
    // Si estaba pagado, lo vencemos (ayer). Si estaba impago, le damos 30 días.
    const newDate = c.tax_paid 
      ? new Date(Date.now() - DAY).toISOString() 
      : new Date(Date.now() + 30 * DAY).toISOString();

    const { error } = await supabase.from("businesses").update({ tax_expires_at: newDate }).eq("id", c.id);
    
    if (error) {
      toast.error("Error al registrar el pago.");
      return;
    }

    setItems((p) => p.map((x) => x.id === c.id ? { 
      ...x, 
      tax_paid: !c.tax_paid, 
      tax_expires_at: newDate,
      tax_due: new Date(newDate).toLocaleDateString("es-AR") 
    } : x));
    
    toast.success(c.tax_paid ? "Marcado como impago" : "Pago registrado exitosamente");
  };

  const totalRecaudado = items.filter((c) => c.tax_paid).reduce((a, b) => a + b.tax_amount, 0);
  const totalPendiente = items.filter((c) => !c.tax_paid).reduce((a, b) => a + b.tax_amount, 0);

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-isa-navy" /></div>;
  }

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
        {enriched.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
            No hay comercios registrados en este municipio.
          </div>
        )}
        {enriched.map((c) => (
          <div
            key={c.id}
            className="isa-card p-4 flex items-start gap-3 border-l-4"
            style={{
              borderLeftColor: c.overdue ? "#EF4444" : c.soon ? "#F59E0B" : "transparent",
              background: c.overdue ? "#FEF2F2" : c.soon ? "#FFFBEB" : undefined,
            }}
          >
            <img src={c.photo_url} className="w-14 h-14 rounded-xl object-cover" alt={c.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-extrabold text-isa-navy text-sm truncate">{c.name}</div>
                {c.enabled
                  ? <span className="isa-chip bg-muno-teal/15 text-muno-teal"><CheckCircle2 className="w-3 h-3" />Habilitado</span>
                  : <span className="isa-chip bg-muted text-muted-foreground">Pendiente de validación</span>}
                {c.overdue && <span className="isa-chip bg-muno-red/15 text-muno-red"><AlertTriangle className="w-3 h-3" />Tasa vencida · oculto</span>}
                {c.soon && <span className="isa-chip" style={{ background: "#FEF3C7", color: "#92400E" }}><AlertTriangle className="w-3 h-3" />Vence en ≤ 15 días</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.type} · {c.zone} · {c.owner_name}</div>
              <div className="text-xs mt-1">
                <span className="text-muted-foreground">Tasa: </span><b className="text-isa-navy">{formatARS(c.tax_amount)}</b> · vence {c.tax_due} 
                {c.tax_paid && <span className="text-muno-teal font-bold ml-1">· Pagada</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {!c.enabled && (
                  <button
                    onClick={() => toggleEnabled(c)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-muno-teal text-white inline-flex items-center gap-1 min-h-[32px]"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Aprobar y habilitar
                  </button>
                )}
                {c.enabled && (
                  <button onClick={() => toggleEnabled(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-full border min-h-[32px]">
                    Inhabilitar
                  </button>
                )}
                <button onClick={() => toggleTax(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-full border min-h-[32px]">
                  {c.tax_paid ? "Marcar impaga" : "Marcar pagada"}
                </button>
                <button onClick={() => setActive(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muno-blue text-white flex items-center gap-1 min-h-[32px]">
                  <Mail className="w-3 h-3" /> Notificar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="isa-card p-5 max-w-sm w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-isa-navy">Notificar a {active.owner_name}</h3>
              <button onClick={() => { setActive(null); setMsg(""); }} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{active.owner_email}</p>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Tu habilitación vence en 5 días…" className="w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none mb-3" />
            <button onClick={() => { toast.success("Notificación enviada"); setActive(null); setMsg(""); }} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}