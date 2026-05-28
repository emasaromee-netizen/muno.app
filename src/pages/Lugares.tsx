import { useState, useMemo, useEffect } from "react";
import { places } from "@/data/mock";
import { MapPin, Trees, Landmark, Clock, Tag, Info } from "lucide-react";
import { formatARS } from "@/lib/format";
import { track } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useMunicipality } from "@/context/MunicipalityContext";

type Cat = "Naturaleza" | "Cultura";

const NATURE_TYPES = ["Naturaleza", "Salto", "Parque Nacional", "Río", "Dique"];
const CULTURE_TYPES = ["Museo", "Cultural", "Monumento"];

const InfoLine = ({ icon: Icon, children }: any) => (
  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
    <Icon strokeWidth={1.5} className="w-3 h-3 mt-0.5 shrink-0" /><span>{children}</span>
  </div>
);

import FavoriteButton from "@/components/FavoriteButton";

const PlaceCard = ({ item }: any) => (
  <article className="isa-card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
    <div className="relative">
      <img src={item.photo_url} alt={item.name} loading="lazy" className="w-full h-[140px] object-cover" />
      <div className="absolute top-2 right-2">
        <FavoriteButton place={{ id: item.id, name: item.name, type: item.type, photo_url: item.photo_url, zone: item.zone }} />
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
      <a href={item.how_to_get} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full bg-isa-navy text-isa-white rounded-[16px] py-2.5 text-sm font-bold hover:opacity-90 mt-1 min-h-[44px]">
        Cómo llegar
      </a>
    </div>
  </article>
);

export default function Lugares() {
  const [cat, setCat] = useState<Cat>("Naturaleza");
  const { user } = useAuth();
  const { municipality } = useMunicipality();
  const [dbPlaces, setDbPlaces] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let munId: string | null = null;
      if (user?.id) {
        const { data: prof } = await supabase.from("profiles").select("municipality_id").eq("id", user.id).maybeSingle();
        munId = prof?.municipality_id ?? null;
      }
      if (!munId && municipality) {
        const { data: m } = await supabase.from("municipalities").select("id").eq("name", municipality).maybeSingle();
        munId = m?.id ?? null;
      }
      let q = supabase.from("content_items").select("*").eq("kind", "Lugar").eq("published", true).order("created_at", { ascending: false });
      if (munId) q = q.eq("municipality_id", munId);
      const { data } = await q;
      setDbPlaces(
        (data || []).map((it: any) => ({
          id: it.id,
          name: it.title,
          type: cat === "Cultura" ? "Cultural" : "Naturaleza",
          address: it.description || "",
          zone: municipality || "",
          schedule: it.schedule || "",
          days: it.days || "",
          price: it.price ?? undefined,
          photo_url: it.photo_url || "/placeholder.svg",
          how_to_get: "#",
        }))
      );
    })();
  }, [user?.id, municipality, cat]);

  const filtered = useMemo(() => {
    const allow = cat === "Naturaleza" ? NATURE_TYPES : CULTURE_TYPES;
    const mockFiltered = places.filter((p) => allow.includes(p.type));
    return [...dbPlaces, ...mockFiltered];
  }, [cat, dbPlaces]);

  const Btn = ({ value, icon: Icon, label }: { value: Cat; icon: any; label: string }) => {
    const active = cat === value;
    return (
      <button
        onClick={() => { setCat(value); track({ kind: "category_click", category: `Lugares:${value}`, userType: "turista" }); }}
        className="flex-1 min-h-[88px] rounded-[16px] flex flex-col items-center justify-center gap-1.5 font-extrabold text-sm transition-all"
        style={{
          background: active ? "#242E44" : "#F5EFE6",
          color: active ? "#FFFFFF" : "#242E44",
          border: active ? "none" : "1px solid rgba(36,46,68,0.12)",
        }}
      >
        <Icon strokeWidth={1.5} className="w-7 h-7" />
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-isa-navy font-display font-extrabold text-[20px]">Lugares</h1>
        <p className="text-sm text-muted-foreground">Naturaleza y cultura de la región.</p>
      </header>
      <div className="flex gap-3">
        <Btn value="Naturaleza" icon={Trees} label="NATURALEZA" />
        <Btn value="Cultura" icon={Landmark} label="CULTURA" />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => <PlaceCard key={p.id} item={p} />)}
        </div>
      )}
    </div>
  );
}
