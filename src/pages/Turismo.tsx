import { useState, useMemo, useEffect, ElementType, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMunicipality } from "@/context/MunicipalityContext";
import { places, gastronomy, agenda, commerces, lodging, ZONES, type Zone, type AgendaCategory } from "@/data/mock";
import { MapPin, Calendar, Search, Clock, Tag, Info, X } from "lucide-react";
import { formatARS } from "@/lib/format";
import { track } from "@/lib/analytics";
import LeadDialog from "@/components/LeadDialog";
import RatingStars from "@/components/RatingStars";
import FavoriteButton from "@/components/FavoriteButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const TABS_VECINO = ["Lugares", "Saltos", "Museos", "Cultural", "Gastronomía", "Agenda"] as const;
const TABS_TURISTA = ["Comercio", "Gastronomía", "Hospedaje"] as const;
const AGENDA_CATS: AgendaCategory[] = ["Hoy", "Fin de Semana", "Conciertos"];

type TabType = typeof TABS_VECINO[number] | typeof TABS_TURISTA[number];

interface DBTurismoItem {
  id: string;
  title: string;
  description?: string;
  schedule?: string;
  days?: string;
  price?: number | null;
  photo_url?: string;
  category?: string;
  type?: string;
}

interface PlaceItem {
  id: string;
  name: string;
  type: string;
  address: string;
  zone?: string;
  schedule?: string;
  days?: string;
  price?: number;
  photo_url: string;
  how_to_get: string;
  requirements?: string;
}

interface LodgingItem {
  id: string;
  name: string;
  type: string;
  address: string;
  zone?: string;
  schedule?: string;
  price?: number;
  photos: string[];
  requirements?: string;
}

interface AgendaItem {
  id: string;
  title: string;
  date: string;
  place: string;
  zone?: string;
  category: string;
}

