import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Bell, Plus, Trash2, X } from "lucide-react";

type Row = { id: string; title: string; body: string; created_at: string; created_by: string | null };

export default function AdminNovedadesJefes() {
  const { user, roles } = useAuth();
  const canPublish = roles.includes("admin") || roles.includes("mayor");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("staff_announcements" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("staff_ann")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_announcements" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta novedad?")) return;
    const { error } = await supabase.from("staff_announcements" as any).delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar");
    else toast.success("Eliminada");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-extrabold text-isa-navy text-lg">Novedades para Jefes</h2>
          <p className="text-xs text-muted-foreground">Comunicaciones internas del Intendente. Visibles solo para personal municipal.</p>
        </div>
        {canPublish && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold"
          >
            <Plus className="w-4 h-4" /> Nueva novedad
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground bg-white border rounded-[16px] p-6 text-center">
            Aún no hay novedades publicadas.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="bg-white border rounded-[16px] p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-isa-navy">{r.title}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {new Date(r.created_at).toLocaleString("es-AR")}
              </div>
              <p className="text-sm text-isa-navy whitespace-pre-wrap">{r.body}</p>
            </div>
            {canPublish && r.created_by === user?.id && (
              <button onClick={() => remove(r.id)} className="text-muno-red p-1.5 hover:bg-muted rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {creating && <CreateDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function CreateDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Completá título y mensaje");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("staff_announcements" as any)
      .insert({ title: title.trim(), body: body.trim(), created_by: user?.id });
    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Novedad publicada");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="bg-white rounded-[16px] p-5 max-w-md w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-isa-navy">Nueva novedad</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="text-xs font-bold text-muted-foreground">Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
        <label className="text-xs font-bold text-muted-foreground">Mensaje</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none" />
        <button disabled={saving} onClick={save} className="mt-4 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold disabled:opacity-60">
          {saving ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
