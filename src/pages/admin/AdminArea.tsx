import { useParams, Link } from "react-router-dom";
import { type Area } from "@/data/mock";
import { Music2, Compass, Trophy, AlertTriangle, Users, FileEdit, Layout, Store } from "lucide-react";

const ICONS: Record<Area, any> = { Cultura: Music2, Turismo: Compass, Deporte: Trophy, Infraestructura: AlertTriangle, Comercios: Store };
const COLORS: Record<Area, string> = { Cultura: "hsl(var(--isa-navy))", Turismo: "hsl(var(--muno-blue))", Deporte: "hsl(var(--muno-teal))", Infraestructura: "hsl(var(--muno-red))", Comercios: "hsl(var(--muno-amber))" };

const SHORTCUTS: Record<Area, { to: string; label: string }[]> = {
  Cultura: [{ to: "/admin/cultura", label: "Inscripciones" }, { to: "/admin/contenido", label: "Cargar evento/taller" }, { to: "/admin/tareas", label: "Tareas internas" }],
  Turismo: [{ to: "/admin/lugares", label: "Lugares" }, { to: "/admin/wifi", label: "Zonas WiFi" }, { to: "/admin/contenido", label: "Cargar lugar" }, { to: "/admin/tareas", label: "Tareas internas" }],
  Deporte: [{ to: "/admin/deporte", label: "Actividades" }, { to: "/admin/contenido", label: "Cargar actividad" }, { to: "/admin/tareas", label: "Tareas internas" }],
  Infraestructura: [{ to: "/admin/reclamos", label: "Reclamos" }, { to: "/admin/tareas", label: "Tareas internas" }],
  Comercios: [{ to: "/admin/comercios", label: "Habilitaciones" }, { to: "/admin/tareas", label: "Tareas internas" }],
};

export default function AdminArea() {
  const { area } = useParams();
  const a = (area as Area) || "Cultura";
  const Icon = ICONS[a] || Music2;

  return (
    <div className="space-y-5">
      <div className="isa-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-white" style={{ background: COLORS[a] }}>
          <Icon strokeWidth={1.5} className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h2 className="text-isa-navy">Área · {a}</h2>
          <p className="text-xs text-muted-foreground">Panel editable. Modificá tu información pública.</p>
        </div>
      </div>

      <section>
        <h3 className="mb-2">Acciones del área</h3>
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS[a].map((s) => (
            <Link key={s.to + s.label} to={s.to} className="isa-card p-4 hover:shadow-md transition-all flex items-center gap-3">
              <FileEdit className="w-5 h-5 text-isa-navy" />
              <span className="font-bold text-sm text-isa-navy">{s.label}</span>
            </Link>
          ))}
          <Link to="/admin/colaboradores" className="isa-card p-4 hover:shadow-md transition-all flex items-center gap-3">
            <Users className="w-5 h-5 text-isa-navy" /><span className="font-bold text-sm text-isa-navy">Colaboradores</span>
          </Link>
        </div>
      </section>

      <section className="isa-card p-5">
        <div className="flex items-center gap-2 mb-3"><Layout className="w-4 h-4 text-isa-navy" /><h3>Panel público del área</h3></div>
        <PanelEditor area={a} />
      </section>
    </div>
  );
}

import { useState } from "react";

function PanelEditor({ area }: { area: Area }) {
  const [title, setTitle] = useState(`${area} · San Luis`);
  const [body, setBody] = useState(`Información oficial del área de ${area}. Editable por encargados.`);
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none" />
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500); }} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm">{saved ? "✓ Publicado" : "Publicar cambios"}</button>
    </div>
  );
}
