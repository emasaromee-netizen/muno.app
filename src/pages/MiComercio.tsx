import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { reservations as initialReservations } from "@/data/mock";
import { CheckCircle2, Store, AlertTriangle, Calendar, Camera, X, Plus, MapPin, Compass, Users } from "lucide-react";
import { formatARS } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALL_TABS = ["Datos", "Habilitaciones", "Pagos", "Fotos", "Reservas"] as const;
const RESERVAS_CATEGORIES = ["Gastronomía", "Hospedaje"];

// Categorías y a qué perfil de la app llegan
const CATEGORIES = [
  { value: "Gastronomía", audience: "vecino+turista", hint: "Aparece en Guía Vecinal y Turismo" },
  { value: "Farmacia", audience: "vecino", hint: "Aparece solo en Guía Vecinal" },
  { value: "Comercio General", audience: "vecino", hint: "Aparece solo en Guía Vecinal" },
  { value: "Servicio Técnico", audience: "vecino", hint: "Aparece solo en Guía Vecinal" },
  { value: "Hospedaje", audience: "turista", hint: "Aparece SOLO en Turismo (perfil Turista)" },
] as const;
type Category = (typeof CATEGORIES)[number]["value"];

const businessSchema = z.object({
  name: z.string().trim().min(2, "Nombre demasiado corto").max(100, "Máx. 100 caracteres"),
  type: z.enum(["Gastronomía", "Farmacia", "Comercio General", "Servicio Técnico", "Hospedaje"], {
    errorMap: () => ({ message: "Elegí una categoría" }),
  }),
  address: z.string().trim().min(4, "Ingresá la dirección").max(200, "Máx. 200 caracteres"),
  schedule: z.string().trim().max(200, "Máx. 200 caracteres").optional(),
});

