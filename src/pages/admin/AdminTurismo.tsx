import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, X, Camera, Loader2, MapPin } from "lucide-react";

type Category = "commerce" | "gastronomy" | "lodging" | "nature" | "event";
type TItem = {
  id: string;
  category: Category;
  title: string;
  description: string | null;
  photo_url: string | null;
  location: string | null;
  featured: boolean;
  published: boolean;
  business_id: string | null;
};

const TABS: { id: Category; label: string }[] = [
  { id: "commerce", label: "Comercios" },
  { id: "gastronomy", label: "Gastronomía" },
  { id: "lodging", label: "Hospedaje" },
  { id: "nature", label: "Atractivos Naturales" },
  { id: "event", label: "Eventos" },
];

export default function AdminTurismo() {
  const { user, roles } = useAuth();
  const canEdit = roles.includes("admin") || roles.includes("tourism_chief");
  const [tab, setTab] = useState<Category>("commerce");
  const [items, setItems] = useState<TItem[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myMunId, setMyMunId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("municipality_id").eq("id", user.id).maybeSingle()
      .then(({ data }: any) => setMyMunId(data?.municipality_id ?? null));
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("tourism_items" as any)
      .select("*")
      .eq("category", tab)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (myMunId) q = q.eq("municipality_id", myMunId);
    const { data } = await q;
    setItems((data as any) || []);
    if (tab === "commerce") {
      let bq = supabase
        .from("businesses")
        .select("id,name,zone,photo_url,address,enabled,tax_expires_at,municipality_id")
        .eq("enabled", true);
      if (myMunId) bq = bq.eq("municipality_id", myMunId);
      const { data: biz } = await bq;
      setBusinesses(biz || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tourism_items_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "tourism_items" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, myMunId]);


  const remove = async (it: TItem) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    const { error } = await supabase.from("tourism_items" as any).delete().eq("id", it.id);
    if (error) toast.error("No se pudo eliminar");
    else toast.success("Eliminado");
  };

  const toggleFeatured = async (it: TItem) => {
    const { error } = await supabase
      .from("tourism_items" as any)
      .update({ featured: !it.featured })
      .eq("id", it.id);
    if (error) toast.error("No se pudo actualizar");
    else toast.success(it.featured ? "Quitado de destacados" : "Marcado como destacado");
  };

  const featureBusiness = async (b: any) => {
    const exists = items.find((i) => i.business_id === b.id);
    if (exists) {
      await toggleFeatured(exists);
      return;
    }
    const { error } = await supabase.from("tourism_items" as any).insert({
      category: "commerce",
      title: b.name,
      description: b.address || "",
      photo_url: b.photo_url,
      location: b.zone || b.address || null,
      business_id: b.id,
      featured: true,
      published: true,
      created_by: user?.id,
    });
    if (error) toast.error("No se pudo destacar: " + error.message);
    else toast.success(`${b.name} destacado en la guía`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-extrabold text-isa-navy text-lg">Panel de Turismo</h2>
          <p className="text-xs text-muted-foreground">
            {canEdit ? "Cargá y destacá comercios, gastronomía, hospedaje, atractivos y eventos." : "Vista de supervisión (solo lectura)."}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold"
          >
            <Plus className="w-4 h-4" /> Nuevo ítem
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-[12px] text-[12px] font-bold whitespace-nowrap ${
              tab === t.id ? "bg-isa-navy text-white" : "bg-white border text-isa-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "commerce" && canEdit && (
        <div className="bg-white border rounded-[16px] p-4">
          <div className="font-bold text-isa-navy mb-2 text-sm">Comercios habilitados por Hacienda</div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Tildá los comercios que querés destacar en la guía turística.
          </p>
          <div className="space-y-2">
            {businesses.length === 0 && (
              <div className="text-xs text-muted-foreground py-3 text-center">Sin comercios habilitados.</div>
            )}
            {businesses.map((b) => {
              const featured = items.find((i) => i.business_id === b.id && i.featured);
              return (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-xl border">
                  {b.photo_url ? (
                    <img src={b.photo_url} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-isa-navy truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{b.zone || b.address}</div>
                  </div>
                  <button
                    onClick={() => featureBusiness(b)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 ${
                      featured ? "bg-amber-400 text-isa-navy" : "border text-isa-navy"
                    }`}
                  >
                    <Star className="w-3 h-3" /> {featured ? "Destacado" : "Destacar"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">Sin ítems en esta categoría.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="bg-white border rounded-[16px] overflow-hidden">
            {it.photo_url ? (
              <img src={it.photo_url} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-muted" />
            )}
            <div className="p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-isa-navy text-sm truncate">{it.title}</div>
                {it.featured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-isa-navy inline-flex items-center gap-1">
                    <Star className="w-3 h-3" /> Destacado
                  </span>
                )}
              </div>
              {it.location && (
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {it.location}
                </div>
              )}
              {it.description && <div className="text-[12px] text-muted-foreground line-clamp-2">{it.description}</div>}
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => toggleFeatured(it)} className="text-[11px] font-bold text-amber-700 inline-flex items-center gap-1">
                    <Star className="w-3 h-3" /> {it.featured ? "Quitar destacado" : "Destacar"}
                  </button>
                  <button onClick={() => setEditing(it)} className="text-[11px] font-bold text-muno-blue inline-flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => remove(it)} className="text-[11px] font-bold text-muno-red inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <ItemDialog
          item={editing}
          defaultCategory={tab}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ItemDialog({
  item,
  defaultCategory,
  onClose,
  onSaved,
}: {
  item: TItem | null;
  defaultCategory: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>(item?.category || defaultCategory);
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [location, setLocation] = useState(item?.location || "");
  const [photo, setPhoto] = useState<string | null>(item?.photo_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `tourism/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Error subiendo foto");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhoto(data.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("Título requerido");
      return;
    }
    setSaving(true);
    const payload: any = {
      category,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      photo_url: photo,
      published: true,
    };
    const res = item
      ? await supabase.from("tourism_items" as any).update(payload).eq("id", item.id)
      : await supabase.from("tourism_items" as any).insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (res.error) {
      toast.error("Error: " + res.error.message);
      return;
    }
    toast.success("Guardado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="bg-white rounded-[16px] p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-isa-navy">{item ? "Editar ítem" : "Nuevo ítem"}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
            >
              {TABS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Ubicación</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Av. Belgrano 123" className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground">Foto</label>
            <div className="mt-1 flex items-center gap-3">
              {photo ? <img src={photo} className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-muted" />}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                Subir
                <input type="file" accept="image/*" hidden onChange={upload} />
              </label>
            </div>
          </div>
          <button disabled={saving} onClick={save} className="w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
