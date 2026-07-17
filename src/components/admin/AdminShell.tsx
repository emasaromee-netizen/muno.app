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

import { useAuth } from "@/context/AuthContext";
import StaffNewsWidget from "./StaffNewsWidget";
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";
import type { LucideIcon } from "lucide-react";

type Item = {
  to: string;
  label: string;
  icon: LucideIcon;
};

// Extraemos el tipo estricto que espera la función can() de forma automática
type AppRoles = Parameters<typeof can>[0];

// Generación dinámica de menú basada estrictamente en PERMISOS, no en roles hardcodeados.
function generateMenu(roles: string[], area: string): Item[] {
  const menu: Item[] = [];
  
  // Casteo seguro de TypeScript: Le garantizamos al compilador que este array de strings
  // contiene los roles oficiales de la app para que la función can() no arroje error.
  const safeRoles = roles as AppRoles;

  // Módulo Global ISA
  if (can(safeRoles, area, PERMISSIONS.ANALYTICS_VIEW) && (roles.includes("isa_super_admin") || roles.includes("isa_consultant"))) {
    return [{ to: "/isa/panel", label: "Panel ISA", icon: BarChart3 }];
  }

  // Dashboard General (Todos los internos lo ven)
  menu.push({ to: "/admin", label: "Inicio", icon: LayoutDashboard });

  // Intendente Dashboard Ejecutivo
  if (roles.includes("mayor")) {
    menu.push({ to: "/admin/dashboard-intendente", label: "Dashboard Ejecutivo", icon: LayoutDashboard });
  }

  // Módulo de Reclamos
  if (can(safeRoles, area, PERMISSIONS.TASKS_MANAGE)) {
    menu.push({ to: "/admin/reclamos", label: "Gestión de Reclamos", icon: AlertTriangle });
  }

  // Módulo de Hacienda / Comercios
  if (can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN) || area === "Hacienda" || area === "Comercios" || area === "Intendencia") {
    menu.push({ to: "/admin/hacienda", label: "Hacienda", icon: Wallet });
    menu.push({ to: "/admin/comercios", label: "Habilitaciones", icon: Store });
  }

  // Módulo de Turismo e Interés
  if (can(safeRoles, area, PERMISSIONS.CONTENT_CREATE) && (area === "Turismo" || area === "Intendencia" || can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN))) {
    menu.push({ to: "/admin/guia-turista", label: "Guía Turista", icon: MapPin });
    menu.push({ to: "/admin/lugares", label: "Puntos de Interés", icon: MapPin });
  }

  // Módulo de Cultura / Deportes / Eventos
  if (can(safeRoles, area, PERMISSIONS.CONTENT_CREATE)) {
    if (area === "Cultura" || can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN) || area === "Intendencia") {
      menu.push({ to: "/admin/cultura", label: "Inscripciones Cultura", icon: Users });
    }
    if (area === "Deporte" || can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN) || area === "Intendencia") {
      menu.push({ to: "/admin/deporte", label: "Inscripciones Deporte", icon: ListTodo });
    }
    menu.push({ to: "/admin/contenido", label: "Agenda de Eventos", icon: CalendarDays });
  }

  // Módulo Administrativo y Configuración (Solo Admins)
  if (can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN)) {
    menu.push({ to: "/admin/banners", label: "Banners Home", icon: Megaphone });
    menu.push({ to: "/admin/novedades", label: "Novedades para Jefes", icon: Megaphone });
    menu.push({ to: "/admin/usuarios", label: "Gestión de Gabinete", icon: Users });
    menu.push({ to: "/admin/auditoria", label: "Auditoría", icon: ScrollText });
    menu.push({ to: "/admin/configuracion", label: "Configuración", icon: Settings });
  }

  // Módulo de Equipo (Casi todos los jefes)
  if (can(safeRoles, area, PERMISSIONS.USERS_VIEW_ALL)) {
    menu.push({ to: "/admin/colaboradores", label: "Mi Equipo", icon: Users });
  }

  // Módulo Analítica
  if (can(safeRoles, area, PERMISSIONS.ANALYTICS_VIEW)) {
    menu.push({ to: "/admin/metricas", label: "Analítica ISA", icon: BarChart3 });
    if (can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN)) {
      menu.push({ to: "/admin/metricas/cargar", label: "Cargar métricas ISA", icon: FileEdit });
    }
  }

  return menu;
}

export default function AdminShell({ children }: { children?: ReactNode }) {
  const { signOut, roles, area } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const safeRoles = roles as AppRoles;
  const isMayor = roles.includes("mayor");
  const isAdmin = can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN);

  // Determinación de etiqueta visual del área
  const visualArea = roles.includes("isa_super_admin") || roles.includes("isa_consultant")
    ? "ISA" : roles.includes("mayor") ? "Intendencia" : area || "Área General";

  const items = generateMenu(roles, area);

  // Mitigación L-05: Verificación dinámica por ID
  const lastReadId = typeof window !== "undefined" ? localStorage.getItem("muno.isa.report.last_read_id") : null;
  const isaUnread = lastReadId === null;

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#F9FAFB" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 text-white" style={{ background: "#242E44" }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-isa-navy grid place-items-center font-extrabold">M</div>
            <div>
              <div className="font-display font-extrabold text-[15px] leading-tight">MUNO+ · Backoffice</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-0.5">
                {visualArea === "ISA" ? "ISA BUSINESS ANALYST" : `Área · ${visualArea}`}
              </div>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 flex items-center justify-between border-b bg-white shrink-0">
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
                Modo supervisión · Solo lectura
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy bg-isa-light px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Acceso interno
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {can(safeRoles, area, PERMISSIONS.CONTENT_CREATE) && !isAdmin && !isMayor && (
              <div className="mb-4">
                <StaffNewsWidget />
              </div>
            )}
            {children ?? <Outlet />}
          </div>
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
  if (p.startsWith("/isa")) return "ISA Business Analyst";
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
  if (p.startsWith("/isa")) return "Panel global de municipios.";
  if (p === "/admin") return "Resumen ejecutivo del municipio.";
  if (p.startsWith("/admin/metricas")) return "Auditoría manual mensual elaborada por la consultora.";
  if (p.startsWith("/admin/comercios")) return "Monitoreo de vencimientos y habilitaciones.";
  if (p.startsWith("/admin/reclamos")) return "Bandeja de entrada y cierre con evidencia.";
  return "Backoffice MUNO+";
}