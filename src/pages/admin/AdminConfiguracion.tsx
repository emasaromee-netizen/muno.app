import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";

// Interfaces para limpiar todos los errores de "any"
interface MunicipalSettings {
  id?: string;
  emergency_phone: string;
  mayor_name: string;
  contact_email: string;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AdminConfiguracion() {
  // Reemplazamos 'roles.includes("admin")' por el escudo oficial
  const { roles, area, user } = useAuth();
  const canManageSettings = can(roles, area, PERMISSIONS.USERS_MANAGE);
  
  const [row, setRow] = useState<MunicipalSettings | null>(null);
  const [form, setForm] = useState({ emergency_phone: "", mayor_name: "", contact_email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("municipal_settings")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && isMounted) {
          // Casting seguro usando 'unknown' como puente temporal para Supabase
          const settings = data as unknown as MunicipalSettings;
          setRow(settings);
          setForm({
            emergency_phone: settings.emergency_phone || "",
            mayor_name: settings.mayor_name || "",
            contact_email: settings.contact_email || "",
          });
        }
      } catch (err) {
        console.error("Error al cargar configuraciones", err);
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const save = async () => {
    if (!form.contact_email.includes("@")) { 
      toast.error("Email inválido"); 
      return; 
    }
    setSaving(true);
    
    const payload = { ...form, updated_by: user?.id };
    
    const res = row?.id
      ? await supabase.from("municipal_settings").update(payload).eq("id", row.id)
      : await supabase.from("municipal_settings").insert(payload);
      
    setSaving(false);
    
    if (res.error) { 
      toast.error("No se pudo guardar"); 
      return; 
    }
    
    logActivity("Actualizar configuración municipal", { entity: "municipal_settings", meta: form });
    toast.success("Configuración guardada");
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center">
          <Settings strokeWidth={1.5} className="w-5 h-5" />
        </div>
        <div>
          <div className="font-extrabold text-isa-navy">Personalización del Municipio</div>
          <p className="text-xs text-muted-foreground">Datos visibles para vecinos y en los textos legales.</p>
        </div>
      </div>

      <div className="bg-white border rounded-[16px] p-5 space-y-4">
        <Field 
          label="Teléfono de emergencia" 
          value={form.emergency_phone} 
          onChange={(v: string) => setForm({ ...form, emergency_phone: v })} 
          placeholder="911" 
          disabled={!canManageSettings} 
        />
        <Field 
          label="Nombre del Intendente" 
          value={form.mayor_name} 
          onChange={(v: string) => setForm({ ...form, mayor_name: v })} 
          placeholder="Sr./Sra. Intendente" 
          disabled={!canManageSettings} 
        />
        <Field 
          label="Email de contacto municipal" 
          value={form.contact_email} 
          onChange={(v: string) => setForm({ ...form, contact_email: v })} 
          placeholder="contacto@muno.gob.ar" 
          disabled={!canManageSettings} 
        />
        {canManageSettings ? (
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold min-h-[44px] disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">Solo personal jerárquico autorizado puede modificar estos valores.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }: FieldProps) {
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