import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type Claim = {
  id: string;
  category: string;
  status: string;
  created_at: string;
  description: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  "Pendiente": "Pendiente de revisión",
  "En curso": "En curso",
  "Cerrado": "Resuelto",
};
const STATUS_STYLE: Record<string, string> = {
  "Pendiente": "bg-muno-amber/15 text-[hsl(var(--muno-amber))]",
  "En curso": "bg-muno-blue/15 text-muno-blue",
  "Cerrado": "bg-muno-teal/15 text-muno-teal",
};

export default function MisReclamos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("claims")
      .select("id,category,status,created_at,description")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setItems((data as Claim[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2>Mis Incidentes</h2>
        <Link to="/reclamos" className="text-xs font-bold text-muno-blue">+ Nuevo</Link>
      </div>
      {loading ? (
        <div className="isa-card p-6 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="isa-card p-6 text-center text-sm text-muted-foreground">
          Aún no enviaste reclamos. Tocá <b>+ Nuevo</b> para reportar un incidente.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const short = c.id.slice(0, 4).toUpperCase();
            const date = new Date(c.created_at).toLocaleDateString("es-AR");
            return (
              <Link
                key={c.id}
                to={`/reclamos/${encodeURIComponent(c.id)}`}
                className="isa-card p-3 flex items-center gap-3 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-isa-navy text-sm truncate">#MUNO-{short}</div>
                  <div className="text-xs text-muted-foreground">{c.category} · {date}</div>
                </div>
                <span className={`isa-chip ${STATUS_STYLE[c.status] || ""}`}>
                  {STATUS_LABEL[c.status] || c.status}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
