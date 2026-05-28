import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, X, MapPin, Phone, CalendarDays, Clock } from "lucide-react";
import { useBanners, COLOR_BG, type CustomBanner } from "@/context/BannersContext";

type Audience = "vecino" | "turista" | "all";

const VECINO_TAGS = ["comunidad", "cultura", "deporte", "noticias_municipales"];
const EXCLUDE_FOR_VECINO = ["hospedaje_turistico"];

const AREA_LABEL: Record<string, string> = {
  cultura: "Cultura",
  deporte: "Deporte",
  comunidad: "Comunidad",
  noticias_municipales: "Noticias",
};

function pickAreaTag(tags: string[] = []) {
  return tags.find((t) => AREA_LABEL[t]);
}

export default function HomeBanners({ audience = "vecino" }: { audience?: Audience }) {
  const { banners, loading } = useBanners();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<CustomBanner | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const navigate = useNavigate();

  const slides = useMemo(() => {
    const audienceMatch = (b: CustomBanner) => {
      const aud = (b as any).audience as string | undefined;
      if (!aud) return audience === "vecino"; // legacy default = residents
      if (audience === "turista") return aud === "tourists" || aud === "both";
      return aud === "residents" || aud === "both";
    };
    const enabled = banners.filter((b) => b.enabled !== false).filter(audienceMatch);
    if (audience === "turista") {
      // Banner MUNO (navy) + cualquiera marcado para turistas
      const muno = banners.filter((b) => b.enabled !== false && b.color === "navy");
      const merged = [...muno, ...enabled.filter((b) => b.color !== "navy")];
      return merged.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    }
    const filtered = enabled.filter((b) => {
      const tags = b.tags || [];
      if (audience === "vecino") {
        if (tags.some((t) => EXCLUDE_FOR_VECINO.includes(t))) return false;
        if (tags.length === 0) return true;
        return tags.some((t) => VECINO_TAGS.includes(t));
      }
      return true;
    });
    return filtered.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [banners, audience]);

  // Auto-rotate infinito cada 5s + primer movimiento inmediato al montar
  useEffect(() => {
    if (slides.length <= 1) return;
    const kickoff = setTimeout(() => {
      if (!pausedRef.current) setI((v) => (v + 1) % slides.length);
    }, 1500);
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setI((v) => (v + 1) % slides.length);
    }, 5000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(t);
    };
  }, [slides.length]);

  // Smooth scroll al slide activo
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [i]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== i) setI(idx);
  };

  if (loading) {
    return (
      <div className="relative z-10 min-h-[200px] rounded-[16px] bg-gradient-to-br from-isa-navy/10 to-isa-navy/5 animate-pulse" />
    );
  }
  if (slides.length === 0) {
    return <div className="relative z-10 min-h-[200px] rounded-[16px] bg-isa-navy/5" />;
  }

  return (
    <>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={() => (pausedRef.current = true)}
        onPointerUp={() => {
          setTimeout(() => (pausedRef.current = false), 4000);
        }}
        className="relative z-10 flex overflow-x-auto overflow-y-visible snap-x snap-mandatory scrollbar-none -mx-1 px-1 min-h-[200px]"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((s) => {
          const areaTag = pickAreaTag(s.tags);
          return (
            <div key={s.id} className="snap-center shrink-0 w-full px-1">
              <button
                onClick={() => setOpen(s)}
                className="block w-full text-left rounded-[16px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-isa-navy relative min-h-[200px]"
              >
                {areaTag && (
                  <span className="absolute top-3 right-3 z-10 text-[10px] uppercase tracking-wider font-extrabold bg-white/95 text-isa-navy px-2 py-1 rounded-full">
                    {AREA_LABEL[areaTag]}
                  </span>
                )}
                {s.color === "navy" && <IdentityBanner b={s} />}
                {s.color === "red" && <AlertBanner b={s} />}
                {s.color === "emerald" && <CultureBanner b={s} />}
              </button>
            </div>
          );
        })}
      </div>

      {open && <BannerModal banner={open} onClose={() => setOpen(null)} navigate={navigate} />}
    </>
  );
}

