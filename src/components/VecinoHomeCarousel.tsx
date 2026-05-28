import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_TAGS = ["cultura", "deporte", "noticias_municipales", "comunidad"];
const EXCLUDED_TAGS = ["turismo", "hospedaje_turistico"];

type Banner = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cta_label: string | null;
  cta_to: string | null;
  tags: string[] | null;
  color: string | null;
};

const AREA_LABEL: Record<string, string> = {
  cultura: "Cultura",
  deporte: "Deporte",
  comunidad: "Comunidad",
  noticias_municipales: "Noticias",
};

export default function VecinoHomeCarousel() {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: false })]
  );
  const [slides, setSlides] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,description,image_url,cta_label,cta_to,tags,color,enabled,order_index")
        .eq("enabled", true)
        .order("order_index", { ascending: true });

      const filtered = (data || []).filter((b: any) => {
        const tags: string[] = b.tags || [];
        if (tags.some((t) => EXCLUDED_TAGS.includes(t))) return false;
        if (tags.length === 0) return true;
        return tags.some((t) => ALLOWED_TAGS.includes(t));
      });
      setSlides(filtered as Banner[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, slides.length]);

  const go = (b: Banner) => {
    if (!b.cta_to) return;
    if (b.cta_to.startsWith("http") || b.cta_to.startsWith("tel:")) window.location.href = b.cta_to;
    else navigate(b.cta_to);
  };

  if (loading) return <div className="h-48 md:h-56 rounded-xl bg-isa-navy/5" />;
  if (slides.length === 0) return null;

  return (
    <section aria-label="Cultura, Deporte y Noticias" className="relative">
      <div className="relative overflow-hidden rounded-xl h-48 md:h-56 bg-isa-navy">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((b) => {
              const areaTag = (b.tags || []).find((t) => AREA_LABEL[t]);
              return (
                <button
                  key={b.id}
                  onClick={() => go(b)}
                  className="relative shrink-0 grow-0 basis-full h-full text-left focus:outline-none"
                >
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-isa-navy to-[#1a2236]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {areaTag && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] font-extrabold bg-isa-light/95 text-isa-navy px-2.5 py-1 rounded-full">
                      {AREA_LABEL[areaTag]}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 pr-5 pb-7">
                    <h3 className="!text-white font-display text-[18px] md:text-[20px] font-extrabold leading-tight line-clamp-2">
                      {b.title}
                    </h3>
                    {b.description && (
                      <p className="text-white/85 text-[12px] mt-1 line-clamp-2">{b.description}</p>
                    )}
                    {b.cta_label && (
                      <span className="inline-block mt-2 text-[11px] font-bold bg-white/20 text-white rounded-full px-3 py-1">
                        {b.cta_label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6" : "w-1.5"}`}
                style={{
                  background: i === selected ? "hsl(var(--isa-dusty))" : "hsl(var(--isa-light) / 0.45)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
