import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, CalendarPlus, Music2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agenda, sport_events } from "@/data/mock";
import InscripcionDialog from "@/components/InscripcionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type Filter = "Todos" | "Hoy" | "Finde" | "Cultura" | "Deportes";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  place: string;
  kind: "Cultura" | "Deportes";
  photo: string;
};

const PHOTOS = [
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
];

function buildEvents(): EventItem[] {
  const cult: EventItem[] = agenda.map((a, i) => ({
    id: a.id,
    title: a.title,
    date: a.date,
    time: "20:00",
    place: a.place,
    kind: "Cultura",
    photo: PHOTOS[i % PHOTOS.length],
  }));
  const dep: EventItem[] = sport_events.map((s, i) => ({
    id: s.id,
    title: s.name,
    date: s.date,
    time: s.schedule,
    place: "Polideportivo Municipal",
    kind: "Deportes",
    photo: PHOTOS[(i + 2) % PHOTOS.length],
  }));
  return [...cult, ...dep].sort((a, b) => a.date.localeCompare(b.date));
}

function isToday(d: string) {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return d === iso;
}
function isWeekend(d: string) {
  const day = new Date(d + "T00:00:00").getDay();
  return day === 0 || day === 6 || day === 5;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "long" });
}

function toGCal(e: EventItem) {
  const dt = e.date.replace(/-/g, "");
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${dt}/${dt}&location=${encodeURIComponent(e.place)}`;
}

export default function Eventos() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("Todos");
  const [inscOpen, setInscOpen] = useState<EventItem | null>(null);
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    (async () => {
      let munId: string | null = null;
      if (user?.id) {
        const { data: prof } = await supabase.from("profiles").select("municipality_id").eq("id", user.id).maybeSingle();
        munId = (prof as any)?.municipality_id ?? null;
      }
      let q = supabase
        .from("content_items")
        .select("id,title,description,kind,area,schedule,days,photo_url,municipality_id,published")
        .eq("published", true)
        .in("kind", ["Evento", "Actividad", "Taller"])
        .order("created_at", { ascending: false });
      if (munId) q = q.eq("municipality_id", munId);
      const { data } = await q;
      const today = new Date().toISOString().slice(0, 10);
      setDbEvents(((data as any[]) || []).map((r, i) => ({
        id: `db-${r.id}`,
        title: r.title,
        date: today,
        time: r.schedule || undefined,
        place: r.area || "Municipio",
        kind: (r.area === "Deporte" ? "Deportes" : "Cultura") as "Cultura" | "Deportes",
        photo: r.photo_url || PHOTOS[i % PHOTOS.length],
      })));
    })();
  }, [user?.id]);

  const events = useMemo(() => {
    const merged = [...dbEvents, ...buildEvents()];
    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }, [dbEvents]);
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter === "Hoy") return isToday(e.date);
      if (filter === "Finde") return isWeekend(e.date);
      if (filter === "Cultura") return e.kind === "Cultura";
      if (filter === "Deportes") return e.kind === "Deportes";
      return true;
    });
  }, [events, filter]);

  const filters: Filter[] = ["Todos", "Hoy", "Finde", "Cultura", "Deportes"];

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--isa-beige))" }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <header className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Music2 className="w-5 h-5" style={{ color: "hsl(var(--isa-navy))" }} strokeWidth={1.5} />
            <h1 className="font-display text-2xl font-bold" style={{ color: "hsl(var(--isa-navy))" }}>
              Agenda Cultural
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Conciertos, ferias y actividades deportivas.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background: filter === f ? "hsl(var(--isa-navy))" : "white",
                color: filter === f ? "white" : "hsl(var(--isa-navy))",
                border: "1px solid hsl(var(--isa-navy) / 0.15)",
                minHeight: 44,
              }}
            >
              {f === "Finde" ? "Este finde" : f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            className="text-center py-16 px-6 rounded-2xl"
            style={{ background: "white", border: "1px solid hsl(var(--isa-navy) / 0.08)" }}
          >
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--isa-navy) / 0.4)" }} strokeWidth={1.5} />
            <p className="font-display text-lg font-semibold mb-1" style={{ color: "hsl(var(--isa-navy))" }}>
              Estamos preparando las próximas actividades para vos.
            </p>
            <p className="text-sm text-muted-foreground">¡Volvé pronto!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((e) => (
              <article
                key={e.id}
                className="overflow-hidden bg-white"
                style={{ borderRadius: 16, border: "1px solid hsl(var(--isa-navy) / 0.08)", boxShadow: "0 4px 16px hsl(var(--isa-navy) / 0.04)" }}
              >
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img src={e.photo} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="font-display text-lg font-bold leading-tight" style={{ color: "hsl(var(--isa-navy))" }}>
                      {e.title}
                    </h2>
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{
                        background: e.kind === "Cultura" ? "hsl(var(--isa-navy) / 0.08)" : "hsl(var(--muno-amber) / 0.15)",
                        color: e.kind === "Cultura" ? "hsl(var(--isa-navy))" : "hsl(var(--muno-amber))",
                      }}
                    >
                      {e.kind}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" strokeWidth={1.5} />
                      <span className="capitalize">{fmtDate(e.date)}</span>
                    </li>
                    {e.time && (
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4" strokeWidth={1.5} />
                        <span>{e.time}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      <span>{e.place}</span>
                    </li>
                  </ul>
                  <div className="flex gap-2 flex-wrap">
                    {registered.has(e.id) ? (
                      <div className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold" style={{ background: "hsl(var(--isa-navy) / 0.08)", color: "hsl(var(--isa-navy))", minHeight: 44 }}>
                        ¡Inscripción exitosa! Te esperamos.
                      </div>
                    ) : (
                      <Button
                        onClick={() => setInscOpen(e)}
                        className="flex-1 min-w-[140px]"
                        style={{ background: "hsl(var(--muno-amber))", color: "white", minHeight: 44 }}
                      >
                        <Ticket className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                        Inscribirme
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 min-w-[120px]"
                      style={{ minHeight: 44, borderColor: "hsl(var(--isa-navy) / 0.2)", color: "hsl(var(--isa-navy))" }}
                    >
                      <a href={toGCal(e)} target="_blank" rel="noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                        Agendar
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 min-w-[120px]"
                      style={{ minHeight: 44, borderColor: "hsl(var(--isa-navy) / 0.2)", color: "hsl(var(--isa-navy))" }}
                    >
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place + " San Francisco del Monte de Oro")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                        Ubicación
                      </a>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <InscripcionDialog
        open={!!inscOpen}
        onClose={() => setInscOpen(null)}
        onSuccess={(id) => setRegistered((s) => new Set(s).add(id))}
        evento={
          inscOpen
            ? {
                id: inscOpen.id,
                titulo: inscOpen.title,
                fecha: inscOpen.date,
                tipo: inscOpen.kind,
                lugar: inscOpen.place,
              }
            : null
        }
      />
    </div>
  );
}
