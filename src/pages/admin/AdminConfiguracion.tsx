import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export default function AdminConfiguracion() {
  const { roles, user } = useAuth();
  const isAdmin = roles.includes("admin");
  const [row, setRow] = useState<any>(null);
  const [form, setForm] = useState({ emergency_phone: "", mayor_name: "", contact_email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("municipal_settings" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRow(data);
      if (data) setForm({
        emergency_phone: (data as any).emergency_phone || "",
        mayor_name: (data as any).mayor_name || "",
        contact_email: (data as any).contact_email || "",
      });
    })();
  }, []);

  const save = async () => {
    if (!form.contact_email.includes("@")) { toast.error("Email inválido"); return; }
    setSaving(true);
    const payload: any = { ...form, updated_by: user?.id };
    const res = row?.id
      ? await supabase.from("municipal_settings" as any).update(payload).eq("id", row.id)
      : await supabase.from("municipal_settings" as any).insert(payload);
    setSaving(false);
    if (res.error) { toast.error("No se pudo guardar"); return; }
    logActivity("Actualizar configuración municipal", { entity: "municipal_settings", meta: form });
    toast.success("Configuración guardada");
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center"><Settings strokeWidth={1.5} className="w-5 h-5" /></div>
        <div>
          <div className="font-extrabold text-isa-navy">Personalización del Municipio</div>
          <p className="text-xs text-muted-foreground">Datos visibles para vecinos y en los textos legales.</p>
        </div>
      </div>

      <div className="bg-white border rounded-[16px] p-5 space-y-4">
        <Field label="Teléfono de emergencia" value={form.emergency_phone} onChange={(v) => setForm({ ...form, emergency_phone: v })} placeholder="911" disabled={!isAdmin} />
        <Field label="Nombre del Intendente" value={form.mayor_name} onChange={(v) => setForm({ ...form, mayor_name: v })} placeholder="Sr./Sra. Intendente" disabled={!isAdmin} />
        <Field label="Email de contacto municipal" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} placeholder="contacto@muno.gob.ar" disabled={!isAdmin} />
        {isAdmin ? (
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold min-h-[44px] disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">Solo el Intendente puede modificar estos valores.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={120}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px] disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}
