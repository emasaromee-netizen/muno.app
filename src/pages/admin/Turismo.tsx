import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Camera, Loader2, Plus, Star, Upload, Wallet } from "lucide-react";

type Category = "gastronomy" | "event" | "lodging" | "nature" | "commerce";

const CATS: { id: Category; label: string }[] = [
  { id: "gastronomy", label: "Gastronomía" },
  { id: "event", label: "Eventos" },
  { id: "lodging", label: "Hospedaje" },
  { id: "nature", label: "Atractivos" },
];

function FormularioCarga() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>("gastronomy");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file: File) => {
    if (!user) {
      toast.error("Iniciá sesión para subir fotos");
      return;
    }
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tourism_items" as any).insert({
      category,
      title: title.trim(),
      description: description.trim() || null,
      photo_url: photo,
      published: true,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Publicado en la guía turística");
    setTitle("");
    setDescription("");
    setPhoto(null);
  };

  return (
    <div className="bg-white rounded-[16px] border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-isa-navy" />
        <h3 className="font-extrabold text-isa-navy text-sm">Nuevo ítem turístico</h3>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-2 rounded-[10px] text-[12px] font-bold opacity-100 ${
              category === c.id ? "bg-isa-navy text-white" : "border text-isa-navy"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nombre"
        className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Descripción"
        className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none"
      />

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-[14px] p-5 text-center transition-colors ${
          drag ? "border-isa-navy bg-isa-light" : "border-muted-foreground/30 bg-muted/30"
        }`}
      >
        {photo ? (
          <div className="flex items-center gap-3 justify-center">
            <img src={photo} className="w-16 h-16 rounded-lg object-cover" alt="" />
            <span className="text-xs text-muted-foreground">Foto cargada · click para reemplazar</span>
          </div>
        ) : uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="w-5 h-5" />
            <div className="text-xs font-bold text-isa-navy">Arrastrá una foto o hacé click</div>
            <div className="text-[11px]">JPG, PNG · max 5MB</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold opacity-100 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        Guardar y publicar
      </button>
    </div>
  );
}

function TablaComerciosHacienda() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: biz } = await supabase
      .from("businesses")
      .select("id,name,zone,address,enabled,tax_expires_at,photo_url")
      .order("name");
    setRows(biz || []);
    const { data: feats } = await supabase
      .from("tourism_items" as any)
      .select("business_id,featured")
      .eq("featured", true);
    setFeaturedIds(new Set(((feats as any[]) || []).map((f) => f.business_id).filter(Boolean)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const featurar = async (b: any) => {
    if (featuredIds.has(b.id)) {
      const { data: existing } = await supabase
        .from("tourism_items" as any)
        .select("id")
        .eq("business_id", b.id)
        .maybeSingle();
      if ((existing as any)?.id) {
        await supabase.from("tourism_items" as any).update({ featured: false }).eq("id", (existing as any).id);
      }
      toast.success("Quitado de destacados");
    } else {
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
      if (error) {
        toast.error("No se pudo destacar: " + error.message);
        return;
      }
      toast.success(`${b.name} destacado en la guía`);
    }
    load();
  };

  return (
    <div className="bg-white rounded-[16px] border overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <Wallet className="w-4 h-4 text-isa-navy" />
        <h3 className="font-extrabold text-isa-navy text-sm">Comercios desde Hacienda</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-bold">Comercio</th>
              <th className="text-left px-4 py-2.5 font-bold">Zona</th>
              <th className="text-left px-4 py-2.5 font-bold">Habilitado</th>
              <th className="text-right px-4 py-2.5 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  Sin comercios registrados.
                </td>
              </tr>
            )}
            {rows.map((b) => {
              const featured = featuredIds.has(b.id);
              return (
                <tr key={b.id} className="border-t">
                  <td className="px-4 py-2.5 font-bold text-isa-navy">{b.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{b.zone || b.address || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      b.enabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {b.enabled ? "SI" : "NO"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => featurar(b)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full opacity-100 ${
                        featured ? "bg-amber-400 text-isa-navy" : "border text-isa-navy hover:bg-isa-light"
                      }`}
                    >
                      <Star className="w-3 h-3" /> {featured ? "Destacado" : "Destacar en Guía"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Turismo() {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display font-extrabold text-isa-navy text-[22px] leading-tight">
          Panel de Turismo
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cargá contenido turístico y conectá comercios desde Hacienda.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FormularioCarga />
        <TablaComerciosHacienda />
      </div>
    </div>
  );
}
