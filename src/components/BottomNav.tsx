import { NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  AlertTriangle,
  Store,
  Settings,
  LayoutDashboard,
  BarChart3,
  Wifi,
  PhoneCall,
  CalendarDays,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";

type AppRoles = Parameters<typeof can>[0];

export default function BottomNav() {
  const { roles, area } = useAuth();
  
  // Casteo seguro para el motor de permisos
  const safeRoles = roles as AppRoles;

  let items: {
    to: string;
    label: string;
    icon: LucideIcon;
  }[] = [];

  // 1. ISA Consultant / Super Admin
  if (roles.includes("isa_super_admin") || roles.includes("isa_consultant")) {
    items = [
      { to: "/isa/global", label: "Panel Global", icon: LayoutDashboard },
      { to: "/mi-cuenta", label: "Perfil", icon: Settings },
    ];
  }

  // 2. Personal del Gabinete Municipal (Admins, Intendente, Jefes)
  else if (
    roles.includes("admin") ||
    roles.includes("mayor") ||
    roles.includes("tourism_chief") ||
    roles.includes("area_manager")
  ) {
    // Todos ven el inicio
    items.push({ to: "/admin", label: "Inicio", icon: LayoutDashboard });

    // Solo quienes tienen acceso analítico ven Métricas (Admin e Intendente)
    if (can(safeRoles, area, PERMISSIONS.ANALYTICS_VIEW)) {
      items.push({ to: "/admin/metricas", label: "Métricas", icon: BarChart3 });
    }

    // Solo Admins, Hacienda, Intendencia o Turismo ven Comercios
    if (can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN) || area === "Hacienda" || area === "Turismo" || area === "Intendencia") {
      items.push({ to: "/admin/comercios", label: "Comercios", icon: Store });
    }

    // Jefes de Cultura o Deportes ven directamente la Agenda en su panel móvil en lugar de Comercios
    if (area === "Cultura" || area === "Deporte") {
      items.push({ to: "/admin/contenido", label: "Agenda", icon: CalendarDays });
    }

    // Todos ven el perfil
    items.push({ to: "/mi-cuenta", label: "Perfil", icon: Settings });
  }

  // 3. Vecino Registrado
  else if (roles.includes("resident")) {
    items = [
      { to: "/", label: "Inicio", icon: Home },
      { to: "/reclamos", label: "Reclamos", icon: AlertTriangle },
      { to: "/mi-cuenta", label: "Perfil", icon: Settings },
    ];
  }

  // 4. Turista (Navegación Pública)
  else {
    items = [
      { to: "/", label: "Explorar", icon: Compass },
      { to: "/wifi-access", label: "WiFi", icon: Wifi },
      { to: "/emergencias", label: "Emergencias", icon: PhoneCall },
    ];
  }

  return (
    <nav className="shrink-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        }}
      >
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/" || it.to === "/admin"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              }`
            }
          >
            <it.icon strokeWidth={1.5} className="w-5 h-5" />
            <span className="text-[10px] font-bold">{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}