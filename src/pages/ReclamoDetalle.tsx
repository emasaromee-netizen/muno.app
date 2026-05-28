import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

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

export default function ReclamoDetalle() {
  const { id } = useParams();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rated, setRated] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("claims")
      .select("*")
      .eq("id", decodeURIComponent(id))
      .maybeSingle()
      .then(({ data }) => {
        setClaim(data);
        setRated((data as any)?.rating || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 inline-flex items-center gap-2 justify-center w-full"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>;
  }

  if (!claim) {
    return <div className="text-center py-12">Reclamo no encontrado. <Link to="/" className="text-muno-blue underline">Volver</Link></div>;
  }

  const Icon = claim.status === "Cerrado" ? CheckCircle2 : claim.status === "En curso" ? Clock : AlertCircle;
  const short = claim.id.slice(0, 4).toUpperCase();
  const photos: string[] = claim.evidence_photos || [];
  const resPhotos: string[] = claim.resolution_photos || [];

  const rate = async (n: number) => {
    setRated(n);
    await supabase.from("claims").update({ rating: n }).eq("id", claim.id);
    track({ kind: "rating", meta: { ticket: claim.id, value: n, type: "claim_resolution" } });
    toast.success("¡Gracias por tu calificación!");
  };

  return (
    <div className="space-y-5">
      <Link to="/mi-cuenta" className="inline-flex items-center gap-1 text-sm font-bold text-isa-navy"><ArrowLeft className="w-4 h-4" /> Mis incidentes</Link>

      <div className="isa-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Ticket</div>
            <div className="text-lg font-extrabold text-isa-navy">#MUNO-{short}</div>
          </div>
          <span className={`isa-chip ${STATUS_STYLE[claim.status] || ""}`}><Icon className="w-3 h-3" />{STATUS_LABEL[claim.status] || claim.status}</span>
        </div>
        <div className="text-sm"><span className="text-muted-foreground">Categoría: </span><span className="font-bold">{claim.category}</span></div>
        <div className="text-sm"><span className="text-muted-foreground">Fecha: </span><span className="font-bold">{new Date(claim.created_at).toLocaleString("es-AR")}</span></div>
        {claim.address && <div className="text-sm"><span className="text-muted-foreground">Ubicación: </span><span>{claim.address}</span></div>}
        {claim.description && <p className="text-sm text-isa-navy">{claim.description}</p>}
        {photos[0] && <img src={photos[0]} alt="problema" className="w-full h-44 object-cover rounded-xl" />}
      </div>

      {claim.status === "Cerrado" && (
        <>
          <div className="isa-card p-5 space-y-3 border-l-4 border-muno-teal">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-muno-teal" />
              <h3 className="font-extrabold text-isa-navy">Resolución municipal</h3>
            </div>
            {claim.resolution_note && <p className="text-sm">{claim.resolution_note}</p>}
            {resPhotos[0] && <img src={resPhotos[0]} alt="resuelto" className="w-full h-44 object-cover rounded-xl" />}
            {claim.resolved_at && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                <span className="font-bold">Cerrado:</span> {new Date(claim.resolved_at).toLocaleString("es-AR")}
              </div>
            )}
          </div>

          <div className="isa-card p-5 text-center">
            <p className="text-sm font-bold text-isa-navy">¿Cómo calificás la respuesta del municipio?</p>
            <div className="flex justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => rate(n)} disabled={!!rated} className="p-1">
                  <Star strokeWidth={1.5} className={`w-7 h-7 ${(rated || 0) >= n ? "fill-[hsl(var(--muno-amber))] text-[hsl(var(--muno-amber))]" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            {rated && <p className="text-xs text-muno-teal font-bold mt-2">Valoración registrada</p>}
          </div>
        </>
      )}
    </div>
  );
}
