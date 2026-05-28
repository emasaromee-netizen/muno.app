import { useEffect, useRef, useState } from "react";
import { Camera, X, CheckCircle2, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { AREAS, type Area } from "@/data/mock";
import { toast } from "sonner";
import { formatARS } from "@/lib/format";

const KINDS = ["Actividad", "Evento", "Taller", "Lugar"] as const;
type Kind = (typeof KINDS)[number];

type Item = {
  id: string;
  area: string;
  kind: string;
  title: string;
  description: string | null;
  price: number | null;
  days: string | null;
  schedule: string | null;
  photo_url: string | null;
  published: boolean;
  created_at: string;
};

const EMPTY = { title: "", price: "", days: "", schedule: "", desc: "" };

export default function AdminContenido() {
  const { user, roles } = useAuth();
  const { adminArea } = useRole();
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("area_manager");

  const [kind, setKind] = useState<Kind>("Evento");
  const [area, setArea] = useState<Area>(((adminArea as Area) && AREAS.includes(adminArea as Area)) ? (adminArea as Area) : "Cultura");
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posY, setPosY] = useState<number>(50);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMunId, setMyMunId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("municipality_id").eq("id", user.id).maybeSingle()
      .then(({ data }: any) => setMyMunId(data?.municipality_id ?? null));
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("content_items").select("*").order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("area", area);
    if (myMunId) q = q.eq("municipality_id", myMunId);
    const { data } = await q;
    setItems((data as Item[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [area, isAdmin, myMunId]);


  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      setPhoto(URL.createObjectURL(f));
      setPosY(50);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setPhoto(null);
    setPhotoFile(null);
    setPosY(50);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Recorta la imagen a 1200x600 (2:1) usando posY (0-100) como encuadre vertical
  const cropTo2x1 = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const TW = 1200, TH = 600;
        const targetRatio = TW / TH;
        const srcRatio = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > targetRatio) {
          // recortar lados
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // recortar arriba/abajo según posY
          sh = img.width / targetRatio;
          const maxOffset = img.height - sh;
          sy = Math.max(0, Math.min(maxOffset, (posY / 100) * maxOffset));
        }
        const canvas = document.createElement("canvas");
        canvas.width = TW;
        canvas.height = TH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Error al generar imagen"))), "image/jpeg", 0.88);
      };
      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      img.src = URL.createObjectURL(file);
    });

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return photo; // si es URL existente
    let blob: Blob = photoFile;
    try {
      blob = await cropTo2x1(photoFile);
    } catch {
      blob = photoFile;
    }
    const path = `${user.id}/content-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("Falta el título");
      return;
    }
    setBusy(true);
    const photo_url = await uploadPhoto();
    // Vincular al municipio del jefe logueado
    let municipality_id: string | null = null;
    if (user?.id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("municipality_id")
        .eq("id", user.id)
        .maybeSingle();
      municipality_id = prof?.municipality_id ?? null;
    }
    const payload: any = {
      area,
      kind,
      title: form.title.trim(),
      description: form.desc.trim() || null,
      price: form.price ? Number(String(form.price).replace(/[^\d.-]/g, "")) || null : null,
      days: form.days.trim() || null,
      schedule: form.schedule.trim() || null,
      photo_url,
      created_by: user?.id,
      ...(municipality_id ? { municipality_id } : {}),
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("content_items").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("content_items").insert(payload));
    }
    setBusy(false);
    if (error) {
      toast.error(editingId ? "No se pudo actualizar" : "No se pudo publicar", { description: error.message });
      return;
    }
    toast.success(editingId ? "Cambios guardados" : "Publicado correctamente");
    reset();
    load();
  };

  const startEdit = (it: Item) => {
    setEditingId(it.id);
    setKind(it.kind as Kind);
    setForm({
      title: it.title,
      price: it.price?.toString() || "",
      days: it.days || "",
      schedule: it.schedule || "",
      desc: it.description || "",
    });
    setPhoto(it.photo_url);
    setPhotoFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Eliminado");
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-5">
      {isAdmin && (
        <div className="isa-card p-3 flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Área</span>
          <select value={area} onChange={(e) => setArea(e.target.value as Area)} className="px-3 py-2 rounded-xl border bg-background text-sm font-bold">
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((t) => (
          <button key={t} onClick={() => setKind(t)} className={`px-3 py-1.5 rounded-[20px] text-xs font-bold ${kind === t ? "bg-isa-navy text-isa-white" : "bg-card border"}`}>{t}</button>
        ))}
      </div>

      <div className="isa-card p-5 space-y-3">
        <h3>{editingId ? `Editar ${kind.toLowerCase()}` : `Nuevo ${kind.toLowerCase()}`} · {area}</h3>

        {photo ? (
          <div className="space-y-2">
            <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "2 / 1" }}>
              <img
                src={photo}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `center ${posY}%` }}
                alt="preview"
              />
              <button onClick={() => { setPhoto(null); setPhotoFile(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"><X className="w-4 h-4" /></button>
            </div>
            {photoFile && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Reencuadrar (vertical)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={posY}
                  onChange={(e) => setPosY(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Tamaño recomendado: 1200x600px (2:1)</p>
          </div>
        ) : (
          <div className="space-y-1">
            <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed grid place-items-center text-muted-foreground" style={{ aspectRatio: "2 / 1" }}>
              <div className="text-center"><Camera className="w-6 h-6 mx-auto" /><div className="text-xs mt-1">Subir foto del evento</div></div>
            </button>
            <p className="text-[11px] text-muted-foreground">Tamaño recomendado: 1200x600px (2:1)</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />

        <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
        <textarea placeholder="Descripción" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Precio (ej 5000)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="px-3 py-2.5 rounded-xl border bg-background text-sm" />
          <input placeholder="Días" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className="px-3 py-2.5 rounded-xl border bg-background text-sm" />
        </div>
        <input placeholder="Horario" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />

        <div className="flex gap-2">
          <button onClick={submit} disabled={!form.title || busy} className="flex-1 bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {editingId ? "Guardar cambios" : "Publicar"}
          </button>
          {editingId && (
            <button onClick={reset} className="px-4 rounded-[20px] border-2 border-isa-navy text-isa-navy font-bold text-sm">Cancelar</button>
          )}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2>Lo publicado {!isAdmin && `· ${area}`}</h2>
          <span className="text-xs text-muted-foreground">{items.length} ítem(s)</span>
        </div>
        {loading ? (
          <div className="isa-card p-6 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="isa-card p-6 text-center text-sm text-muted-foreground">Aún no hay contenido publicado.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="isa-card p-3 flex items-center gap-3">
                {it.photo_url ? (
                  <img src={it.photo_url} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-isa-navy text-sm truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {it.kind} · {it.area}{it.price ? ` · ${formatARS(it.price)}` : ""}{it.schedule ? ` · ${it.schedule}` : ""}
                  </div>
                </div>
                <button onClick={() => startEdit(it)} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-isa-light text-isa-navy"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(it.id)} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muno-red/10 text-muno-red"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