const InfoLine = ({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) => (
  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
    <Icon strokeWidth={1.5} className="w-3 h-3 mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);

const PlaceCard = ({ item, rateable }: { item: PlaceItem; rateable?: boolean }) => (
  <article className="isa-card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
    <div className="relative">
      <img src={item.photo_url} alt={item.name} loading="lazy" className="w-full h-[120px] object-cover" />
      <div className="absolute top-2 right-2">
        <FavoriteButton place={{ id: item.id, name: item.name, type: item.type, photo_url: item.photo_url, zone: item.zone || "" }} />
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-extrabold text-isa-navy">{item.name}</h3>
        <span className="isa-chip bg-accent text-isa-navy">{item.type}</span>
      </div>
      <InfoLine icon={MapPin}>{item.address}{item.zone && ` · ${item.zone}`}</InfoLine>
      {item.schedule && <InfoLine icon={Clock}>{item.schedule}{item.days && ` · ${item.days}`}</InfoLine>}
      {typeof item.price === "number" && <InfoLine icon={Tag}>{item.price === 0 ? "Entrada gratuita" : formatARS(item.price)}</InfoLine>}
      {item.requirements && item.requirements !== "—" && <InfoLine icon={Info}>{item.requirements}</InfoLine>}
      {rateable && <RatingStars id={item.id} name={item.name} />}
      <a href={item.how_to_get} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 text-sm font-bold hover:opacity-90 mt-1">Cómo llegar</a>
    </div>
  </article>
);

const LodgingCard = ({ item, onConsultar }: { item: LodgingItem; onConsultar: (item: LodgingItem) => void }) => {
  const [idx, setIdx] = useState(0);
  return (
    <article className="isa-card overflow-hidden">
      <div className="relative">
        <img src={item.photos[idx]} alt={item.name} className="w-full h-48 object-cover" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {item.photos.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-isa-navy">{item.name}</h3>
          <span className="isa-chip bg-accent text-isa-navy">{item.type}</span>
        </div>
        <InfoLine icon={MapPin}>{item.address}</InfoLine>
        {item.schedule && <InfoLine icon={Clock}>{item.schedule}</InfoLine>}
        {item.price && <InfoLine icon={Tag}>Desde {formatARS(item.price)} / noche</InfoLine>}
        {item.requirements && <InfoLine icon={Info}>{item.requirements}</InfoLine>}
        <button onClick={() => onConsultar(item)} className="w-full mt-1 bg-isa-navy text-isa-white rounded-[20px] py-2.5 text-sm font-bold">Consultar disponibilidad</button>
      </div>
    </article>
  );
};

function filterByZoneAndQuery<T extends { zone?: string; name: string }>(items: T[], zone: Zone, q: string): T[] {
  return items.filter((i) => (zone === "Todas" || i.zone === zone) && i.name.toLowerCase().includes(q.toLowerCase()));
}

function Grid<T>({ items, render, cols = 3 }: { items: T[]; render: (item: T) => ReactNode; cols?: number }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-6">Sin resultados.</p>;
  return <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4`}>{items.map(render)}</div>;
}

export default function Turismo() {
  const { user, roles } = useAuth();
  const { municipality, municipalityId, setMunicipality } = useMunicipality();
  const isTurista = roles.includes("tourist");
  
  // Tipado estricto sin "as any" o "as readonly string[]"
  const TABS: readonly TabType[] = isTurista ? TABS_TURISTA : TABS_VECINO;
  
  const [params, setParams] = useSearchParams();
  const urlZone = params.get("zone") as Zone | null;
  const initialZone: Zone = (urlZone || (municipality as Zone) || "Todas") as Zone;
  
  const [tab, setTab] = useState<TabType>(TABS[0]);
  const [zone, setZone] = useState<Zone>(initialZone);
  const [q, setQ] = useState("");
  const [agendaCat, setAgendaCat] = useState<AgendaCategory>("Hoy");
  const [lodgTarget, setLodgTarget] = useState<LodgingItem | null>(null);

  useEffect(() => {
    if (urlZone && urlZone !== zone) setZone(urlZone);
  }, [urlZone, zone]);

  useEffect(() => {
    if (zone && zone !== "Todas") {
      setMunicipality(zone);
      track({ kind: "search_zone", zone, userType: isTurista ? "turista" : "vecino" });
    }
  }, [zone, isTurista, setMunicipality]);

  useEffect(() => {
    track({ kind: "category_click", category: tab, userType: isTurista ? "turista" : "vecino" });
  }, [tab, isTurista]);

  const clearMunicipality = () => {
    setMunicipality("");
    setZone("Todas");
    setParams({});
  };

  // Optimización total de memoria: Todos los filtros memorizados
  const allPlaces = useMemo(() => filterByZoneAndQuery(places, zone, q), [zone, q]);
  const saltos = useMemo(() => allPlaces.filter((p) => p.type === "Salto"), [allPlaces]);
  const museos = useMemo(() => allPlaces.filter((p) => p.type === "Museo"), [allPlaces]);
  const culturales = useMemo(() => allPlaces.filter((p) => p.type === "Cultural"), [allPlaces]);
  const gastro = useMemo(() => filterByZoneAndQuery(gastronomy, zone, q), [zone, q]);
  const com = useMemo(() => filterByZoneAndQuery(commerces, zone, q), [zone, q]);
  const lodg = useMemo(() => filterByZoneAndQuery(lodging, zone, q), [zone, q]);
  
  const agendaFiltered = useMemo(() => {
    return agenda.filter((a) => a.category === agendaCat && (zone === "Todas" || a.zone === zone));
  }, [agendaCat, zone]);

  const [dbLugares, setDbLugares] = useState<PlaceItem[]>([]);
  const [dbAgenda, setDbAgenda] = useState<DBTurismoItem[]>([]);

  useEffect(() => {
    let isMounted = true; 

    const fetchTurismo = async () => {
      try {
        let munId: string | null = null;
        if (user?.id) {
          const { data: prof } = await supabase.from("profiles").select("municipality_id").eq("id", user.id).maybeSingle();
          munId = prof?.municipality_id ?? null;
        }
        
        if (!munId && zone && zone !== "Todas") {
          munId = municipalityId || null;
        }

        let qLugares = supabase.from("content_items").select("*").eq("published", true).eq("kind", "Lugar").order("created_at", { ascending: false });
        let qEv = supabase.from("content_items").select("*").eq("published", true).in("kind", ["Evento", "Actividad", "Taller"]).order("created_at", { ascending: false });
        
        if (munId) { 
          qLugares = qLugares.eq("municipality_id", munId); 
          qEv = qEv.eq("municipality_id", munId); 
        }
        
        const [resLugares, resEv] = await Promise.all([qLugares, qEv]);

        if (isMounted) {
          const lugData = (resLugares.data as unknown as DBTurismoItem[]) || [];
          const evData = (resEv.data as unknown as DBTurismoItem[]) || [];

          setDbLugares(lugData.map((it) => ({
            id: it.id, 
            name: it.title, 
            type: it.category || it.type || "Lugar",
            address: it.description || "", 
            zone: zone === "Todas" ? "" : zone,
            schedule: it.schedule || "", 
            days: it.days || "", 
            price: it.price ?? undefined,
            photo_url: it.photo_url || "/placeholder.svg", 
            how_to_get: "#",
          })));

          setDbAgenda(evData); 
        }
      } catch (err) {
        console.error("Error cargando turismo:", err);
      }
    };

    fetchTurismo();

    return () => {
      isMounted = false;
    };
  }, [user?.id, zone, municipalityId]);

  const lugaresAll = [...dbLugares, ...allPlaces];
  
  const agendaAll = useMemo(() => {
    const dbMapped: AgendaItem[] = dbAgenda.map((it) => ({
      id: it.id, 
      title: it.title, 
      date: it.days || "Próximamente",
      place: it.schedule || "—", 
      zone: zone === "Todas" ? "" : zone, 
      category: it.category || it.type || "Evento",
    }));
    return [...dbMapped, ...agendaFiltered];
  }, [dbAgenda, agendaFiltered, zone]);

  const TURIST_BIG = [
    { key: "Comercio" as const, label: "COMERCIO" },
    { key: "Gastronomía" as const, label: "GASTRONOMÍA" },
    { key: "Hospedaje" as const, label: "HOSPEDAJE" },
  ];

  return (
    <div className="space-y-5">
      {isTurista ? (
        <header className="space-y-2">
          <h1 className="text-isa-navy font-display font-extrabold text-[20px]">Turismo</h1>
          <p className="text-sm text-muted-foreground">
            {municipality ? `Mostrando información de ${municipality}.` : "Elegí un municipio para ver toda su oferta."}
          </p>
          {municipality && (
            <button
              onClick={clearMunicipality}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-muno-blue/15 text-muno-blue px-2.5 py-1 rounded-full"
            >
              <MapPin className="w-3 h-3" /> {municipality}
              <X className="w-3 h-3" />
            </button>
          )}
        </header>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lugar, hotel…" className="w-full pl-9 pr-3 py-2.5 rounded-[20px] border bg-card text-sm outline-none focus:ring-2 focus:ring-isa-navy" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ZONES.map((z) => (
              <button key={z} onClick={() => setZone(z)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap min-h-[36px] ${zone === z ? "bg-muno-blue text-white" : "bg-card border text-isa-navy"}`}>{z}</button>
            ))}
          </div>
        </div>
      )}

      {isTurista ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TURIST_BIG.map((b) => {
            const active = tab === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setTab(b.key)}
                className="min-h-[88px] rounded-[16px] font-extrabold text-[15px] tracking-wide transition-all"
                style={{
                  background: active ? "#242E44" : "#F5EFE6",
                  color: active ? "#FFFFFF" : "#242E44",
                  border: active ? "none" : "1px solid rgba(36,46,68,0.12)",
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-[20px] text-xs font-bold transition-colors min-h-[36px] ${tab === t ? "bg-isa-navy text-isa-white" : "bg-card text-isa-navy hover:bg-muted border"}`}>{t}</button>
          ))}
        </div>
      )}

      {tab === "Lugares" && <Grid items={lugaresAll} render={(p) => <PlaceCard key={p.id} item={p} rateable />} />}
      {tab === "Saltos" && <Grid items={saltos} render={(p) => <PlaceCard key={p.id} item={p} rateable />} />}
      {tab === "Museos" && <Grid items={museos} render={(p) => <PlaceCard key={p.id} item={p} rateable />} />}
      {tab === "Cultural" && <Grid items={culturales} render={(p) => <PlaceCard key={p.id} item={p} rateable />} />}
      {tab === "Gastronomía" && <Grid items={gastro} render={(p) => <PlaceCard key={p.id} item={p as PlaceItem} />} />}
      {tab === "Comercio" && <Grid items={com} render={(p) => <PlaceCard key={p.id} item={p as PlaceItem} />} />}
      {tab === "Hospedaje" && <Grid items={lodg} render={(p) => <LodgingCard key={p.id} item={p as LodgingItem} onConsultar={setLodgTarget} />} />}

      {tab === "Agenda" && (
        <>
          <div className="flex gap-2">
            {AGENDA_CATS.map((c) => (
              <button key={c} onClick={() => setAgendaCat(c)} className={`px-3 py-1.5 rounded-[20px] text-xs font-bold ${agendaCat === c ? "bg-muno-amber text-white" : "bg-card border"}`}>
                {c === "Hoy" ? "Eventos del Día" : c}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {agendaAll.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No hay eventos en esta categoría.</p>}
            {agendaAll.map((a) => (
              <div key={a.id} className="isa-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent grid place-items-center text-isa-navy"><Calendar strokeWidth={1.5} className="w-5 h-5" /></div>
                <div className="flex-1">
                  <div className="font-extrabold text-isa-navy text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.date} · {a.place} · 📍 {a.zone}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <LeadDialog
        open={!!lodgTarget}
        title={`Consultar · ${lodgTarget?.name || ""}`}
        description="Le enviamos tu consulta al alojamiento."
        fields={["name", "email", "origin"]}
        kind="reserva_lead"
        meta={{ lodging: lodgTarget?.name }}
        onClose={() => setLodgTarget(null)}
      />
    </div>
  );
}