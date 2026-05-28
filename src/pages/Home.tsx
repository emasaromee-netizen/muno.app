import { useRole } from "@/context/RoleContext";
import { useMunicipality } from "@/context/MunicipalityContext";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Music2, Trophy, AlertTriangle, Wifi, BedDouble, Store, BarChart3, ListTodo, Users, FileEdit, Megaphone, PhoneCall, MapPin, Settings, CalendarCheck } from "lucide-react";
import HomeBanners from "@/components/HomeBanners";
import VecinoHomeBlocks from "@/components/VecinoHomeBlocks";
import InternalAnnouncement from "@/components/InternalAnnouncement";
import MisReclamos from "@/components/MisReclamos";
import MisInscripciones from "@/components/MisInscripciones";
import { ZONES } from "@/data/mock";
import { track } from "@/lib/analytics";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const Tile = ({ to, icon: Icon, title, sub, color, onClick }: any) => {
  const isHash = typeof to === "string" && to.startsWith("#");
  const handleClick = (e: any) => {
    if (isHash) {
      e.preventDefault();
      const el = document.getElementById(to.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onClick?.(e);
  };
  return (
    <Link to={to} onClick={handleClick} className="isa-card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col gap-2">
      <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: color }}>
        <Icon strokeWidth={1.5} className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-[15px] font-extrabold text-isa-navy leading-tight">{title}</div>
        <div className="text-[12px] text-muted-foreground">{sub}</div>
      </div>
    </Link>
  );
};

