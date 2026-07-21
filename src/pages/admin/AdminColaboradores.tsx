import { useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { UserPlus, Power, Users, X, Copy } from "lucide-react";
// 1. SOLUCIÓN QUIRÚRGICA: Importar el control de acceso centralizado
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";

// --- TIPOS ESTRICTOS (Eliminan los 9 errores de ESLint) ---
type Row = {
  id: string;
  user_id: string;
  role: string;
  area: string | null;
  active: boolean;
  created_at: string;
  email?: string;
  full_name?: string;
};

interface DBUserRole {
  id: string;
  user_id: string;
  role: string;
  area: string | null;
  active: boolean;
  created_at: string;
}

interface DBProfile {
  id: string;
  email?: string;
  full_name?: string;
}

interface EdgeFunctionResponse {
  error?: string;
  [key: string]: unknown;
}

export default function AdminColaboradores() {
  const { roles, area } = useAuth();
  
  // 2. Evaluaciones de seguridad refactorizadas
  const isTourismChief = roles.includes("tourism_chief");
  const isMayor = roles.includes("mayor");
  const isAdmin = roles.includes("admin");
  
  const myArea = area || (isTourismChief ? "Turismo" : isMayor || isAdmin ? "Intendencia" : null);
  
  // SOLUCIÓN QUIRÚRGICA: Uso de la directiva centralizada de seguridad
  type AppRoles = Parameters<typeof can>[0];
  const safeRoles = roles as AppRoles;
  
  const canManage = can(safeRoles, area, PERMISSIONS.USERS_MANAGE);
  const canViewAll = can(safeRoles, area, PERMISSIONS.USERS_VIEW_ALL); // 🔴 FIX SRE: Traer la capacidad formal

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // 1. SOLUCIÓN: Usamos useRef para mantener la referencia viva en memoria
  const isMounted = useRef(true);

  // 2. Quitamos el parámetro booleano tramposo del useCallback
  const load = useCallback(async () => {
    if (!myArea) { 
      if (isMounted.current) setLoading(false); 
      return; 
    }
    
    if (isMounted.current) setLoading(true);
    
    try {
      // FIX N+1: Resource Embedding
      const q = supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          area,
          active,
          created_at,
          profiles ( email, full_name )
        `)
        .eq("role", "resident");

      // 🔴 FIX ALTO (Google AI Studio): Refactor de validación de carga basada en capacidades (can()), NO en roles
      const { data: urData } = canViewAll ? await q : await q.eq("area", myArea);
      
      if (isMounted.current) {
        // Tipado estricto para eliminar el error de 'any'
        type JoinedData = {
          id: string;
          user_id: string;
          role: string;
          area: string | null;
          active: boolean;
          created_at: string;
          profiles: { email: string | null; full_name: string | null } | null;
        };

        const rawData = (urData || []) as unknown as JoinedData[];

        const formattedRows: Row[] = rawData.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          role: r.role,
          area: r.area,
          active: r.active,
          created_at: r.created_at,
          email: r.profiles?.email || undefined,
          full_name: r.profiles?.full_name || undefined,
        }));
        
        setRows(formattedRows);
      }
    } catch (error) {
      console.error("Error al cargar colaboradores:", error);
      toast.error("Error al cargar colaboradores");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [myArea, canViewAll]);

  useEffect(() => { 
    isMounted.current = true;
    load(); 
    
    return () => {
      // 4. Cuando el componente muere, apagamos la referencia
      isMounted.current = false;
    };
  }, [load]);

  const toggleActive = async (r: Row) => {
    // Objeto limpio sin casteos 'any'
    const updatePayload = { active: !r.active };
    
    const { error } = await supabase.from("user_roles").update(updatePayload).eq("id", r.id);
    
    if (error) { 
      toast.error("No se pudo actualizar"); 
      return; 
    }
    
    toast.success(r.active ? "Acceso desactivado" : "Acceso reactivado");
    logActivity(r.active ? "Desactivar colaborador" : "Reactivar colaborador", { entity: "user_roles", entity_id: r.id, meta: { email: r.email } });
    load();
  };

  if (!canManage) {
    return <div className="bg-white border rounded-[16px] p-6 text-center text-sm text-muted-foreground">Acceso reservado al equipo municipal.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center"><Users strokeWidth={1.5} className="w-5 h-5" /></div>
          <div>
            <div className="font-extrabold text-isa-navy">Mi Equipo</div>
            <p className="text-xs text-muted-foreground">
              Colaboradores de tu área{myArea ? ` (${myArea})` : ""}. Sólo gestionás los que dependen de vos.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" /> Agregar colaborador
        </button>
      </div>

      <div className="bg-white border rounded-[16px] divide-y">
        {loading && <div className="p-6 text-sm text-muted-foreground text-center">Cargando…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">Aún no agregaste colaboradores en tu equipo.</div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-isa-navy truncate">{r.full_name || r.email || "—"}</div>
              <div className="text-[12px] text-muted-foreground truncate">{r.email}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Colaborador · {r.area || "—"} · alta {new Date(r.created_at).toLocaleDateString("es-AR")}</div>
            </div>
            <span className={`isa-chip ${r.active ? "bg-muno-teal/15 text-muno-teal" : "bg-muted text-muted-foreground"}`}>{r.active ? "Activo" : "Inactivo"}</span>
            <button onClick={() => toggleActive(r)} className="text-xs font-bold text-[hsl(var(--muno-red))] inline-flex items-center gap-1">
              <Power className="w-3 h-3" /> {r.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>

      {creating && myArea && (
        <CreateCollaboratorDialog
          area={myArea}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateCollaboratorDialog({ area, onClose, onCreated }: { area: string; onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  // FIX ALTO: Manejo de errores por microcortes de red móvil
  const submit = async () => {
    if (fullName.trim().length < 2) { toast.error("Ingresá el nombre completo"); return; }
    if (!email.includes("@")) { toast.error("Email inválido"); return; }
    if (!/^\d{7,9}$/.test(dni.replace(/\D/g, ""))) { toast.error("DNI inválido (7-9 dígitos)"); return; }
    
    setBusy(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("invite-staff", {
        body: { full_name: fullName.trim(), email: email.trim().toLowerCase(), dni, role: "resident", area },
      });
      
      const funcError = error || (data as EdgeFunctionResponse)?.error;
      
      if (funcError) {
        toast.error("No se pudo crear: " + (error?.message || funcError));
        setBusy(false);
        return;
      }
      
      logActivity("Agregar colaborador", { entity: "user_roles", meta: { email, area } });
      setCredentials({ email: email.trim().toLowerCase(), password: dni });
      toast.success("Colaborador agregado");
    } catch (err) {
      console.error(err);
      toast.error("Fallo en la comunicación con el servidor. Verificá tu red móvil.");
    } finally {
      setBusy(false);
    }
  };

  if (credentials) {
    return (
      <Modal title="Credenciales generadas" onClose={() => { setCredentials(null); onCreated(); }}>
        <p className="text-[13px] text-isa-navy mb-3">Compartí estos datos con la persona para su primer ingreso:</p>
        <div className="rounded-xl border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2"><span className="font-bold">Usuario</span><span className="text-muted-foreground truncate">{credentials.email}</span></div>
          <div className="flex items-center justify-between gap-2"><span className="font-bold">Contraseña</span><span className="font-mono text-isa-navy">{credentials.password}</span></div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(`Usuario: ${credentials.email}\nContraseña: ${credentials.password}`); toast.success("Copiado"); }}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 border rounded-[12px] py-2.5 text-sm font-bold"
        >
          <Copy className="w-4 h-4" /> Copiar
        </button>
        <button onClick={() => { setCredentials(null); onCreated(); }} className="mt-2 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold">Cerrar</button>
      </Modal>
    );
  }

  return (
    <Modal title={`Agregar colaborador · ${area}`} onClose={onClose}>
      <p className="text-[12px] text-muted-foreground mb-3">Se crea la cuenta automáticamente. La contraseña inicial será el DNI.</p>
      <label className="text-xs font-bold text-muted-foreground">Nombre completo</label>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />
      <label className="text-xs font-bold text-muted-foreground">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />
      <label className="text-xs font-bold text-muted-foreground">DNI</label>
      <input value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />
      <button disabled={busy} onClick={submit} className="mt-2 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold min-h-[44px] disabled:opacity-60">
        {busy ? "Creando…" : "Crear colaborador"}
      </button>
    </Modal>
  );
}

// 5. Reemplazando 'any' con ReactNode y tipado correcto para un Modal
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="bg-white rounded-[16px] p-5 max-w-md w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-isa-navy">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}