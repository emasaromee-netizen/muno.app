import { useEffect, useState } from "react";
import { Megaphone, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function InternalAnnouncement() {
  const { user, roles } = useAuth();
  const isInternal = roles.includes("admin") || roles.includes("area_manager");
  const isAdmin = roles.includes("admin");
  const [row, setRow] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("internal_announcements" as any)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow(data);
    setDraft((data as any)?.message || "");
  };

  useEffect(() => {
    if (isInternal) load();
  }, [isInternal]);

  // Resguardo: solo Intendente / Jefes de Área. Vecinos y Turistas no lo ven.
  if (!isInternal) return null;

  const save = async () => {
    const message = draft.trim();
    if (!message) return toast.error("Escribí un mensaje");
    if (message.length > 500) return toast.error("Máximo 500 caracteres");
    setSaving(true);
    const payload: any = { message, updated_by: user?.id };
    const res = row?.id
      ? await supabase.from("internal_announcements" as any).update(payload).eq("id", row.id)
      : await supabase.from("internal_announcements" as any).insert(payload);
    setSaving(false);
    if (res.error) return toast.error("No se pudo guardar");
    toast.success("Novedad publicada para Jefes de Área");
    setEditing(false);
    load();
  };

  return (
    <div
      className="rounded-[16px] p-4 flex items-start gap-3 text-isa-white border"
      style={{
        background: "hsl(var(--isa-navy))",
        borderColor: "hsl(var(--isa-light))",
      }}
    >
      <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-white/10">
        <Megaphone strokeWidth={1.6} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
            Novedades de Intendencia
          </div>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5 min-h-[32px]"
            >
              <Pencil className="w-3.5 h-3.5" /> {row ? "Editar" : "Crear"}
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ej: Reunión hoy 19hs en Centro Municipal."
              className="w-full rounded-[12px] border border-white/20 bg-white/10 p-3 text-[14px] text-isa-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/40"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] opacity-70">{draft.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(row?.message || "");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-[12px] font-bold border border-white/20 min-h-[36px]"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-[12px] font-bold bg-white text-isa-navy min-h-[36px] disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" /> Publicar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[14px] font-semibold leading-snug mt-1">
            {row?.message ||
              (isAdmin
                ? "Aún no hay novedades. Tocá Crear para publicar el primer comunicado."
                : "Sin novedades por ahora.")}
          </p>
        )}
        {row?.updated_at && !editing && (
          <div className="text-[11px] opacity-70 mt-2">
            Actualizado el {new Date(row.updated_at).toLocaleString("es-AR")}
          </div>
        )}
      </div>
    </div>
  );
}
