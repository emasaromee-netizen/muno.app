import { useEffect, useState, useRef } from "react";
import { Camera, X, CheckCircle2, Clock, AlertCircle, MapPin, Users, MessageSquare, Plus, Trash2, Pencil, Save, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/audit";

import { CLAIM_AREAS } from "@/data/mock";

const CUADRILLAS = ["Cuadrilla A · Alumbrado", "Cuadrilla B · Bacheo", "Cuadrilla C · Limpieza", "Cuadrilla D · Espacios verdes"];

type ClaimStatus = "Pendiente" | "En curso" | "Cerrado";
const STATUS_LIST: ClaimStatus[] = ["Pendiente", "En curso", "Cerrado"];
const STATUS_LABEL: Record<string, string> = {
  "Pendiente": "Pendiente de revisión",
  "En curso": "En curso",
  "Cerrado": "Resuelto",
};
const STATUS_STYLE: Record<string, string> = {
  "Pendiente": "bg-muno-amber/15 text-[hsl(var(--muno-amber))]",
  "En curso": "bg-muno-blue/15 text-muno-blue",
  "Cerrado": "bg-muno-teal/15 text-muno-teal",
};
// Selectores de color del modal: Rojo / Amarillo / Verde
const STATUS_DOT: Record<string, string> = {
  "Pendiente": "bg-red-500",
  "En curso": "bg-amber-400",
  "Cerrado": "bg-emerald-500",
};
const STATUS_BTN: Record<string, string> = {
  "Pendiente": "border-red-500 bg-red-500/10 text-red-700",
  "En curso": "border-amber-500 bg-amber-400/15 text-amber-800",
  "Cerrado": "border-emerald-500 bg-emerald-500/10 text-emerald-700",
};

type Claim = {
  id: string;
  user_id: string;
  category: string;
  area: string | null;
  status: ClaimStatus;
  address: string | null;
  description: string | null;
  evidence_photos: string[] | null;
  resolution_note: string | null;
  resolution_photos: string[] | null;
  resolved_at: string | null;
  created_at: string;
};

type Canned = { id: string; label: string; body: string; enabled: boolean };

export default function AdminReclamos() {
  const [items, setItems] = useState<Claim[]>([]);
  const [active, setActive] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTpl, setShowTpl] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const reload = () => {
    setLoading(true);
    supabase
      .from("claims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setItems((data as Claim[]) || []);
        setLoading(false);
      });
  };

  useEffect(reload, []);

  const update = (c: Claim) => setItems((p) => p.map((x) => x.id === c.id ? c : x));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-isa-navy text-[20px] font-extrabold">Bandeja de Reclamos</h2>
        <button
          onClick={() => setShowTpl(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-isa-navy text-white rounded-[14px] px-3 py-2 min-h-[40px]"
        >
          <FileText className="w-3.5 h-3.5" /> Respuestas predeterminadas
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">Área:</span>
        <button onClick={() => setAreaFilter("")} className={`px-3 py-1 rounded-full text-xs font-bold border ${!areaFilter ? "bg-isa-navy text-white border-isa-navy" : "bg-card"}`}>Todas</button>
        {CLAIM_AREAS.map((a) => (
          <button key={a} onClick={() => setAreaFilter(a)} className={`px-3 py-1 rounded-full text-xs font-bold border ${areaFilter === a ? "bg-isa-navy text-white border-isa-navy" : "bg-card"}`}>{a}</button>
        ))}
        <span className="mx-2 h-4 w-px bg-border" />
        <span className="text-xs font-bold text-muted-foreground">Estado:</span>
        {["", ...STATUS_LIST].map((s) => (
          <button key={s || "all"} onClick={() => setStatusFilter(s)} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusFilter === s ? "bg-isa-navy text-white border-isa-navy" : "bg-card"}`}>
            {s && <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />}
            {s || "Todos"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-sm text-muted-foreground py-10 inline-flex items-center gap-2 justify-center w-full">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
        </div>
      )}

      {(() => {
        const filtered = items.filter((r) => (!areaFilter || r.area === areaFilter) && (!statusFilter || r.status === statusFilter));
        if (!loading && filtered.length === 0) {
          return (
            <div className="isa-card p-6 text-center text-sm text-muted-foreground">
              No hay reclamos {areaFilter ? `en ${areaFilter}` : ""} {statusFilter ? `· ${statusFilter}` : ""}.
            </div>
          );
        }
        return (
          <>
            {/* Vista Escritorio */}
            <div className="isa-card overflow-hidden hidden lg:block">
              <table className="w-full text-sm">
                <thead className="bg-muted text-isa-navy">
                  <tr>
                    <th className="text-left p-3">Ticket</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Área</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const short = r.id.slice(0, 4).toUpperCase();
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-bold">
                          <Link to={`/reclamos/${encodeURIComponent(r.id)}`} className="hover:underline">#MUNO-{short}</Link>
                        </td>
                        <td className="p-3">{r.category}</td>
                        <td className="p-3 text-xs"><span className="px-2 py-1 rounded-full bg-muted">{r.area || "—"}</span></td>
                        <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-AR")}</td>
                        <td className="p-3">
                          <span className={`isa-chip inline-flex items-center gap-1 ${STATUS_STYLE[r.status]}`}>
                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status]}`} />
                            {STATUS_LABEL[r.status] || r.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => setActive(r)} className="text-xs font-bold text-muno-blue hover:underline">Gestionar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {/* Vista Móvil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
        {items.map((r) => {
          const Icon = r.status === "Cerrado" ? CheckCircle2 : r.status === "En curso" ? Clock : AlertCircle;
          const short = r.id.slice(0, 4).toUpperCase();
          return (
            <article key={r.id} className="isa-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/reclamos/${encodeURIComponent(r.id)}`} className="font-extrabold text-isa-navy text-sm hover:underline">#MUNO-{short}</Link>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.category} · {new Date(r.created_at).toLocaleDateString("es-AR")}</div>
                </div>
                <span className={`isa-chip ${STATUS_STYLE[r.status]} inline-flex items-center gap-1 shrink-0`}>
                  <Icon className="w-3 h-3" /> {STATUS_LABEL[r.status] || r.status}
                </span>
              </div>
              {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
              <button
                onClick={() => setActive(r)}
                className="w-full mt-1 bg-isa-navy text-isa-white rounded-[20px] py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Gestionar
              </button>
            </article>
          );
        })}
      </div>

      {active && <ManageDialog claim={active} onClose={() => setActive(null)} onSaved={(c) => { update(c); setActive(null); }} />}
      {showTpl && <TemplatesDialog onClose={() => setShowTpl(false)} />}
    </div>
  );
}

function ManageDialog({ claim, onClose, onSaved }: { claim: Claim; onClose: () => void; onSaved: (c: Claim) => void }) {
  const [status, setStatus] = useState<ClaimStatus>(claim.status);
  const [response, setResponse] = useState(claim.resolution_note || "");
  const [photo, setPhoto] = useState<string | null>(claim.resolution_photos?.[0] || null);
  const [crew, setCrew] = useState<string>("");
  const [canned, setCanned] = useState<Canned[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mapHref = `https://maps.google.com/?q=${encodeURIComponent(claim.address || "San Francisco del Monte de Oro")}`;
  const short = claim.id.slice(0, 4).toUpperCase();
  const photos = claim.evidence_photos || [];

  useEffect(() => {
    supabase.from("claim_canned_responses").select("id,label,body,enabled").eq("enabled", true)
      .then(({ data }) => setCanned((data as Canned[]) || []));
  }, []);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(URL.createObjectURL(f));
  };

  const save = async () => {
    if (status === "Cerrado" && !response.trim()) {
      toast.error("Para cerrar el reclamo, escribí una respuesta.");
      return;
    }
    setSaving(true);
    const update: any = { status };
    if (status === "Cerrado") {
      update.resolution_note = response.trim();
      if (photo) update.resolution_photos = [photo];
      update.resolved_at = new Date().toISOString();
    } else if (response.trim()) {
      update.resolution_note = response.trim();
    }
    const { data, error } = await supabase.from("claims").update(update).eq("id", claim.id).select("*").single();
    if (error || !data) {
      setSaving(false);
      toast.error("No se pudo guardar", { description: error?.message });
      return;
    }
    // Disparar notificación al vecino creador del reclamo
    if (response.trim() || status !== claim.status) {
      const areaLabel = claim.area || "tu área";
      const body =
        status === "Cerrado"
          ? `Tu reclamo en ${areaLabel} fue resuelto.`
          : status === "En curso"
          ? `Tu reclamo en ${areaLabel} está en curso.`
          : `Tu reclamo en ${areaLabel} ha sido respondido.`;
      await supabase.from("notifications").insert({
        title: `Reclamo #MUNO-${claim.id.slice(0, 4).toUpperCase()}`,
        body,
        link: `/reclamos/${claim.id}`,
        audience: "residents",
        source_type: "claim",
        source_id: claim.id,
        user_id: claim.user_id,
      } as any);
    }
    setSaving(false);
    toast.success("Reclamo actualizado · Vecino notificado");
    logActivity(
      status === "Cerrado" ? "Cerrar reclamo" : `Actualizar reclamo · ${status}`,
      { entity: "claim", entity_id: claim.id, meta: { crew, status, area: claim.area } }
    );
    onSaved(data as Claim);
  };

  // status icon handled via colored dot in selector

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="isa-card p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Ticket</div>
            <h3 className="font-extrabold text-isa-navy">#MUNO-{short}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {photos[0] && <img src={photos[0]} className="w-full h-32 object-cover rounded-xl mb-3" />}
        {claim.description && <p className="text-sm text-muted-foreground mb-3">{claim.description}</p>}

        {claim.address && (
          <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muno-blue mb-4">
            <MapPin className="w-3.5 h-3.5" /> {claim.address}
          </a>
        )}

        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Cuadrilla</label>
        <select value={crew} onChange={(e) => setCrew(e.target.value)} className="mt-1 mb-4 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]">
          <option value="">Sin asignar</option>
          {CUADRILLAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {claim.area && (
          <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full bg-muted text-isa-navy">
            Área asignada: {claim.area}
          </div>
        )}

        <label className="text-xs font-bold text-muted-foreground">Estado del ticket</label>
        <div className="flex gap-2 mt-1 mb-4">
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 px-3 py-2 rounded-[20px] text-xs font-bold min-h-[44px] inline-flex items-center justify-center gap-1.5 border-2 transition-all ${
                status === s ? STATUS_BTN[s] : "bg-card border-border text-muted-foreground"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Respuesta predeterminada</label>
        <select
          onChange={(e) => {
            const c = canned.find((x) => x.id === e.target.value);
            if (c) setResponse(c.body);
          }}
          defaultValue=""
          className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]"
        >
          <option value="">— Elegí una plantilla —</option>
          {canned.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        <label className="text-xs font-bold text-muted-foreground">Respuesta Oficial del Área</label>
        <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} placeholder="Escribí o seleccioná una respuesta predefinida…" className="mt-1 w-full px-3 py-2 rounded-xl border bg-background text-sm mb-3 resize-none" />

        {status === "Cerrado" && (
          <>
            <label className="text-xs font-bold text-muted-foreground">Foto del trabajo realizado (opcional)</label>
            <div className="mt-1 mb-3">
              {photo ? (
                <div className="relative">
                  <img src={photo} className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed grid place-items-center text-muted-foreground">
                  <div className="text-center"><Camera className="w-6 h-6 mx-auto" /><div className="text-xs mt-1">Subir foto</div></div>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
            </div>
          </>
        )}

        <button onClick={save} disabled={saving} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar cambios
        </button>
      </div>
    </div>
  );
}

function TemplatesDialog({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Canned[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Canned | null>(null);
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from("claim_canned_responses").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as Canned[]) || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const startNew = () => {
    setEditing({ id: "", label: "", body: "", enabled: true });
    setLabel("");
    setBody("");
  };
  const startEdit = (c: Canned) => {
    setEditing(c);
    setLabel(c.label);
    setBody(c.body);
  };

  const save = async () => {
    if (!label.trim() || !body.trim()) {
      toast.error("Completá título y contenido");
      return;
    }
    setBusy(true);
    const payload = { label: label.trim(), body: body.trim(), enabled: true };
    const res = editing && editing.id
      ? await supabase.from("claim_canned_responses").update(payload).eq("id", editing.id)
      : await supabase.from("claim_canned_responses").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error("No se pudo guardar", { description: res.error.message });
      return;
    }
    toast.success("Plantilla guardada");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    const { error } = await supabase.from("claim_canned_responses").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="isa-card p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-isa-navy inline-flex items-center gap-2">
            <FileText className="w-4 h-4" /> Respuestas predeterminadas
          </h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Título corto · Ej: Bache reparado"
              className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Texto de la respuesta…"
              className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 px-3 py-2.5 rounded-[14px] border font-bold text-sm">Cancelar</button>
              <button onClick={save} disabled={busy} className="flex-1 px-3 py-2.5 rounded-[14px] bg-isa-navy text-white font-bold text-sm inline-flex items-center justify-center gap-1 disabled:opacity-60">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={startNew} className="w-full mb-3 inline-flex items-center justify-center gap-1.5 bg-isa-navy text-white rounded-[14px] py-2.5 text-sm font-bold">
              <Plus className="w-4 h-4" /> Nueva plantilla
            </button>
            {loading && <div className="text-sm text-muted-foreground text-center py-4">Cargando…</div>}
            {!loading && items.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">
                Aún no hay plantillas. Creá la primera para responder más rápido.
              </div>
            )}
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id} className="border rounded-xl p-3 bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-isa-navy text-sm">{c.label}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.body}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(c)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted text-isa-navy">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(c.id)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muno-red/10 text-muno-red">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
