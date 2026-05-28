import { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  LayoutDashboard,
  AlertTriangle,
  Store,
  MapPin,
  CalendarDays,
  Users,
  Megaphone,
  BarChart3,
  ListTodo,
  FileEdit,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  ScrollText,
  Settings,
  Wallet,
} from "lucide-react";
import { useRole, type AdminArea } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import StaffNewsWidget from "./StaffNewsWidget";

type Item = { to: string; label: string; icon: any };

const ALL: Record<string, Item> = {
  home:        { to: "/admin",              label: "Inicio",              icon: LayoutDashboard },
  reclamos:    { to: "/admin/reclamos",     label: "Gestión de Reclamos", icon: AlertTriangle },
  comercios:   { to: "/admin/comercios",    label: "Habilitaciones",      icon: Store },
  lugares:     { to: "/admin/lugares",      label: "Puntos de Interés",   icon: MapPin },
  cultura:     { to: "/admin/cultura",      label: "Inscripciones",       icon: Users },
  contenido:   { to: "/admin/contenido",    label: "Agenda de Eventos",   icon: CalendarDays },
  banners:     { to: "/admin/banners",      label: "Banners Home",        icon: Megaphone },
  metricas:    { to: "/admin/metricas",     label: "Analítica ISA",       icon: BarChart3 },
  metricasIn:  { to: "/admin/metricas/cargar", label: "Cargar métricas ISA", icon: FileEdit },
  tareas:      { to: "/admin/tareas",       label: "Tareas internas",     icon: ListTodo },
  equipo:      { to: "/admin/colaboradores",label: "Mi Equipo",            icon: Users },
  deporte:     { to: "/admin/deporte",      label: "Inscripciones Deporte", icon: ListTodo },
  contenidoEd: { to: "/admin/contenido",    label: "Cargar Contenido",    icon: FileEdit },
  usuarios:    { to: "/admin/usuarios",     label: "Gestión de Gabinete", icon: Users },
  auditoria:   { to: "/admin/auditoria",    label: "Auditoría",           icon: ScrollText },
  config:      { to: "/admin/configuracion",label: "Configuración",       icon: Settings },
  turismo:     { to: "/admin/guia-turista", label: "Guía Turista",       icon: MapPin },
  hacienda:    { to: "/admin/hacienda",     label: "Hacienda",            icon: Wallet },
  dashboardInt:{ to: "/admin/dashboard-intendente", label: "Dashboard Intendente", icon: LayoutDashboard },
  novedades:   { to: "/admin/novedades",    label: "Novedades para Jefes", icon: Megaphone },
};

function menuFor(area: AdminArea, isAdmin: boolean, isMayor: boolean, isTourism: boolean): Item[] {
  if (isMayor && !isAdmin) {
    // Intendente: supervisión read-only de todo + dashboard ejecutivo + banners + novedades
    return [
      ALL.dashboardInt, ALL.home, ALL.reclamos, ALL.hacienda, ALL.comercios, ALL.lugares, ALL.contenido,
      ALL.cultura, ALL.deporte, ALL.turismo, ALL.banners, ALL.novedades,
      ALL.metricas, ALL.tareas, ALL.equipo,
    ];
  }
  if (isTourism && !isAdmin) {
    // Jefe de Turismo: vista acotada
    return [
      ALL.home,
      ALL.turismo,
      { to: "/admin/reclamos", label: "Reclamos de Área", icon: AlertTriangle },
      ALL.equipo,
    ];
  }
  const adminExtras = isAdmin ? [ALL.usuarios, ALL.equipo, ALL.novedades, ALL.auditoria, ALL.config] : [];
  switch (area) {
    case "Intendencia":
      return [
        ALL.home, ALL.dashboardInt, ALL.reclamos, ALL.hacienda, ALL.comercios, ALL.lugares,
        ALL.contenido, ALL.cultura, ALL.turismo, ALL.banners,
        ALL.metricas, ALL.metricasIn, ALL.tareas,
        ...adminExtras,
      ];
    case "Infraestructura":
      return [ALL.home, ALL.reclamos, ALL.equipo, ALL.tareas];
    case "Turismo":
      return [ALL.home, ALL.turismo, ALL.comercios, ALL.lugares, ALL.banners, ALL.equipo, ALL.tareas];
    case "Comercios":
      return [ALL.home, ALL.comercios, ALL.lugares, ALL.banners, ALL.equipo, ALL.tareas];
    case "Cultura":
      return [ALL.home, ALL.contenido, ALL.cultura, ALL.equipo, ALL.tareas];
    case "Deporte":
      return [ALL.home, ALL.contenido, ALL.deporte, ALL.equipo, ALL.tareas];
    default:
      return [ALL.home];
  }
}