export default function MiComercio() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof ALL_TABS)[number]>("Datos");
  const [phone, setPhone] = useState("+54 266 555 1234");
  const [hours, setHours] = useState("Lun a Vie 9 a 13 / 17 a 21");
  const [name, setName] = useState("Cabañas del Cerro");
  const [desc, setDesc] = useState("Cabañas familiares en Potrero de los Funes con vista al lago.");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=800",
    "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800",
  ]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [reservations, setReservations] = useState(initialReservations);
  const [newRes, setNewRes] = useState({ guest: "", date: "", nights: 1 });

  // Cargar comercio existente del usuario
  useEffect(() => {
    if (!user) return;
    supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setBusinessId(data.id);
        setName(data.name || "");
        setAddress(data.address || "");
        setCategory((data.type as Category) || "");
        setHours(data.schedule || hours);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const audienceFor = (cat: Category | ""): { label: string; tone: string } | null => {
    const found = CATEGORIES.find((c) => c.value === cat);
    if (!found) return null;
    if (found.audience === "turista") return { label: "Solo Turismo", tone: "amber" };
    if (found.audience === "vecino+turista") return { label: "Guía Vecinal + Turismo", tone: "blue" };
    return { label: "Solo Guía Vecinal", tone: "teal" };
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const openMap = () => {
    const q = encodeURIComponent(address.trim() || name.trim());
    if (!q) return toast.error("Escribí primero la dirección o el nombre");
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer");
  };

  const save = async () => {
    const parsed = businessSchema.safeParse({
      name: name.trim(),
      type: category,
      address: address.trim(),
      schedule: hours.trim(),
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      toast.error(msg);
      return;
    }
    if (!user) {
      toast.error("Tenés que iniciar sesión");
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      address: parsed.data.address,
      schedule: parsed.data.schedule || null,
    };
    const res = businessId
      ? await supabase.from("businesses").update(payload).eq("id", businessId)
      : await supabase.from("businesses").insert(payload).select("id").single();
    setSaving(false);
    if ((res as any).error) {
      toast.error("No se pudo guardar");
      return;
    }
    if (!businessId && (res as any).data?.id) setBusinessId((res as any).data.id);
    setSaved(true);
    toast.success("Datos del comercio guardados");
    setTimeout(() => setSaved(false), 1800);
  };

  const dest = audienceFor(category);
  const showReservas = RESERVAS_CATEGORIES.includes(category as string);
  const TABS = ALL_TABS.filter((t) => t !== "Reservas" || showReservas);

  useEffect(() => {
    if (tab === "Reservas" && !showReservas) setTab("Datos");
  }, [tab, showReservas]);

  return (
    <div className="space-y-5">
      <div className="isa-card p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muno-blue/10 text-muno-blue grid place-items-center"><Store strokeWidth={1.5} /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-isa-navy">{name || "Mi Comercio"}</h3>
            <span className="isa-chip bg-muno-teal/15 text-muno-teal"><CheckCircle2 className="w-3 h-3" />Habilitación vigente</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">La categoría define en qué perfiles de la app aparece tu negocio.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-[20px] text-xs font-bold whitespace-nowrap ${tab === t ? "bg-isa-navy text-isa-white" : "bg-card border"}`}>{t}</button>
        ))}
      </div>

      {tab === "Datos" && (
        <div className="isa-card p-5 space-y-4">
          <Field label="Nombre del local" value={name} onChange={setName} maxLength={100} />

          <div>
            <label className="text-xs font-bold text-muted-foreground">Categoría</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`text-left rounded-[14px] px-3 py-2.5 border-2 transition-all ${
                      active ? "border-isa-navy bg-isa-navy text-isa-white" : "border-transparent bg-card hover:border-isa-navy/20"
                    }`}
                  >
                    <div className="text-sm font-extrabold">{c.value}</div>
                    <div className={`text-[11px] mt-0.5 ${active ? "text-white/80" : "text-muted-foreground"}`}>{c.hint}</div>
                  </button>
                );
              })}
            </div>
            {dest && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  dest.tone === "amber"
                    ? "bg-muno-amber/15 text-[hsl(var(--muno-amber))]"
                    : dest.tone === "blue"
                    ? "bg-muno-blue/15 text-muno-blue"
                    : "bg-muno-teal/15 text-muno-teal"
                }`}
              >
                {dest.tone === "amber" ? <Compass className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                Visible en: {dest.label}
              </div>
            )}
          </div>

          <Field label="Descripción" value={desc} onChange={setDesc} textarea maxLength={500} />

          <div>
            <label className="text-xs font-bold text-muted-foreground">Dirección</label>
            <div className="mt-1 flex gap-2">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={200}
                placeholder="Ej: San Martín 245, San Francisco del Monte de Oro"
                className="flex-1 px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy"
              />
              <button
                type="button"
                onClick={openMap}
                className="shrink-0 inline-flex items-center gap-1.5 bg-isa-navy text-isa-white rounded-xl px-3 py-2 text-xs font-bold"
              >
                <MapPin className="w-4 h-4" /> Marcar en mapa
              </button>
            </div>
          </div>

          <Field label="Teléfono" value={phone} onChange={setPhone} />
          <Field label="Horario de atención" value={hours} onChange={setHours} />

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold disabled:opacity-60"
          >
            {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>
      )}

      {tab === "Habilitaciones" && (
        <div className="space-y-3">
          <Habilitacion title="Habilitación Comercial" status="Vigente" until="2026-12-31" />
          <Habilitacion title="Bromatología" status="Vigente" until="2026-09-15" />
          <Habilitacion title="Bomberos" status="Por vencer" until="2026-05-30" warn />
        </div>
      )}

      {tab === "Pagos" && (
        <div className="space-y-3">
          <Pago concept="Tasa Comercio · Mayo" due="2026-05-15" amount={12500} warn />
          <Pago concept="Bromatología · Trimestral" due="2026-06-01" amount={8200} />
          <div className="isa-card p-4 flex items-center gap-3 bg-muno-amber/10">
            <AlertTriangle className="w-5 h-5 text-[hsl(var(--muno-amber))]" />
            <p className="text-xs text-isa-navy"><b>1 pago a vencer</b> en los próximos 10 días.</p>
          </div>
        </div>
      )}

      {tab === "Fotos" && (
        <div className="isa-card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={p} className="w-full h-full object-cover" />
                <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-full bg-black/60 text-white"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed grid place-items-center text-muted-foreground">
              <div className="text-center"><Camera className="w-6 h-6 mx-auto" /><div className="text-xs mt-1">Subir</div></div>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden multiple onChange={onUpload} />
        </div>
      )}

      {tab === "Reservas" && (
        <div className="space-y-3">
          <div className="isa-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-isa-navy"><Calendar className="w-4 h-4" /><div className="font-bold text-sm">Nueva reserva</div></div>
            <input placeholder="Huésped" value={newRes.guest} onChange={(e) => setNewRes({ ...newRes, guest: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={newRes.date} onChange={(e) => setNewRes({ ...newRes, date: e.target.value })} className="px-3 py-2 rounded-lg border bg-background text-sm" />
              <input type="number" min={1} placeholder="Noches" value={newRes.nights} onChange={(e) => setNewRes({ ...newRes, nights: +e.target.value })} className="px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <button
              disabled={!newRes.guest || !newRes.date}
              onClick={() => { setReservations([{ id: String(Date.now()), guest: newRes.guest, date: newRes.date, nights: newRes.nights, status: "Confirmada" }, ...reservations]); setNewRes({ guest: "", date: "", nights: 1 }); }}
              className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Agregar reserva
            </button>
          </div>
          {reservations.map((r) => (
            <div key={r.id} className="isa-card p-4 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-isa-navy text-sm">{r.guest}</div>
                <div className="text-xs text-muted-foreground">{r.date} · {r.nights} noches</div>
              </div>
              <span className={`isa-chip ${r.status === "Confirmada" ? "bg-muno-teal/15 text-muno-teal" : "bg-muno-amber/15 text-[hsl(var(--muno-amber))]"}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, textarea, maxLength }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={3} className="mt-1 w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} className="mt-1 w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
      )}
    </div>
  );
}

function Habilitacion({ title, status, until, warn }: any) {
  return (
    <div className="isa-card p-4 flex items-center justify-between">
      <div>
        <div className="font-extrabold text-isa-navy text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">Vence: {until}</div>
      </div>
      <span className={`isa-chip ${warn ? "bg-muno-amber/15 text-[hsl(var(--muno-amber))]" : "bg-muno-teal/15 text-muno-teal"}`}>{status}</span>
    </div>
  );
}

function Pago({ concept, due, amount, warn }: any) {
  return (
    <div className={`isa-card p-4 flex items-center justify-between ${warn ? "border-l-4 border-[hsl(var(--muno-amber))]" : ""}`}>
      <div>
        <div className="font-extrabold text-isa-navy text-sm">{concept}</div>
        <div className="text-xs text-muted-foreground">Vence: {due}</div>
      </div>
      <div className="text-right">
        <div className="font-extrabold text-isa-navy">{formatARS(amount)}</div>
        <button className="text-xs font-bold text-muno-blue">Pagar</button>
      </div>
    </div>
  );
}