const Metric = ({ label, value, hint }: any) => (
  <div className="isa-card p-4">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
    <div className="text-2xl font-extrabold text-isa-navy mt-0.5">{value}</div>
    {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
  </div>
);

export default function Home() {
  const { role, adminArea } = useRole();
  const { user } = useAuth();
  const { municipality, setMunicipality } = useMunicipality();
  const navigate = useNavigate();
  const [zone, setZone] = useState<string>(municipality || "");

  if (role === "admin") {
    // Vista enfocada por área (sin "Accesos Rápidos" generales)
    const SHORTCUTS: Record<string, { to: string; label: string; icon: any; color: string; sub: string }[]> = {
      Intendencia: [
        { to: "/admin/banners", label: "Banners Home", icon: Megaphone, color: "hsl(var(--muno-emerald))", sub: "Avisos y novedades" },
        { to: "/admin/metricas", label: "Métricas Turísticas", icon: BarChart3, color: "hsl(var(--muno-blue))", sub: "Reportes" },
        { to: "/admin/comercios", label: "Comercios", icon: Store, color: "hsl(var(--muno-amber))", sub: "Habilitaciones" },
        { to: "/admin/colaboradores", label: "Equipo", icon: Users, color: "hsl(var(--isa-navy))", sub: "Colaboradores" },
        { to: "/admin/contenido", label: "Contenido", icon: FileEdit, color: "hsl(var(--muno-teal))", sub: "Cargar" },
      ],
      Cultura: [
        { to: "/admin/cultura", label: "Inscripciones", icon: Music2, color: "hsl(var(--isa-navy))", sub: "Talleres" },
        { to: "/admin/contenido", label: "Cargar", icon: FileEdit, color: "hsl(var(--muno-teal))", sub: "Eventos" },
        { to: "/admin/tareas", label: "Tareas", icon: ListTodo, color: "hsl(var(--muno-blue))", sub: "Equipo" },
        { to: "/admin/area/Cultura", label: "Panel público", icon: FileEdit, color: "hsl(var(--muno-amber))", sub: "Editar" },
      ],
      Turismo: [
        { to: "/admin/lugares", label: "Lugares", icon: Compass, color: "hsl(var(--muno-blue))", sub: "Editar" },
        { to: "/admin/wifi", label: "WiFi", icon: Wifi, color: "hsl(var(--muno-teal))", sub: "Zonas" },
        { to: "/admin/contenido", label: "Cargar", icon: FileEdit, color: "hsl(var(--isa-navy))", sub: "Lugar" },
        { to: "/admin/tareas", label: "Tareas", icon: ListTodo, color: "hsl(var(--muno-amber))", sub: "Equipo" },
      ],
      Deporte: [
        { to: "/admin/deporte", label: "Actividades", icon: Trophy, color: "hsl(var(--muno-teal))", sub: "Inscriptos" },
        { to: "/admin/contenido", label: "Cargar", icon: FileEdit, color: "hsl(var(--isa-navy))", sub: "Actividad" },
        { to: "/admin/tareas", label: "Tareas", icon: ListTodo, color: "hsl(var(--muno-blue))", sub: "Equipo" },
      ],
      Infraestructura: [
        { to: "/admin/reclamos", label: "Reclamos", icon: AlertTriangle, color: "hsl(var(--muno-red))", sub: "Gestionar" },
        { to: "/admin/tareas", label: "Tareas", icon: ListTodo, color: "hsl(var(--muno-blue))", sub: "Cuadrillas" },
      ],
      Comercios: [
        { to: "/admin/comercios", label: "Habilitaciones", icon: Store, color: "hsl(var(--muno-amber))", sub: "Validar" },
        { to: "/admin/metricas", label: "Recaudación", icon: BarChart3, color: "hsl(var(--muno-teal))", sub: "Tasas" },
      ],
    };
    const tiles = SHORTCUTS[adminArea] || SHORTCUTS.Intendencia;

    return (
      <div className="space-y-6">
        <InternalAnnouncement />
        <section>
          <h2 className="mb-3">Resumen del día · {adminArea}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Reclamos activos" value="12" hint="+3 vs ayer" />
            <Metric label="Talleres llenos" value="85%" hint="2 de 4" />
            <Metric label="Inscriptos deporte" value="42" hint="esta semana" />
            <Metric label="Usuarios MUNO+" value="1.284" hint="+24 hoy" />
          </div>
        </section>
        <section>
          <h2 className="mb-3">{adminArea === "Intendencia" ? "Tu municipio" : `Área ${adminArea}`}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map((t) => <Tile key={t.to + t.label} {...t} title={t.label} />)}
          </div>
        </section>
      </div>
    );
  }

  const EmergencyFooter = () => (
    <section
      className="rounded-[16px] p-4 space-y-3"
      style={{ background: "#FEE2E2" }}
      aria-label="Emergencias"
    >
      <div className="flex items-center gap-2">
        <PhoneCall strokeWidth={1.5} className="w-5 h-5" style={{ color: "#7F1D1D" }} />
        <h3 className="font-extrabold text-[14px]" style={{ color: "#7F1D1D" }}>
          Emergencias 24hs
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href="tel:107"
          className="flex items-center justify-center gap-2 min-h-[44px] rounded-[12px] bg-white text-[13px] font-extrabold"
          style={{ color: "#7F1D1D" }}
        >
          <PhoneCall strokeWidth={1.5} className="w-4 h-4" /> Hospital · 107
        </a>
        <a
          href="tel:911"
          className="flex items-center justify-center gap-2 min-h-[44px] rounded-[12px] bg-white text-[13px] font-extrabold"
          style={{ color: "#7F1D1D" }}
        >
          <PhoneCall strokeWidth={1.5} className="w-4 h-4" /> Policía · 911
        </a>
      </div>
    </section>
  );

  if (role === "encargado_comercio") {
    return (
      <div className="space-y-6">
        <section className="isa-card p-5 bg-gradient-to-br from-isa-navy to-[#1a2236]">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Encargado de Comercios</div>
          <h2 className="!text-white text-[20px] font-extrabold mt-2">Validá habilitaciones y recaudación.</h2>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Tile to="/admin/comercios" icon={Store} title="Comercios" sub="Habilitar y validar" color="hsl(var(--muno-amber))" />
          <Tile to="/admin/metricas" icon={BarChart3} title="Recaudación" sub="Tasas y multas" color="hsl(var(--muno-teal))" />
        </div>
      </div>
    );
  }

  const isTurista = role === "turista";

  return (
    <div className="space-y-6">
      {isTurista ? <HomeBanners audience="turista" /> : <VecinoHomeBlocks />}

      {isTurista && (
        <section className="isa-card p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
            Bienvenido viajero
          </div>
          <h2 className="text-isa-navy font-display text-[20px] font-extrabold mt-1 leading-tight">
            Descubrí San Luis a tu ritmo
          </h2>
          <div className="mt-3 bg-isa-light rounded-[16px] p-3 flex items-center gap-2">
            <MapPin strokeWidth={1.5} className="w-4 h-4 text-isa-navy shrink-0" />
            <select
              value={zone}
              onChange={(e) => {
                const v = e.target.value;
                setZone(v);
                if (v) {
                  setMunicipality(v);
                  track({ kind: "search_zone", zone: v, userType: "turista" });
                }
              }}
              className="flex-1 bg-transparent text-sm font-bold text-isa-navy outline-none"
            >
              <option value="">Buscar municipio</option>
              {ZONES.filter((z) => z !== "Todas").map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3">¿Qué querés hacer hoy?</h2>
        <div className="grid grid-cols-2 gap-3">
          {isTurista ? (
            <>
              <Tile to="/turismo" icon={Compass} title="Turismo" sub="Comercio · Gastronomía · Hospedaje" color="hsl(var(--muno-blue))" onClick={() => track({ kind: "category_click", category: "Turismo", userType: "turista" })} />
              <Tile to="/lugares" icon={MapPin} title="Lugares" sub="Naturaleza y Cultura" color="hsl(var(--isa-navy))" onClick={() => track({ kind: "category_click", category: "Lugares", userType: "turista" })} />
              <Tile to="/eventos" icon={Music2} title="Eventos" sub="Agenda del mes" color="hsl(var(--muno-amber))" onClick={() => track({ kind: "category_click", category: "Eventos", userType: "turista" })} />
              <Tile to="/wifi-access" icon={Wifi} title="WiFi" sub="Conectate gratis" color="hsl(var(--muno-teal))" onClick={() => track({ kind: "category_click", category: "WiFi", userType: "turista" })} />
            </>
          ) : (
            <>
              <Tile to="/reclamos" icon={AlertTriangle} title="Reportar incidencia" sub="En 4 pasos" color="hsl(var(--muno-red))" />
              <Tile to="/guia-vecinal" icon={Compass} title="Guía Útil Vecinal" sub="Comercios, Delivery y Farmacias" color="hsl(var(--muno-blue))" />
              <Tile to="/cultura" icon={Music2} title="Cultura" sub="Talleres y eventos" color="hsl(var(--isa-navy))" />
              <Tile to="/deporte" icon={Trophy} title="Deporte" sub="Inscribirme" color="hsl(var(--muno-teal))" />
              <Tile to="#mis-inscripciones" icon={CalendarCheck} title="Mis Inscripciones" sub="Talleres y eventos" color="hsl(var(--muno-amber))" />
            </>
          )}
          {role === "comercio" && (
            <Tile to="/mi-comercio" icon={Store} title="Mi Comercio" sub="Estado y reservas" color="hsl(var(--muno-blue))" />
          )}
        </div>
      </section>

      {(role === "vecino" || role === "comercio" || !!user) && (
        <>
          <MisReclamos />
          <div id="mis-inscripciones" className="scroll-mt-20">
            <MisInscripciones />
          </div>
        </>
      )}

      <EmergencyFooter />
    </div>
  );
}
