import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_TAGS = ["cultura", "deporte", "noticias_municipales", "comunidad", "noticias"];
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
  enabled: boolean;
};

const AREA_LABEL: Record<string, string> = {
  cultura: "Cultura",
  deporte: "Deporte",
  comunidad: "Comunidad",
  noticias_municipales: "Noticias",
  noticias: "Noticias",
};

/* ========== BLOQUE 1 · IDENTIDAD MUNO ========== */
function IdentityBlock() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{ background: "hsl(var(--isa-navy))" }}
    >
      <div
        aria-hidden
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-[0.08]"
        style={{ background: "hsl(var(--isa-dusty))" }}
      />
      <div
        className="text-[10px] uppercase tracking-[0.3em] font-bold"
        style={{ color: "hsl(var(--isa-dusty))" }}
      >
        Plataforma
      </div>
      <h2 className="!text-white font-display text-[26px] md:text-[30px] leading-[1.05] font-extrabold mt-1.5 tracking-tight">
        MUNO
      </h2>
      <p className="text-[13px] mt-1 italic font-medium" style={{ color: "hsl(var(--isa-light))" }}>
        La huella digital de tu comunidad.
      </p>
    </div>
  );
}

/* ========== BLOQUE DINÁMICO (NOTICIAS / FOTOS / ALERTAS) ========== */
function NewsBlock({ slides, onOpen }: { slides: Banner[]; onOpen: (b: Banner) => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: false })]
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl h-44 md:h-52 bg-isa-navy/5" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((b) => {
            const isAlert = b.color === "red";
            const areaTag = (b.tags || []).find((t) => AREA_LABEL[t]);
            return (
              <button
                key={b.id}
                onClick={() => onOpen(b)}
                className="relative shrink-0 grow-0 basis-full h-full text-left focus:outline-none"
              >
                {isAlert ? (
                  <div
                    className="absolute inset-0"
                    style={{ background: "hsl(var(--muno-red))" }}
                  />
                ) : b.image_url ? (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-isa-navy to-[#1a2236]" />
                )}
                {!isAlert && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                )}
                {isAlert ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-extrabold bg-white/95 text-[hsl(var(--muno-red))] px-2.5 py-1 rounded-full">
                    <AlertTriangle strokeWidth={2} className="w-3 h-3" /> Alerta
                  </span>
                ) : (
                  areaTag && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] font-extrabold bg-isa-light/95 text-isa-navy px-2.5 py-1 rounded-full">
                      {AREA_LABEL[areaTag]}
                    </span>
                  )
                )}
                <div className={`absolute inset-x-0 ${isAlert ? "top-0 bottom-0 flex flex-col justify-center" : "bottom-0"} p-4`}>
                  {isAlert && (
                    <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/85 mb-1">
                      Aviso de Servicio
                    </div>
                  )}
                  <h3 className="!text-white font-display text-[18px] font-extrabold leading-tight line-clamp-2">
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="text-white/85 text-[12px] mt-1 line-clamp-2">{b.description}</p>
                  )}
                  <span className="inline-flex w-fit items-center gap-1 mt-2 text-[11px] font-bold bg-white/20 text-white rounded-full px-3 py-1">
                    Ver más <ArrowRight strokeWidth={2} className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6" : "w-1.5"}`}
              style={{
                background:
                  i === selected
                    ? "hsl(var(--isa-dusty))"
                    : "hsl(var(--isa-dusty) / 0.35)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* (Bloque de emergencia eliminado: ahora se integra al carrusel) */

/* ========== MODAL "VER MÁS" ========== */
function DetailModal({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  const navigate = useNavigate();
  const onAction = () => {
    if (!banner.cta_to) return onClose();
    if (
      banner.cta_to.startsWith("http") ||
      banner.cta_to.startsWith("tel:") ||
      banner.cta_to.startsWith("mailto:")
    ) {
      window.location.href = banner.cta_to;
    } else {
      navigate(banner.cta_to);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-0 md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {banner.image_url && (
          <img src={banner.image_url} alt={banner.title} className="w-full h-52 object-cover" />
        )}
        <div className="p-5 space-y-3">
          <h3 className="font-display font-extrabold text-isa-navy text-[20px] leading-tight">
            {banner.title}
          </h3>
          <p className="text-[14px] text-isa-navy/80 leading-relaxed whitespace-pre-line">
            {banner.description}
          </p>
          <div className="grid gap-2 pt-1">
            {banner.cta_to && (
              <button
                onClick={onAction}
                className="w-full bg-isa-navy text-white rounded-xl py-3 text-sm font-bold min-h-[44px]"
              >
                {banner.cta_label || "Ver más información"}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-xl py-3 text-sm font-bold border border-isa-navy/20 text-isa-navy bg-transparent min-h-[44px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== CONTENEDOR ========== */
export default function VecinoHomeBlocks() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState<Banner | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,description,image_url,cta_label,cta_to,tags,color,enabled,order_index")
        .eq("enabled", true)
        .order("order_index", { ascending: true });
      setBanners((data || []) as Banner[]);
    })();
  }, []);

  const allowedNonAlert = banners.filter((b) => {
    if (b.color === "red") return false;
    const tags = b.tags || [];
    if (tags.some((t) => EXCLUDED_TAGS.includes(t))) return false;
    if (tags.length === 0) return true;
    return tags.some((t) => ALLOWED_TAGS.includes(t));
  });

  const alerts = banners.filter((b) => b.color === "red" && b.enabled);
  const slides = [...alerts, ...allowedNonAlert];

  return (
    <section className="space-y-4">
      <IdentityBlock />
      <NewsBlock slides={slides} onOpen={setOpen} />
      {open && <DetailModal banner={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
