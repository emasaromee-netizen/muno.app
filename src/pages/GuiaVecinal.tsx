import { useState, useMemo } from "react";
import { commerces, gastronomy } from "@/data/mock";
import { MapPin, Search, Clock, Tag, Info, Phone, Store, UtensilsCrossed, Cross } from "lucide-react";
import { formatARS } from "@/lib/format";

const TABS = [
  { key: "Comercios", label: "Comercios y Servicios", icon: Store },
  { key: "Delivery", label: "Delivery y Rotiserías", icon: UtensilsCrossed },
  { key: "Farmacias", label: "Farmacias de Turno", icon: Cross },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FARMACIAS_TURNO = [
  { id: "f1", name: "Farmacia del Centro", address: "San Martín 245", schedule: "Hoy 08:00 - 08:00 (24hs)", phone: "+542665470123", zone: "San Francisco del Monte de Oro" },
  { id: "f2", name: "Farmacia Monte de Oro", address: "Belgrano 112", schedule: "Mañana 08:00 - 22:00", phone: "+542665470456", zone: "San Francisco del Monte de Oro" },
  { id: "f3", name: "Farmacia La Posta", address: "Ruta 20 Km 2", schedule: "Sábado y Domingo", phone: "+542665470789", zone: "San Francisco del Monte de Oro" },
];

const InfoLine = ({ icon: Icon, children }: any) => (
  <div className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
    <Icon strokeWidth={1.5} className="w-3.5 h-3.5 mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);

const Card = ({ item, cta }: any) => (
  <article className="isa-card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
    {item.photo_url && <img src={item.photo_url} alt={item.name} loading="lazy" className="w-full h-[120px] object-cover" />}
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-extrabold text-isa-navy">{item.name}</h3>
        {item.type && <span className="isa-chip bg-accent text-isa-navy">{item.type}</span>}
      </div>
      <InfoLine icon={MapPin}>{item.address}{item.zone && ` · ${item.zone}`}</InfoLine>
      {item.schedule && <InfoLine icon={Clock}>{item.schedule}</InfoLine>}
      {typeof item.price === "number" && <InfoLine icon={Tag}>{item.price === 0 ? "Sin cargo" : formatARS(item.price)}</InfoLine>}
      {item.requirements && item.requirements !== "—" && <InfoLine icon={Info}>{item.requirements}</InfoLine>}
      {cta}
    </div>
  </article>
);

export default function GuiaVecinal() {
  const [tab, setTab] = useState<TabKey>("Comercios");
  const [q, setQ] = useState("");

  const filterFn = (i: { name: string }) =>
    i.name.toLowerCase().includes(q.toLowerCase());

  // Orden alfabético + sin filtro de zona
  const sortByName = <T extends { name: string }>(arr: T[]) =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name, "es"));

  const com = useMemo(() => sortByName(commerces.filter(filterFn)), [q]);
  const gastro = useMemo(() => sortByName(gastronomy.filter(filterFn)), [q]);
  const farma = useMemo(() => sortByName(FARMACIAS_TURNO.filter(filterFn)), [q]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-isa-navy font-display font-extrabold text-[20px]">Guía Útil Vecinal</h1>
        <p className="text-sm text-muted-foreground">Comercios, gastronomía local y farmacias de turno cerca tuyo.</p>
      </header>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar comercio, rotisería, farmacia…"
          className="w-full pl-9 pr-3 py-2.5 rounded-[20px] border bg-card text-sm outline-none focus:ring-2 focus:ring-isa-navy"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="min-h-[72px] rounded-[16px] font-extrabold text-[12px] px-2 flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                background: active ? "#242E44" : "#F5EFE6",
                color: active ? "#FFFFFF" : "#242E44",
                border: active ? "none" : "1px solid rgba(36,46,68,0.12)",
              }}
            >
              <Icon strokeWidth={1.5} className="w-5 h-5" />
              <span className="leading-tight text-center">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "Comercios" && <Grid items={com} render={(p: any) => <Card key={p.id} item={p} />} />}
      {tab === "Delivery" && <Grid items={gastro} render={(p: any) => <Card key={p.id} item={p} />} />}
      {tab === "Farmacias" && (
        <Grid
          items={farma}
          render={(p: any) => (
            <Card
              key={p.id}
              item={p}
              cta={
                <a
                  href={`tel:${p.phone}`}
                  className="inline-flex items-center justify-center gap-2 w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 text-sm font-bold hover:opacity-90 mt-1"
                >
                  <Phone strokeWidth={1.5} className="w-4 h-4" /> Llamar
                </a>
              }
            />
          )}
        />
      )}
    </div>
  );
}

function Grid({ items, render }: any) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-6">Sin resultados.</p>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(render)}</div>;
}