export default function AdminShell({ children }: { children?: ReactNode }) {
  const { adminArea } = useRole();
  const { signOut, roles } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isMayor = roles.includes("mayor");
  const isAdmin = roles.includes("admin");
  const isTourism = roles.includes("tourism_chief");
  const items = menuFor(adminArea, isAdmin, isMayor, isTourism);
  const isaUnread = typeof window !== "undefined" && localStorage.getItem("muno.isa.report.unread") === "1";

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#F9FAFB" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[260px] shrink-0 text-white"
        style={{ background: "#242E44" }}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-isa-navy grid place-items-center font-extrabold">M</div>
            <div>
              <div className="font-display font-extrabold text-[15px] leading-tight">MUNO+ · Backoffice</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-0.5">Área · {adminArea}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {items.map((it) => {
            const isAnalytics = it.to === "/admin/metricas";
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px] font-bold transition-colors ${
                    isActive
                      ? "bg-white text-isa-navy shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <it.icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
                <span className="flex-1 truncate">{it.label}</span>
                {isAnalytics && isaUnread && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-isa-navy"
                    style={{ background: "linear-gradient(135deg,#F5C84B,#E0A93A)" }}>
                    ISA
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 space-y-2">
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft strokeWidth={1.5} className="w-4 h-4" /> Volver a la app
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5"
          >
            <LogOut strokeWidth={1.5} className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 px-6 flex items-center justify-between border-b bg-white shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            {pathname !== "/admin" && (
              <button
                onClick={() => nav(-1)}
                aria-label="Volver"
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-isa-navy text-white hover:opacity-90 transition-opacity"
              >
                <ArrowLeft strokeWidth={2} className="w-4 h-4" />
                <span className="text-[12px] font-bold pr-1 hidden sm:inline">Volver</span>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-isa-navy text-[18px] leading-tight truncate">
                {pageTitle(pathname)}
              </h1>
              <div className="text-[11px] text-muted-foreground truncate">{pageSubtitle(pathname)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isMayor && !isAdmin && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                Modo supervisión · solo lectura
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy bg-isa-light px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Acceso interno
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`max-w-7xl mx-auto ${isMayor && !isAdmin ? "mayor-readonly" : ""}`}>
            {(roles.includes("area_manager") || isTourism) && !isAdmin && !isMayor && (
              <div className="mb-4">
                <StaffNewsWidget />
              </div>
            )}
            {children ?? <Outlet />}
          </div>
          {isMayor && !isAdmin && (
            <style>{`
              .mayor-readonly input:not([data-allow-mayor]),
              .mayor-readonly textarea:not([data-allow-mayor]),
              .mayor-readonly select:not([data-allow-mayor]) { pointer-events: none; background-color: #f9fafb; }
              .mayor-readonly button[type="submit"]:not([data-allow-mayor]),
              .mayor-readonly button.bg-isa-navy:not([data-allow-mayor]),
              .mayor-readonly button.bg-muno-red:not([data-allow-mayor]),
              .mayor-readonly button.bg-muno-teal:not([data-allow-mayor]),
              .mayor-readonly button.bg-amber-400:not([data-allow-mayor]) {
                pointer-events: none !important;
                opacity: 0.45 !important;
                filter: grayscale(0.4);
              }
            `}</style>
          )}
        </main>

        <footer className="px-6 py-3 border-t bg-white text-center">
          <p className="text-[10px] text-muted-foreground">
            Auditoría Técnica y Análisis por <strong className="text-isa-navy">ISA Business Analyst</strong> · MUNO+ © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

function pageTitle(p: string) {
  if (p === "/admin") return "Panel Municipal";
  if (p.startsWith("/admin/reclamos")) return "Gestión de Reclamos";
  if (p.startsWith("/admin/comercios")) return "Habilitaciones · Comercios";
  if (p.startsWith("/admin/lugares")) return "Puntos de Interés";
  if (p.startsWith("/admin/cultura")) return "Inscripciones · Cultura";
  if (p.startsWith("/admin/deporte")) return "Inscripciones · Deporte";
  if (p.startsWith("/admin/contenido")) return "Agenda de Eventos";
  if (p.startsWith("/admin/banners")) return "Banners de la Home";
  if (p.startsWith("/admin/metricas")) return "Analítica · ISA Business Analyst";
  if (p.startsWith("/admin/tareas")) return "Tareas internas";
  if (p.startsWith("/admin/colaboradores")) return "Equipo";
  if (p.startsWith("/admin/usuarios")) return "Usuarios Municipales";
  if (p.startsWith("/admin/auditoria")) return "Auditoría · Trazabilidad";
  if (p.startsWith("/admin/configuracion")) return "Configuración del Municipio";
  return "Panel Municipal";
}
function pageSubtitle(p: string) {
  if (p === "/admin") return "Resumen ejecutivo del municipio.";
  if (p.startsWith("/admin/metricas")) return "Auditoría manual mensual elaborada por la consultora.";
  if (p.startsWith("/admin/comercios")) return "Monitoreo de vencimientos y habilitaciones.";
  if (p.startsWith("/admin/reclamos")) return "Bandeja de entrada y cierre con evidencia.";
  return "Backoffice MUNO+";
}
