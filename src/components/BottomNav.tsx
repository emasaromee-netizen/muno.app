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
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const { roles } = useAuth();

  let items: {
  to: string;
  label: string;
  icon: LucideIcon;
}[];

  // ISA
  if (roles.includes("isa_super_admin")) {
  items = [
    {
      to: "/isa/global",
      label: "Panel",
      icon: LayoutDashboard,
    },
    {
      to: "/mi-cuenta",
      label: "Perfil",
      icon: Settings,
    },
  ];
}

else if (roles.includes("isa_consultant")) {
  items = [
    {
      to: "/isa/panel",
      label: "Panel",
      icon: LayoutDashboard,
    },
    {
      to: "/mi-cuenta",
      label: "Perfil",
      icon: Settings,
    },
  ];
}

  // Municipalidad
  else if (
    roles.includes("admin") ||
    roles.includes("mayor") ||
    roles.includes("tourism_chief") ||
    roles.includes("area_manager")
  ) {
    items = [
      {
        to: "/admin",
        label: "Inicio",
        icon: LayoutDashboard,
      },
      {
        to: "/admin/metricas",
        label: "Métricas",
        icon: BarChart3,
      },
      {
        to: "/admin/comercios",
        label: "Comercios",
        icon: Store,
      },
      {
        to: "/mi-cuenta",
        label: "Perfil",
        icon: Settings,
      },
    ];
  }

  // Vecino
  else if (roles.includes("resident")) {
    items = [
      {
        to: "/",
        label: "Inicio",
        icon: Home,
      },
      {
        to: "/reclamos",
        label: "Reclamos",
        icon: AlertTriangle,
      },
      {
        to: "/mi-cuenta",
        label: "Perfil",
        icon: Settings,
      },
    ];
  }

  // Turista
  else {
    items = [
      {
        to: "/",
        label: "Explorar",
        icon: Compass,
      },
      {
        to: "/wifi-access",
        label: "WiFi",
        icon: Wifi,
      },
      {
        to: "/emergencias",
        label: "Emergencias",
        icon: PhoneCall,
      },
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