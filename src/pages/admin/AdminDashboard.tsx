import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AlertTriangle, Store, CalendarDays, FileText, ArrowRight, Sparkles, Bell, Pencil, Save, X, Palette, Trophy, HardHat, Wallet, CheckCircle2, Users, ListTodo, FileEdit, Lock, BarChart3, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { admin_commerces, my_claims } from "@/data/mock";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import StaffNewsWidget from "@/components/admin/StaffNewsWidget";

const Card = ({ icon: Icon, label, value, hint, color }: any) => (
  <div className="bg-white rounded-[16px] p-5 border border-border/60 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">{label}</div>
      <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: color + "15", color }}>
        <Icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
      </div>
    </div>
    <div className="font-display text-[28px] font-extrabold text-isa-navy mt-2 leading-none">{value}</div>
    {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
  </div>
);

function InternalAnnouncement() {
  const { user, roles } = useAuth();
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
    load();
  }, []);

  const save = async () => {
    const message = draft.trim();
    if (!message) {
      toast.error("Escribí un mensaje");
      return;
    }
    if (message.length > 500) {
      toast.error("Máximo 500 caracteres");
      return;
    }
    setSaving(true);
    const payload: any = { message, updated_by: user?.id };
    const res = row?.id
      ? await supabase.from("internal_announcements" as any).update(payload).eq("id", row.id)
      : await supabase.from("internal_announcements" as any).insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Anuncio publicado para Jefes de Área");
    setEditing(false);
    load();
  };

  return (
    <div
      className="rounded-[16px] p-4 border flex items-start gap-3"
      style={{ background: "#F5EFE6", borderColor: "rgba(36,46,68,0.15)" }}
    >
      <div
        className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
        style={{ background: "#242E44", color: "#fff" }}
      >
        <Bell strokeWidth={1.5} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy/70">
            Novedades para Jefes de Área
          </div>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-isa-navy hover:opacity-80 min-h-[36px] px-2"
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
              placeholder="Ej: Reunión 5 de agosto 2026, 19hs en Centro Municipal. Áreas: Deporte, Cultura y Turismo."
              className="w-full rounded-[12px] border border-isa-navy/20 bg-white p-3 text-[14px] text-isa-navy outline-none focus:ring-2 focus:ring-isa-navy"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{draft.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(row?.message || "");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-[12px] font-bold border min-h-[36px]"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px] text-[12px] font-bold bg-isa-navy text-white min-h-[36px] disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" /> Publicar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[14px] font-semibold leading-snug text-isa-navy mt-1">
            {row?.message || (isAdmin
              ? "Aún no hay novedades. Tocá Crear para publicar el primer anuncio."
              : "Sin novedades por ahora.")}
          </p>
        )}
        {row?.updated_at && !editing && (
          <div className="text-[11px] text-muted-foreground mt-2">
            Actualizado el {new Date(row.updated_at).toLocaleString("es-AR")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { roles } = useAuth();
  const [latest, setLatest] = useState<any>(null);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("muno.isa.report.unread") === "1";
    setUnread(u);
    if (u) toast("📊 Nuevo informe ISA disponible", { description: "Auditoría publicada por ISA Business Analyst." });
    supabase.from("analytics_reports").select("*").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => setLatest(data?.[0] || null));
  }, []);

  // Jefe de Turismo: dashboard exclusivo es la Guía Turista
  if (roles.includes("tourism_chief") && !roles.includes("admin") && !roles.includes("mayor")) {
    return <Navigate to="/admin/guia-turista" replace />;
  }

  const activos = my_claims.filter((c) => c.status !== "Cerrado").length + 4;
  const enabled = admin_commerces.filter((c) => c.enabled).length;
  const eventos = 12;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-extrabold text-isa-navy text-[22px] leading-tight">
            Buen día, Intendencia 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen ejecutivo del municipio. Actualizado al {new Date().toLocaleDateString("es-AR")}.
          </p>
        </div>
        <Link
          to="/admin/metricas"
          className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold hover:opacity-90 min-h-[44px]"
        >
          Ver informe ISA <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <InternalAnnouncement />
      <StaffNewsWidget />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card icon={AlertTriangle} label="Reclamos activos" value={activos} hint="+3 vs ayer" color="#EF4444" />
        <Card icon={Store} label="Comercios habilitados" value={enabled} hint={`${admin_commerces.length - enabled} pendientes`} color="#00B89C" />
        <Card icon={CalendarDays} label="Eventos del mes" value={eventos} hint="3 esta semana" color="#1A56F0" />
        <Card icon={FileText} label="Último informe ISA" value={latest ? "Disponible" : "—"} hint={latest ? new Date(latest.created_at).toLocaleDateString() : "Pendiente"} color="#242E44" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/admin/reclamos" className="bg-white rounded-[16px] p-5 border hover:shadow-md transition-all">
          <div className="font-extrabold text-isa-navy">Bandeja de Reclamos</div>
          <p className="text-xs text-muted-foreground mt-1">Asigná cuadrillas y cerrá con evidencia.</p>
          <span className="text-[12px] font-bold text-muno-blue inline-flex items-center gap-1 mt-3">Abrir <ArrowRight className="w-3 h-3" /></span>
        </Link>
        <Link to="/admin/comercios" className="bg-white rounded-[16px] p-5 border hover:shadow-md transition-all">
          <div className="font-extrabold text-isa-navy">Habilitaciones</div>
          <p className="text-xs text-muted-foreground mt-1">Vencimientos y validaciones de comercios.</p>
          <span className="text-[12px] font-bold text-muno-blue inline-flex items-center gap-1 mt-3">Abrir <ArrowRight className="w-3 h-3" /></span>
        </Link>
        <Link
          to="/admin/metricas"
          className="relative bg-white rounded-[16px] p-5 border hover:shadow-md transition-all"
        >
          {unread && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full text-isa-navy"
              style={{ background: "linear-gradient(135deg,#F5C84B,#E0A93A)" }}>
              <Sparkles className="w-3 h-3" /> ISA
            </span>
          )}
          <div className="font-extrabold text-isa-navy">Analítica ISA</div>
          <p className="text-xs text-muted-foreground mt-1">Informe mensual con KPIs y conclusión estratégica.</p>
          <span className="text-[12px] font-bold text-muno-blue inline-flex items-center gap-1 mt-3">Abrir <ArrowRight className="w-3 h-3" /></span>
        </Link>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="font-display font-extrabold text-isa-navy text-[18px] leading-tight">Gestión por Áreas</h3>
            <p className="text-[12px] text-muted-foreground">Estado y acceso directo a cada Jefatura.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground hidden sm:inline">Jefes de Área</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { name: "Cultura", icon: Palette, color: "#8B5CF6", to: "/admin/cultura", hint: "12 inscripciones nuevas" },
            { name: "Deportes", icon: Trophy, color: "#00B89C", to: "/admin/deporte", hint: "5 actividades activas" },
            { name: "Infraestructura", icon: HardHat, color: "#F59E0B", to: "/admin/reclamos", hint: "8 reclamos en curso" },
            { name: "Hacienda", icon: Wallet, color: "#1A56F0", to: "/admin/comercios", hint: "Habilitaciones al día" },
          ].map((a) => (
            <div key={a.name} className="bg-white rounded-[16px] p-5 border border-border/60 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: a.color + "15", color: a.color }}>
                  <a.icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> Datos OK
                </span>
              </div>
              <div className="font-display text-[18px] font-extrabold text-isa-navy mt-3 leading-tight">{a.name}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{a.hint}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Actualizado {new Date().toLocaleDateString("es-AR")}</div>
              <Link to={a.to} className="mt-4 inline-flex items-center justify-center gap-1.5 bg-isa-navy text-white rounded-[10px] px-3 py-2 text-[12px] font-bold hover:opacity-90 min-h-[40px]">
                Entrar a gestionar área <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="font-display font-extrabold text-isa-navy text-[18px] leading-tight">Operación diaria</h3>
            <p className="text-[12px] text-muted-foreground">Accesos directos para Jefes de Área.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { to: "/admin/colaboradores", label: "Invitar equipo", icon: UserPlus, color: "#8B5CF6" },
            { to: "/admin/tareas", label: "Tablero de Tareas", icon: ListTodo, color: "#00B89C" },
            { to: "/admin/reclamos", label: "Bandeja de Reclamos", icon: AlertTriangle, color: "#EF4444" },
            { to: "/admin/contenido", label: "Carga de Contenido", icon: FileEdit, color: "#1A56F0" },
            { to: "/admin/metricas/cargar", label: "Cargar métricas ISA", icon: BarChart3, color: "#F59E0B" },
            { to: "/admin/metricas", label: "Ver informe ISA", icon: FileText, color: "#242E44" },
          ].map((q) => (
            <Link key={q.to} to={q.to} className="bg-white rounded-[16px] p-4 border border-border/60 hover:shadow-md transition-shadow flex flex-col items-start gap-2 min-h-[110px]">
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: q.color + "15", color: q.color }}>
                <q.icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
              </div>
              <div className="font-extrabold text-isa-navy text-[13px] leading-tight">{q.label}</div>
              <span className="text-[11px] font-bold text-muno-blue inline-flex items-center gap-1 mt-auto">Abrir <ArrowRight className="w-3 h-3" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-isa-navy text-white rounded-[16px] p-4 flex items-center gap-3 border border-isa-navy/20">
        <div className="w-10 h-10 rounded-xl grid place-items-center bg-white/10 shrink-0">
          <Lock strokeWidth={1.5} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/60">Identidad MUNO</div>
          <div className="font-display font-extrabold text-[14px] leading-tight">Banner institucional fijo · solo lectura</div>
          <p className="text-[11px] text-white/70 mt-0.5">Este bloque no puede ser editado ni eliminado por el municipio.</p>
        </div>
      </section>
    </div>
  );
}
