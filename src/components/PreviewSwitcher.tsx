import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCog, Check, X, EyeOff } from "lucide-react";
import { usePreview, PreviewRole } from "@/context/PreviewContext";
import { useRole, type AdminArea } from "@/context/RoleContext";

type Opt = {
  id: PreviewRole;
  label: string;
  sub: string;
  route: string;
  appRole: any;
  area?: AdminArea;
};

const OPTIONS: Opt[] = [
  { id: "turista",   label: "Turista",     sub: "Sin login",                  route: "/",                  appRole: "turista" },
  { id: "vecino",    label: "Vecino",      sub: "Incluye Comercio",           route: "/",                  appRole: "vecino"  },
  { id: "intendente",            label: "Intendente",          sub: "Acceso completo",       route: "/admin/dashboard", appRole: "admin", area: "Intendencia" },
  { id: "jefe_infraestructura",  label: "Jefe Infraestructura", sub: "Reclamos / Obras",     route: "/admin/dashboard", appRole: "admin", area: "Infraestructura" },
  { id: "jefe_cultura",          label: "Jefe Cultura",        sub: "Eventos / Inscripciones", route: "/admin/dashboard", appRole: "admin", area: "Cultura" },
  { id: "jefe_deporte",          label: "Jefe Deportes",       sub: "Inscripciones / Agenda", route: "/admin/dashboard", appRole: "admin", area: "Deporte" },
  { id: "municipio", label: "Municipio (legacy)", sub: "Vista clásica",        route: "/admin/dashboard",   appRole: "admin", area: "Intendencia" },
  { id: "isa",       label: "ISA Global",  sub: "Super Administrador",        route: "/isa/global",        appRole: "admin"   },
];

const VISIBILITY_KEY = "muno.preview.hidden";

export default function PreviewSwitcher() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => localStorage.getItem(VISIBILITY_KEY) === "1");
  const { preview, setPreview } = usePreview();
  const { setRole, setAdminArea } = useRole();
  const navigate = useNavigate();

  const forced = typeof window !== "undefined" && localStorage.getItem("muno.preview.force") === "1";
  if (!import.meta.env.DEV && !forced) return null;
  if (hidden) return null;

  const select = (opt: Opt) => {
    setPreview(opt.id);
    setRole(opt.appRole);
    if (opt.area) setAdminArea(opt.area);
    setOpen(false);
    navigate(opt.route);
  };

  const hideDemo = () => {
    localStorage.setItem(VISIBILITY_KEY, "1");
    setPreview(null);
    setHidden(true);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-3 right-3 z-[100] h-9 w-9 rounded-full bg-isa-navy text-white shadow-lg grid place-items-center hover:scale-105 transition opacity-80 hover:opacity-100"
        aria-label="Modo Demo"
        title="Modo Demo"
      >
        <UserCog className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[99] bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="absolute top-14 right-3 w-72 max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-2 border border-isa-navy/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold text-isa-navy uppercase tracking-[0.2em]">
                Modo Demo
              </span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {OPTIONS.map((opt) => {
              const active = preview === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => select(opt)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left ${
                    active ? "bg-isa-navy text-white" : "hover:bg-isa-light text-isa-navy"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight">{opt.label}</div>
                    <div className={`text-[11px] leading-tight ${active ? "text-white/80" : "text-muted-foreground"}`}>
                      {opt.sub}
                    </div>
                  </div>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}

            <div className="border-t border-isa-navy/10 mt-1 pt-1">
              <button
                onClick={hideDemo}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-muted-foreground hover:bg-isa-light"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Ocultar Demo (probar registro real)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
