import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Megaphone, Users, Wallet, AlertTriangle, BarChart3, Send, Loader2, Activity, Clock, FileText, MapPin, Heart, TrendingUp } from "lucide-react";
import { CLAIM_AREAS } from "@/data/mock";
import MayorFullscreen from "@/components/MayorFullscreen";

type Audience = "residents" | "tourists" | "both";

function SelectorAudienciaBanner() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<Audience>("residents");
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Completá título y descripción");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      description: description.trim(),
      audience,
      color: "navy",
      enabled: true,
      tags: ["intendente"],
    } as any);
    setSaving(false);
    if (error) {
      toast.error("No se pudo publicar: " + error.message);
      return;
    }
    toast.success(`Banner publicado (${audience})`);
    setTitle("");
    setDescription("");
  };

  const opts: { id: Audience; label: string; hint: string }[] = [
    { id: "residents", label: "Vecino", hint: "Visible para residentes" },
    { id: "tourists", label: "Turista", hint: "Visible solo para turistas" },
    { id: "both", label: "Ambos", hint: "Vecinos + turistas" },
  ];

  return (
    <div className="bg-white rounded-[16px] border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-isa-navy" />
        <h3 className="font-extrabold text-isa-navy text-sm">Publicar Banner Home</h3>
      </div>

      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Destino</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {opts.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setAudience(o.id)}
              className={`p-3 rounded-xl border text-left transition-all opacity-100 ${
                audience === o.id ? "bg-isa-navy text-white border-isa-navy" : "bg-white text-isa-navy hover:border-isa-navy/40"
              }`}
            >
              <div className="text-[13px] font-extrabold">{o.label}</div>
              <div className={`text-[10px] mt-0.5 ${audience === o.id ? "text-white/70" : "text-muted-foreground"}`}>{o.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del banner"
        className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Mensaje a publicar"
        className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none"
      />

      <button
        onClick={publish}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold opacity-100 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Publicar banner
      </button>
    </div>
  );
}

const Stat = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white rounded-[16px] border p-4">
    <div className="flex items-center justify-between">
      <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">{label}</div>
      <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: color + "15", color }}>
        <Icon strokeWidth={1.5} className="w-[18px] h-[18px]" />
      </div>
    </div>
    <div className="font-display text-[26px] font-extrabold text-isa-navy mt-2 leading-none">{value}</div>
  </div>
);

type ClaimRow = {
  id: string;
  area: string | null;
  status: "Pendiente" | "En curso" | "Cerrado";
  created_at: string;
  resolved_at: string | null;
  category: string;
  description: string | null;
  resolution_note: string | null;
};

const STATUS_DOT: Record<string, string> = {
  Pendiente: "bg-red-500",
  "En curso": "bg-amber-400",
  Cerrado: "bg-emerald-500",
};