function BannerModal({
  banner,
  onClose,
  navigate,
}: {
  banner: CustomBanner;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const isAlert = banner.color === "red";
  const ctaLabel = banner.cta || (isAlert ? "Más información" : "Ver detalle");
  const ctaTo = banner.ctaTo;

  // Heurística para botón de acción según destino
  let actionIcon: any = ArrowRight;
  let actionLabel = ctaLabel;
  if (ctaTo?.startsWith("tel:")) { actionIcon = Phone; actionLabel = "Llamar ahora"; }
  else if (ctaTo?.startsWith("http") && ctaTo.includes("google.com/maps")) { actionIcon = MapPin; actionLabel = "Ir a Google Maps"; }
  else if (ctaTo === "/eventos") { actionIcon = CalendarDays; actionLabel = "Ver Agenda"; }

  const onAction = () => {
    if (!ctaTo) return onClose();
    if (ctaTo.startsWith("http") || ctaTo.startsWith("tel:") || ctaTo.startsWith("mailto:")) {
      window.location.href = ctaTo;
    } else {
      navigate(ctaTo);
    }
    onClose();
  };

  const Icon = actionIcon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-0 md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md rounded-t-[24px] md:rounded-[16px] overflow-hidden animate-scale-in relative bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 grid place-items-center rounded-full bg-isa-navy text-white hover:opacity-90"
          aria-label="Cerrar"
        >
          <X strokeWidth={2} className="w-4 h-4" />
        </button>

        {banner.image && (
          <img src={banner.image} alt={banner.title} className="w-full h-52 object-cover" />
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            {isAlert && (
              <span className="w-7 h-7 rounded-full grid place-items-center" style={{ background: COLOR_BG.red, color: "#fff" }}>
                <AlertTriangle strokeWidth={1.5} className="w-4 h-4" />
              </span>
            )}
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-isa-navy/70">
              {isAlert ? "Aviso de Servicio" : banner.color === "emerald" ? "Cultura · Deporte" : "Novedad"}
            </span>
          </div>

          <h3 className="font-display font-extrabold text-isa-navy text-[22px] leading-tight">
            {banner.title}
          </h3>

          <p className="text-[14px] text-isa-navy/80 leading-relaxed whitespace-pre-line">
            {banner.description}
          </p>

          {isAlert && (banner as any).meta && (
            <div className="rounded-[12px] bg-white p-3 border border-isa-navy/10 space-y-1.5">
              {(banner as any).meta?.schedule && (
                <div className="flex items-center gap-2 text-[13px] text-isa-navy">
                  <Clock strokeWidth={1.5} className="w-4 h-4" />
                  <span><strong>Horario:</strong> {(banner as any).meta.schedule}</span>
                </div>
              )}
              {(banner as any).meta?.zones && (
                <div className="flex items-start gap-2 text-[13px] text-isa-navy">
                  <MapPin strokeWidth={1.5} className="w-4 h-4 mt-0.5" />
                  <span><strong>Zonas afectadas:</strong> {(banner as any).meta.zones}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-1 grid grid-cols-1 gap-2">
            {ctaTo && (
              <button
                onClick={onAction}
                className="inline-flex items-center justify-center gap-2 w-full bg-isa-navy text-white rounded-[14px] py-3 text-sm font-bold min-h-[44px]"
              >
                <Icon strokeWidth={2} className="w-4 h-4" /> {actionLabel}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-[14px] py-3 text-sm font-bold border border-isa-navy/20 text-isa-navy bg-transparent min-h-[44px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IdentityBanner({ b }: { b: CustomBanner }) {
  return (
    <div className="p-6 text-isa-white relative overflow-hidden rounded-[16px] min-h-[200px]" style={{ background: "hsl(var(--isa-navy))" }}>
      <div
        aria-hidden
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full opacity-10"
        style={{ background: "hsl(var(--isa-dusty))" }}
      />
      <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-isa-dusty">Plataforma</div>
      <h2 className="!text-white font-display text-[40px] leading-none font-extrabold mt-2 tracking-tight">
        {b.title}
      </h2>
      <p className="text-[13px] mt-2 text-[hsl(var(--isa-light))]/90 italic line-clamp-2">{b.description}</p>
    </div>
  );
}

function AlertBanner({ b }: { b: CustomBanner }) {
  return (
    <div className="p-5 text-isa-white relative rounded-[16px] min-h-[200px]" style={{ background: COLOR_BG.red }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 grid place-items-center shrink-0">
          <AlertTriangle strokeWidth={1.5} className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-90">Aviso de Servicio</div>
          <h3 className="!text-white font-display text-[18px] font-extrabold mt-1 leading-snug">{b.title}</h3>
          <p className="text-[12px] opacity-90 mt-1 line-clamp-2">{b.description}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold">
            {b.cta || "Ver detalle"} <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CultureBanner({ b }: { b: CustomBanner }) {
  return (
    <div className="relative text-isa-white overflow-hidden rounded-[16px]" style={{ background: COLOR_BG[b.color] }}>
      {b.image && (
        <>
          <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
        </>
      )}
      <div className="relative p-5 min-h-[200px] flex flex-col justify-end">
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-90">Cultura · Deporte</div>
        <h3 className="!text-white font-display text-[20px] font-extrabold mt-1 leading-tight">{b.title}</h3>
        <p className="text-[12px] opacity-90 mt-1 line-clamp-2">{b.description}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold self-start bg-white/20 px-3 py-1.5 rounded-full">
          {b.cta || "Ver más"} <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
