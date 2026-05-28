import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { toast } from "sonner";
import { UserPlus, Power, Users, X, Copy } from "lucide-react";

type Row = {
  id: string;
  user_id: string;
  role: string;
  area: string | null;
  active: boolean;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
};

export default function AdminColaboradores() {
  const { roles, area } = useAuth();
  const isAdmin = roles.includes("admin");
  const isMayor = roles.includes("mayor");
  const isAreaMgr = roles.includes("area_manager");
  const isTourismChief = roles.includes("tourism_chief");
  const myArea = area || (isTourismChief ? "Turismo" : isMayor || isAdmin ? "Intendencia" : null);
  const canManage = isAdmin || isMayor || isAreaMgr || isTourismChief;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!myArea) { setLoading(false); return; }
    setLoading(true);
    const q = supabase
      .from("user_roles")
      .select("*")
      .eq("role", "resident" as any);
    // Admin/Mayor see all; chiefs see only their area
    const { data: ur } = isAdmin || isMayor ? await q : await q.eq("area", myArea);
    const ids = Array.from(new Set((ur || []).map((r: any) => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id,email,full_name").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profs || []).map((p: any) => [p.id, p]));
    setRows(((ur || []) as any[]).map((r) => ({
      ...r,
      email: map.get(r.user_id)?.email,
      full_name: map.get(r.user_id)?.full_name,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [myArea]);

  const toggleActive = async (r: Row) => {
    const { error } = await supabase.from("user_roles").update({ active: !r.active } as any).eq("id", r.id);
    if (error) { toast.error("No se pudo actualizar"); return; }
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

  const submit = async () => {
    if (fullName.trim().length < 2) { toast.error("Ingresá el nombre completo"); return; }
    if (!email.includes("@")) { toast.error("Email inválido"); return; }
    if (!/^\d{7,9}$/.test(dni.replace(/\D/g, ""))) { toast.error("DNI inválido (7-9 dígitos)"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("invite-staff", {
      body: { full_name: fullName.trim(), email: email.trim().toLowerCase(), dni, role: "resident", area },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error("No se pudo crear: " + (error?.message || (data as any)?.error));
      return;
    }
    logActivity("Agregar colaborador", { entity: "user_roles", meta: { email, area } });
    setCredentials({ email: email.trim().toLowerCase(), password: dni });
    toast.success("Colaborador agregado");
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
