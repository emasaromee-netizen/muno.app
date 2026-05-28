import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { claim_categories, CLAIM_AREAS } from "@/data/mock";
import * as Icons from "lucide-react";
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const STEPS = ["Categoría", "Fotos", "Ubicación", "Resumen"] as const;

export default function Reclamos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<any>(null);
  const [area, setArea] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    setProgress(0);
    const interval = setInterval(() => setProgress((p) => Math.min(100, p + 12)), 60);
    setTimeout(() => {
      clearInterval(interval); setProgress(100);
      const urls = files.map((f) => URL.createObjectURL(f));
      setPhotos((prev) => [...prev, ...urls].slice(0, 3));
      setTimeout(() => setProgress(0), 400);
    }, 600);
  };

  const submit = async () => {
    if (!user) {
      toast.error("Iniciá sesión para enviar un reclamo");
      navigate("/auth/login");
      return;
    }
    setSaving(true);
    const finalArea = area || (category as any)?.area || "";
    const isOtro = category?.id === "otro";
    const finalLocation = location || (isOtro ? "Ubicación automática (GPS del dispositivo)" : "");
    const { data, error } = await supabase
      .from("claims")
      .insert({
        user_id: user.id,
        category: category.label || category.id,
        area: finalArea,
        address: finalLocation,
        description: description || `${category.label} - ${finalLocation}`,
        evidence_photos: photos,
        status: "Pendiente",
      } as any)
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("No se pudo enviar", { description: error?.message });
      return;
    }
    const short = data.id.slice(0, 4).toUpperCase();
    setTicket(`#MUNO-${short}`);
    toast.success(`Reclamo registrado · Asignado a ${finalArea}`);
  };

  const reset = () => {
    setStep(0); setCategory(null); setArea(""); setPhotos([]); setLocation(""); setDescription(""); setTicket(null);
  };

  if (ticket) {
    return (
      <div className="max-w-md mx-auto isa-card p-10 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-muno-teal/15 text-muno-teal grid place-items-center mx-auto">
          <CheckCircle2 strokeWidth={1.5} className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-extrabold text-isa-navy mt-4">¡Reclamo enviado!</h2>
        <p className="text-sm text-muted-foreground mt-2">Estado inicial: <b>Pendiente de revisión</b>.</p>
        <div className="mt-6 p-5 rounded-2xl bg-isa-light">
          <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Ticket</div>
          <div className="text-3xl font-extrabold text-isa-navy mt-1">{ticket}</div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={reset} className="bg-card border rounded-[20px] py-3 font-bold text-isa-navy">Nuevo</button>
          <button onClick={() => navigate("/mi-cuenta")} className="bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">Mis incidentes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const skipped = category?.id === "otro" && (i === 1 || i === 2);
          return (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full ${skipped ? "bg-muted opacity-40" : i <= step ? "bg-muno-teal" : "bg-muted"}`} />
            </div>
          );
        })}
      </div>
      <div className="text-sm font-bold text-muted-foreground">Paso {step + 1} de 4 · {STEPS[step]}{category?.id === "otro" && step === 0 && " (sin fotos ni ubicación manual)"}</div>

      <div className="isa-card p-6 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <div className="text-sm font-bold text-isa-navy mb-2">Tipo de incidente</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {claim_categories.map((c) => {
                  const Icon = (Icons as any)[c.icon] || Icons.Circle;
                  const active = category?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setCategory(c); if (!area) setArea((c as any).area || ""); }}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        active ? "border-isa-navy bg-accent" : "border-border hover:border-isa-dusty"
                      }`}
                    >
                      <Icon strokeWidth={1.5} className="w-8 h-8 text-isa-navy" />
                      <span className="font-bold text-sm text-isa-navy">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {category?.id === "otro" && (
              <div className="space-y-3 animate-fade-in p-4 rounded-2xl border-2 border-isa-navy/20 bg-isa-light/30">
                <div>
                  <label className="text-sm font-bold text-isa-navy">¿A qué área corresponde? <span className="text-destructive">*</span></label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy text-sm"
                  >
                    <option value="">— Seleccioná un área —</option>
                    {CLAIM_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Se enviará al Jefe del área seleccionada.</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-isa-navy">Motivo del reclamo <span className="text-destructive">*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Detallá brevemente el motivo del reclamo (este formulario es 100% informativo, no requiere fotos)."
                    className="mt-2 w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">No es necesario adjuntar fotos para reclamos derivados a otras áreas.</p>
                </div>
              </div>
            )}
            {category && category.id !== "otro" && (
              <div className="text-xs text-muted-foreground p-3 rounded-xl bg-muted/40">
                Área asignada automáticamente: <strong className="text-isa-navy">{area || (category as any).area}</strong>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => {
                const url = photos[i];
                return (
                  <div key={i} className="aspect-square rounded-2xl border-2 border-dashed bg-muted overflow-hidden relative">
                    {url ? (
                      <>
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => fileRef.current?.click()} className="w-full h-full grid place-items-center text-muted-foreground">
                        <Upload strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden multiple onChange={addPhoto} />
            {progress > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-muno-teal transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Subí entre 1 y 3 fotos del problema (opcional).</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="text-sm font-bold text-isa-navy">Describí la ubicación</label>
            <textarea
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              rows={3}
              placeholder="Ej: Calle Belgrano 450, frente a la plaza."
              className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy resize-none"
            />
            <label className="text-sm font-bold text-isa-navy">Detalle del incidente (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Contanos qué pasó, hace cuánto, etc."
              className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy resize-none"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-isa-navy text-lg">Revisá tu reclamo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Categoría</span><span className="font-bold">{category?.label}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Área responsable</span><span className="font-bold">{area}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Fotos</span><span className="font-bold">{photos.length}</span></div>
              {category?.id !== "otro" && (
                <div className="border-b py-2"><div className="text-muted-foreground mb-1">Ubicación</div><div className="font-semibold">{location}</div></div>
              )}
              {category?.id === "otro" && (
                <div className="border-b py-2"><div className="text-muted-foreground mb-1">Ubicación</div><div className="font-semibold text-xs">📍 Capturada automáticamente por GPS al adjuntar foto en tiempo real</div></div>
              )}
              {description && <div className="border-b py-2"><div className="text-muted-foreground mb-1">Detalle</div><div className="font-semibold">{description}</div></div>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => {
            const prev = category?.id === "otro" && step === 3 ? 0 : Math.max(0, step - 1);
            setStep(prev);
          }}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-[20px] font-bold border bg-card disabled:opacity-30 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
        {step < 3 ? (
          <button
            onClick={() => {
              // Si la categoría es "Otro", saltar fotos y ubicación → ir directo al resumen
              const next = category?.id === "otro" && step === 0 ? 3 : step + 1;
              setStep(next);
            }}
            disabled={(step === 0 && (!category || (category.id === "otro" ? (!area || !description.trim()) : !((category as any).area || area)))) || (step === 2 && !location)}
            className="px-5 py-2.5 rounded-[20px] font-bold bg-isa-navy text-isa-white disabled:opacity-40 flex items-center gap-2"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={saving} className="px-6 py-2.5 rounded-[20px] font-bold bg-muno-teal text-white inline-flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar reclamo
          </button>
        )}
      </div>
    </div>
  );
}
