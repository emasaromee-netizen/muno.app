import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { ArrowLeft } from "lucide-react";
import { ROLE_LABEL, useRole, type AdminArea } from "@/context/RoleContext";
import NotificationsBell from "./NotificationsBell";
import FullscreenToggle from "./FullscreenToggle";

const TITLES: Record<string, string> = {
  "/": "Inicio",
  "/turismo": "Turismo",
  "/eventos": "Eventos",
  "/wifi-access": "WiFi Municipal",
  "/lugares": "Lugares",
  "/cultura": "Cultura",
  "/deporte": "Deporte",
  "/guia-vecinal": "Guía Útil Vecinal",
  "/emergencias": "Emergencias",
  "/reclamos": "Reclamos",
  "/mi-cuenta": "Mi cuenta",
  "/mi-comercio": "Mi Comercio",
  "/admin": "Panel Municipal",
  "/admin/lugares": "Gestión de Lugares",
  "/admin/wifi": "Zonas WiFi",
  "/admin/deporte": "Actividades Deportivas",
  "/admin/cultura": "Inscripciones Cultura",
  "/admin/reclamos": "Reclamos",
  "/admin/colaboradores": "Colaboradores",
  "/admin/contenido": "Carga de Contenido",
  "/admin/comercios": "Gestión de Comercios",
  "/admin/metricas": "Métricas Turísticas",
  "/admin/tareas": "Tareas internas",
  "/admin/banners": "Banners del Home",
};
const matchTitle = (path: string) => {
  if (TITLES[path]) return TITLES[path];
  if (path.startsWith("/admin/area/")) return `Área · ${decodeURIComponent(path.split("/").pop() || "")}`;
  if (path.startsWith("/reclamos/")) return "Detalle de Reclamo";
  if (path.startsWith("/admin/reclamos/")) return "Gestionar Reclamo";
  return "MUNO+";
};

const ADMIN_AREAS: AdminArea[] = ["Intendencia", "Cultura", "Turismo", "Deporte", "Infraestructura", "Comercios"];

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role, adminArea, setAdminArea } = useRole();
  const title = matchTitle(pathname);
  const showBack = pathname !== "/" && pathname !== "/admin";
  const isAdmin = role === "admin";
  const [mobile, setMobile] = useState(false);

  return (
    <div className="min-h-screen w-full bg-isa-light">
      {isAdmin && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <div className="bg-card border rounded-full p-1 flex shadow-md text-xs font-bold">
            <button onClick={() => setMobile(false)} className={`px-3 py-1 rounded-full ${!mobile ? "bg-isa-navy text-isa-white" : "text-isa-navy"}`}>🖥️ Web</button>
            <button onClick={() => setMobile(true)} className={`px-3 py-1 rounded-full ${mobile ? "bg-isa-navy text-isa-white" : "text-isa-navy"}`}>📱 Móvil</button>
          </div>
          <select value={adminArea} onChange={(e) => setAdminArea(e.target.value as AdminArea)} className="bg-card border rounded-full px-3 py-1.5 text-xs font-bold text-isa-navy shadow-md">
            {ADMIN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
      <div className={isAdmin && !mobile ? "w-full max-w-7xl mx-auto flex flex-col min-h-screen pt-14" : "phone-frame flex flex-col"}>
        <header className="h-14 px-4 flex items-center justify-between border-b bg-card shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-isa-navy text-isa-white hover:opacity-90 transition-opacity min-w-[44px]"
                aria-label="Volver"
              >
                <ArrowLeft strokeWidth={2} className="w-4 h-4" />
                <span className="text-[12px] font-bold pr-1 hidden sm:inline">Volver</span>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-isa-navy text-isa-white grid place-items-center font-extrabold text-sm">M</div>
            )}
            <h1 className="text-[18px] font-extrabold text-isa-navy truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <FullscreenToggle />
            {!isAdmin && <NotificationsBell />}
            <span className="isa-chip bg-accent text-isa-navy">{ROLE_LABEL[role]}{isAdmin ? ` · ${adminArea}` : ""}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 animate-fade-in">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      
    </div>
  );
}
