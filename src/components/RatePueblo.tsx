import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useMunicipality } from "@/context/MunicipalityContext";
import { toast } from "sonner";

export default function RatePueblo() {
  const { user } = useAuth();
  const { municipality } = useMunicipality();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) {
      toast.error("Elegí una calificación");
      return;
    }
    setSaving(true);
    let municipality_id: string | null = null;
    if (municipality) {
      const { data: m } = await supabase.from("municipalities").select("id").eq("name", municipality).maybeSingle();
      municipality_id = m?.id || null;
    }
    const { error } = await (supabase.from("tourist_ratings") as any).insert({
      municipality_id,
      user_id: user?.id || null,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo enviar la valoración");
    } else {
      setDone(true);
      toast.success("¡Gracias por puntuar el pueblo!");
    }
  };

  if (done) {
    return (
      <div className="isa-card p-6 text-center space-y-2">
        <CheckCircle2 className="w-10 h-10 text-muno-teal mx-auto" />
        <div className="font-extrabold text-isa-navy">¡Gracias!</div>
        <p className="text-sm text-muted-foreground">Tu opinión ayuda al municipio a mejorar la experiencia turística.</p>
      </div>
    );
  }

  return (
    <div className="isa-card p-5 space-y-3">
      <div>
        <div className="font-extrabold text-isa-navy">Puntuá el pueblo</div>
        <p className="text-xs text-muted-foreground">
          {municipality ? `Tu experiencia visitando ${municipality}.` : "Contanos cómo fue tu visita al municipio."}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} estrellas`}
            className="p-1"
          >
            <Star
              strokeWidth={1.5}
              className={`w-8 h-8 ${(hover || rating) >= n ? "fill-[hsl(var(--muno-amber))] text-[hsl(var(--muno-amber))]" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Comentario (opcional)"
        className="w-full px-3 py-2 rounded-xl border bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-isa-navy"
      />
      <button
        onClick={submit}
        disabled={saving || !rating}
        className="w-full bg-isa-navy text-isa-white rounded-[16px] py-3 font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar valoración
      </button>
    </div>
  );
}
