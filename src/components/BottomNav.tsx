import { NavLink } from "react-router-dom";
import { Home, Compass, Music2, Trophy, AlertTriangle, Store, Settings, LayoutDashboard, Users, BarChart3, Wifi, PhoneCall } from "lucide-react";
import { useRole, type Role } from "@/context/RoleContext";

const NAV: Record<Role, { to: string; label: string; icon: any }[]> = {
  admin: [
    { to: "/admin", label: "Inicio", icon: LayoutDashboard },
    { to: "/admin/metricas", label: "Métricas", icon: BarChart3 },
    { to: "/admin/comercios", label: "Comercios", icon: Store },
    { to: "/admin/colaboradores", label: "Equipo", icon: Users },
  ],
  vecino: [
    { to: "/", label: "Inicio", icon: Home },
    { to: "/reclamos", label: "Reclamos", icon: AlertTriangle },
    { to: "/mi-comercio", label: "Comercio", icon: Store },
    { to: "/mi-cuenta", label: "Perfil", icon: Settings },
  ],
  turista: [
    { to: "/", label: "Explorar", icon: Compass },
    { to: "/wifi-access", label: "WiFi", icon: Wifi },
    { to: "/emergencias", label: "Emergencias", icon: PhoneCall },
  ],
  comercio: [
    { to: "/", label: "Inicio", icon: Home },
    { to: "/mi-comercio", label: "Comercio", icon: Store },
    { to: "/reclamos", label: "Reclamos", icon: AlertTriangle },
    { to: "/mi-cuenta", label: "Perfil", icon: Settings },
  ],
  encargado_comercio: [
    { to: "/admin/comercios", label: "Comercios", icon: Store },
    { to: "/admin/metricas", label: "Recaudación", icon: BarChart3 },
    { to: "/mi-cuenta", label: "Cuenta", icon: Settings },
  ],
};

export default function BottomNav() {
  const { role } = useRole();
  const items = NAV[role];

  return (
    <nav className="shrink-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/" || it.to === "/admin"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
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