function AnalisisDeGestion() {
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    supabase
      .from("claims")
      .select("id,area,status,created_at,resolved_at,category,description,resolution_note")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setRows((data as ClaimRow[]) || []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const byArea: Record<string, { total: number; pendientes: number; cerrados: number; totalHrs: number; count: number }> = {};
    for (const a of CLAIM_AREAS) byArea[a] = { total: 0, pendientes: 0, cerrados: 0, totalHrs: 0, count: 0 };
    for (const r of rows) {
      const a = (r.area as string) || "Sin área";
      if (!byArea[a]) byArea[a] = { total: 0, pendientes: 0, cerrados: 0, totalHrs: 0, count: 0 };
      byArea[a].total++;
      if (r.status === "Pendiente" || r.status === "En curso") byArea[a].pendientes++;
      if (r.status === "Cerrado" && r.resolved_at) {
        byArea[a].cerrados++;
        const hrs = (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 36e5;
        byArea[a].totalHrs += hrs;
        byArea[a].count++;
      }
    }
    let topPend: { area: string; n: number } = { area: "—", n: 0 };
    let bestAvgHrs = 0;
    let allHrs = 0;
    let allCount = 0;
    for (const [area, s] of Object.entries(byArea)) {
      if (s.pendientes > topPend.n) topPend = { area, n: s.pendientes };
      allHrs += s.totalHrs;
      allCount += s.count;
    }
    bestAvgHrs = allCount ? allHrs / allCount : 0;
    return { byArea, topPend, avgHrs: bestAvgHrs };
  }, [rows]);

  const filtered = filter ? rows.filter((r) => r.area === filter) : rows;
  const maxBar = Math.max(1, ...Object.values(stats.byArea).map((s) => s.total));

  return (
    <section className="bg-white rounded-[16px] border p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-isa-navy" />
        <h3 className="font-extrabold text-isa-navy text-sm">Análisis de Gestión por Área</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border p-4 bg-red-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Área con más pendientes</div>
          <div className="font-display font-extrabold text-isa-navy text-xl mt-1">{stats.topPend.area}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{stats.topPend.n} reclamos sin resolver</div>
        </div>
        <div className="rounded-xl border p-4 bg-emerald-500/5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Tiempo promedio de respuesta</div>
          <div className="font-display font-extrabold text-isa-navy text-xl mt-1">
            {stats.avgHrs > 0 ? `${stats.avgHrs.toFixed(1)} hs` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Promedio entre todas las áreas</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-muted-foreground mb-2">Reclamos por área</div>
        <div className="space-y-1.5">
          {Object.entries(stats.byArea).map(([area, s]) => (
            <button
              key={area}
              onClick={() => setFilter(filter === area ? "" : area)}
              className={`w-full text-left p-2 rounded-lg transition-colors ${filter === area ? "bg-isa-navy/5 ring-1 ring-isa-navy" : "hover:bg-muted/40"}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-isa-navy">{area}</span>
                <span className="text-muted-foreground">{s.pendientes} pend · {s.cerrados} cerrados · {s.total} total</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-isa-navy" style={{ width: `${(s.total / maxBar) * 100}%` }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-muted-foreground">
            Vista espejo {filter && `· filtrado por ${filter}`}
          </div>
          {filter && (
            <button onClick={() => setFilter("")} className="text-[11px] font-bold text-muno-blue">Quitar filtro</button>
          )}
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground py-4 text-center inline-flex items-center gap-2 justify-center w-full">
            <Loader2 className="w-3 h-3 animate-spin" /> Cargando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center border rounded-lg">Sin reclamos.</div>
        ) : (
          <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
            {filtered.slice(0, 30).map((r) => (
              <div key={r.id} className="p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-isa-navy">#MUNO-{r.id.slice(0, 4).toUpperCase()} · {r.category}</div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status]}`} /> {r.status}
                  </span>
                </div>
                <div className="text-muted-foreground mt-0.5">Área: {r.area || "—"} · {new Date(r.created_at).toLocaleDateString("es-AR")}</div>
                {r.resolution_note && (
                  <div className="mt-1 p-2 rounded bg-muted/50 italic text-isa-navy">"{r.resolution_note}"</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function InformeEjecutivoMensual() {
  const month = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const blocks = [
    {
      icon: Activity,
      color: "#1A56F0",
      title: "Resumen de Eficiencia",
      body: "Área de Infraestructura resolvió el 85% de los incidentes este mes.",
      kpi: "24 hs",
      kpiLabel: "Tiempo promedio de respuesta",
    },
    {
      icon: MapPin,
      color: "#EF4444",
      title: "Mapa de Calor de Demandas",
      body: "Se detecta un 60% de reclamos de luminarias concentrados en la Zona Norte.",
      kpi: "Zona Norte",
      kpiLabel: "Recomendación: reforzar cuadrilla en dicho cuadrante.",
    },
    {
      icon: TrendingUp,
      color: "#F59E0B",
      title: "Comunicación Segmentada",
      body: "El 70% de los clics en banners se concentraron en 'Talleres Culturales'.",
      kpi: "70%",
      kpiLabel: "Recomendación: promocionar inscripciones de Cultura el próximo mes.",
    },
    {
      icon: Heart,
      color: "#00B89C",
      title: "Termómetro Turístico",
      body: "Atractivo más votado del mes con corazones: Paseo del Lago.",
      kpi: "4.7 / 5 ★",
      kpiLabel: "Puntuación general del municipio por visitantes",
    },
  ];

  return (
    <section className="bg-white rounded-[16px] border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-isa-navy" />
          <div>
            <h3 className="font-extrabold text-isa-navy text-sm">Informe Ejecutivo de Gestión Mensual</h3>
            <p className="text-[11px] text-muted-foreground capitalize">{month} · datos demo</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy bg-isa-light px-2 py-1 rounded-full">
          Modo Espejo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border p-4 bg-gradient-to-br from-white to-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: b.color + "15", color: b.color }}>
                <b.icon strokeWidth={1.5} className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-isa-navy">{b.title}</div>
            </div>
            <div className="font-display font-extrabold text-isa-navy text-[22px] leading-none mt-3">{b.kpi}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{b.kpiLabel}</div>
            <p className="text-xs text-isa-navy mt-3 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function IntendenteDashboard() {
  const [counts, setCounts] = useState({ claims: 0, businesses: 0, content: 0, banners: 0 });

  useEffect(() => {
    (async () => {
      const [c1, c2, c3, c4] = await Promise.all([
        supabase.from("claims").select("id", { count: "exact", head: true }),
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("content_items").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        claims: c1.count || 0,
        businesses: c2.count || 0,
        content: c3.count || 0,
        banners: c4.count || 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <MayorFullscreen />
      <header>
        <h2 className="font-display font-extrabold text-isa-navy text-[22px] leading-tight">
          Dashboard del Intendente
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Supervisión global del municipio. Visualizá indicadores y publicá comunicaciones.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={AlertTriangle} label="Reclamos" value={counts.claims} color="#EF4444" />
        <Stat icon={Wallet} label="Comercios" value={counts.businesses} color="#1A56F0" />
        <Stat icon={Users} label="Contenido publicado" value={counts.content} color="#00B89C" />
        <Stat icon={Megaphone} label="Banners totales" value={counts.banners} color="#F59E0B" />
      </section>

      <InformeEjecutivoMensual />

      <AnalisisDeGestion />

      <SelectorAudienciaBanner />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Link to="/admin/turismo" className="bg-white rounded-[16px] border p-4 hover:shadow-md transition-shadow">
          <div className="font-extrabold text-isa-navy text-sm">Guía de Turismo</div>
          <p className="text-xs text-muted-foreground mt-1">Cargá comercios, eventos y atractivos.</p>
        </Link>
        <Link to="/admin/hacienda" className="bg-white rounded-[16px] border p-4 hover:shadow-md transition-shadow">
          <div className="font-extrabold text-isa-navy text-sm">Hacienda</div>
          <p className="text-xs text-muted-foreground mt-1">Habilitaciones y vencimientos.</p>
        </Link>
        <Link to="/admin/metricas" className="bg-white rounded-[16px] border p-4 hover:shadow-md transition-shadow">
          <div className="font-extrabold text-isa-navy text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Informe ISA
          </div>
          <p className="text-xs text-muted-foreground mt-1">KPIs y conclusión estratégica.</p>
        </Link>
      </section>
    </div>
  );
}
