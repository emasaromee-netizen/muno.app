import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { UserPlus, Pencil, Power, ShieldCheck, X, Copy } from "lucide-react";

const AREAS = ["Intendencia", "Cultura", "Turismo", "Deporte", "Infraestructura", "Comercios"] as const;
const ROLES_VISIBLE = ["area_manager", "isa_consultant", "admin", "tourism_chief", "mayor", "resident"] as const;

type Row = {
  id: string;
  user_id: string;
  role: string;
  area: string | null;
  active: boolean;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
  last_sign_in_at?: string | null;
};

export default function AdminUsuariosMunicipales() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isMayor = roles.includes("mayor");
  const canManage = isAdmin || isMayor;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: ur } = await supabase
      .from("user_roles")
      .select("*")
      .in("role", ROLES_VISIBLE as any);
    const ids = Array.from(new Set((ur || []).map((r: any) => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profs || []).map((p: any) => [p.id, p]));
    setRows(((ur || []) as any[]).map((r) => ({
      ...r,
      email: map.get(r.user_id)?.email,
      full_name: map.get(r.user_id)?.full_name,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (r: Row) => {
    const { error } = await supabase.from("user_roles").update({ active: !r.active } as any).eq("id", r.id);
    if (error) { toast.error("No se pudo actualizar"); return; }
    toast.success(r.active ? "Acceso desactivado" : "Acceso reactivado");
    logActivity(r.active ? "Desactivar acceso funcionario" : "Reactivar acceso funcionario", { entity: "user_roles", entity_id: r.id, meta: { email: r.email } });
    load();
  };

  if (!canManage) {
    return <div className="bg-white border rounded-[16px] p-6 text-center text-sm text-muted-foreground">Acceso reservado al Intendente.</div>;
  }

  // Group: chiefs vs collaborators
  const chiefs = rows.filter((r) => ["area_manager", "tourism_chief", "mayor", "admin"].includes(r.role));
  const collaborators = rows.filter((r) => r.role === "resident");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-isa-navy text-white grid place-items-center"><ShieldCheck strokeWidth={1.5} className="w-5 h-5" /></div>
          <div>
            <div className="font-extrabold text-isa-navy">Gestión de Gabinete</div>
            <p className="text-xs text-muted-foreground">Jefes de Área, colaboradores directos y consultores ISA. Sólo el Intendente puede crear, modificar o eliminar Jefes.</p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" /> Nuevo integrante
        </button>
      </div>

      <div className="bg-white border rounded-[16px] p-3">
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground px-2 pt-1 pb-2">Jefes de Área · {chiefs.length}</div>
        <RoleTable rows={chiefs} loading={loading} setEditing={setEditing} toggleActive={toggleActive} />
      </div>

      <div className="bg-white border rounded-[16px] p-3">
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground px-2 pt-1 pb-2">Colaboradores directos · {collaborators.length}</div>
        <RoleTable rows={collaborators} loading={loading} setEditing={setEditing} toggleActive={toggleActive} />
      </div>

      {editing && <EditDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function EditDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [area, setArea] = useState(row.area || "Intendencia");
  const save = async () => {
    const { error } = await supabase.from("user_roles").update({ area } as any).eq("id", row.id);
    if (error) { toast.error("Error al guardar"); return; }
    logActivity("Editar área de funcionario", { entity: "user_roles", entity_id: row.id, meta: { area, email: row.email } });
    toast.success("Área actualizada");
    onSaved();
  };
  return (
    <Modal title={`Editar área · ${row.full_name || row.email}`} onClose={onClose}>
      <label className="text-xs font-bold text-muted-foreground">Área asignada</label>
      <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]">
        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <button onClick={save} className="mt-4 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold min-h-[44px]">Guardar</button>
    </Modal>
  );
}

function RoleTable({ rows, loading, setEditing, toggleActive }: { rows: Row[]; loading: boolean; setEditing: (r: Row) => void; toggleActive: (r: Row) => void }) {
  if (loading) return <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>;
  if (rows.length === 0) return <div className="p-6 text-center text-sm text-muted-foreground">Sin registros.</div>;
  return (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="px-2 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-isa-navy truncate">{r.full_name || r.email || "—"}</div>
            <div className="text-[12px] text-muted-foreground truncate">{r.email}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{r.role}{r.area ? ` · ${r.area}` : ""} · alta {new Date(r.created_at).toLocaleDateString("es-AR")}</div>
          </div>
          <span className={`isa-chip ${r.active ? "bg-muno-teal/15 text-muno-teal" : "bg-muted text-muted-foreground"}`}>{r.active ? "Activo" : "Inactivo"}</span>
          <button onClick={() => setEditing(r)} className="text-xs font-bold text-muno-blue inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Área</button>
          <button onClick={() => toggleActive(r)} className="text-xs font-bold text-[hsl(var(--muno-red))] inline-flex items-center gap-1"><Power className="w-3 h-3" /> {r.active ? "Desactivar" : "Activar"}</button>
        </div>
      ))}
    </div>
  );
}

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [role, setRole] = useState<"area_manager" | "tourism_chief" | "mayor" | "resident">("area_manager");
  const [area, setArea] = useState("Intendencia");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const create = async () => {
    if (fullName.trim().length < 2) { toast.error("Ingresá el nombre completo"); return; }
    if (!email.includes("@")) { toast.error("Email inválido"); return; }
    if (!/^\d{7,9}$/.test(dni.replace(/\D/g, ""))) { toast.error("DNI inválido (7-9 dígitos)"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("invite-staff", {
      body: { full_name: fullName.trim(), email: email.trim().toLowerCase(), dni, role, area },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error("No se pudo crear: " + (error?.message || (data as any)?.error));
      return;
    }
    logActivity("Crear integrante de gabinete", { entity: "user_roles", meta: { email, role, area } });
    setCredentials({ email: email.trim().toLowerCase(), password: dni });
    toast.success("Integrante habilitado");
  };

  if (credentials) {
    return (
      <Modal title="Credenciales generadas" onClose={() => { setCredentials(null); onCreated(); }}>
        <p className="text-[13px] text-isa-navy mb-3">Compartí estos datos con la persona para su primer ingreso:</p>
        <div className="rounded-xl border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">Usuario</span>
            <span className="text-muted-foreground truncate">{credentials.email}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">Contraseña provisoria</span>
            <span className="font-mono text-isa-navy">{credentials.password}</span>
          </div>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(`Usuario: ${credentials.email}\nContraseña: ${credentials.password}`); toast.success("Copiado"); }}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 border rounded-[12px] py-2.5 text-sm font-bold"
        >
          <Copy className="w-4 h-4" /> Copiar credenciales
        </button>
        <button onClick={() => { setCredentials(null); onCreated(); }} className="mt-2 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold">Cerrar</button>
      </Modal>
    );
  }

  return (
    <Modal title="Nuevo integrante" onClose={onClose}>
      <p className="text-[12px] text-muted-foreground mb-3">El sistema crea el usuario automáticamente. La contraseña inicial será su DNI.</p>
      <label className="text-xs font-bold text-muted-foreground">Nombre completo</label>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />

      <label className="text-xs font-bold text-muted-foreground">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="funcionario@muno.gob.ar" className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />

      <label className="text-xs font-bold text-muted-foreground">DNI (será la contraseña inicial)</label>
      <input value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" placeholder="30123456" className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]" />

      <label className="text-xs font-bold text-muted-foreground">Rol</label>
      <select value={role} onChange={(e) => setRole(e.target.value as any)} className="mt-1 mb-3 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]">
        <option value="area_manager">Jefe de Área</option>
        <option value="tourism_chief">Jefe de Turismo</option>
        <option value="mayor">Intendente</option>
        <option value="resident">Colaborador directo</option>
      </select>

      <label className="text-xs font-bold text-muted-foreground">Área / Departamento</label>
      <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-background text-sm min-h-[44px]">
        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <button disabled={busy} onClick={create} className="mt-4 w-full bg-isa-navy text-white rounded-[12px] py-2.5 text-sm font-bold min-h-[44px] disabled:opacity-60">
        {busy ? "Creando…" : "Crear y generar credenciales"}
      </button>
    </Modal>
  );
}

function Modal({ title, onClose, children }: any) {
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
