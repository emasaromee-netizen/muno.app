import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { claim_categories, CLAIM_AREAS } from "@/data/mock";
import * as Icons from "lucide-react";
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Interfaz estricta para eliminar los errores 'any' de categoría
interface ClaimCategory {
  id: string;
  label: string;
  icon: string;
  area?: string;
}

// Interfaz para el payload de inserción de Supabase
interface ClaimPayload {
  user_id: string;
  category: string;
  area: string;
  address: string;
  description: string;
  evidence_photos: string[];
  status: "Pendiente" | "En curso" | "Cerrado"; // SOLUCIÓN TS: Tipado literal exacto de Supabase
}

const STEPS = ["Categoría", "Fotos", "Ubicación", "Resumen"] as const;

// 🔴 FIX CRÍTICO SRE: Función de compresión de imágenes asíncrona en cliente
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      // Redimensionar a Full HD máximo
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context is null"));
      ctx.drawImage(img, 0, 0, width, height);
      // Comprimir a JPEG al 75%
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Compression output blob is null"));
          }
        },
        "image/jpeg",
        0.75
      );
    };
    img.onerror = (err) => reject(err);
  });
};

export default function Reclamos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ClaimCategory | null>(null);
  const [area, setArea] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); 
  const [progress, setProgress] = useState(0);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  
  // SOLUCIÓN: Referencias para atrapar y limpiar timers y evitar Memory Leaks
  const progressIntervalRef = useRef<number | null>(null);
  const progressTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  // Escoba de memoria: limpia los intervalos si el usuario abandona la pantalla
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      if (progressTimeoutRef.current) window.clearTimeout(progressTimeoutRef.current);
      if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    setProgress(0);
    
    // Limpiamos intervalos previos por si el usuario sube fotos muy rápido
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    if (progressTimeoutRef.current) window.clearTimeout(progressTimeoutRef.current);

    progressIntervalRef.current = window.setInterval(() => setProgress((p) => Math.min(100, p + 12)), 60);
    
    progressTimeoutRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      setProgress(100);
      const urls = files.map((f) => URL.createObjectURL(f));
      setPhotos((prev) => [...prev, ...urls].slice(0, 3));
      setPhotoFiles((prev) => [...prev, ...files].slice(0, 3)); 
      
      resetTimeoutRef.current = window.setTimeout(() => setProgress(0), 400);
    }, 600);
  };

  const submit = async () => {
    if (!user) {
      toast.error("Iniciá sesión para enviar un reclamo");
      navigate("/auth/login");
      return;
    }
    setSaving(true);

    // 🔴 FIX CRÍTICO SRE: Obtener el municipio real del ciudadano
    const { data: profile } = await supabase
      .from("profiles")
      .select("municipality_id")
      .eq("id", user.id)
      .maybeSingle();

    let uploadedUrls: string[] = [];

    // 🟠 FIX MEDIO SRE: Subida y compresión en Paralelo (Promise.all)
    if (photoFiles.length > 0) {
      try {
        const uploadPromises = photoFiles.map(async (file, i) => {
          const fileExt = "jpg";
          const filePath = `claims/${user.id}/${Date.now()}-${i}.${fileExt}`;
          const compressedBlob = await compressImage(file);
          
          const { error: uploadError } = await supabase.storage
            .from("avatars") 
            .upload(filePath, compressedBlob, { 
              contentType: "image/jpeg",
              cacheControl: "31536000", // 🟠 FIX ALTO SRE: Caché de 1 año para ahorrar Egress
              upsert: true
            });

          if (uploadError) {
            throw new Error(`Error al subir imagen ${i + 1}`);
          }

          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
          return urlData.publicUrl;
        });

        uploadedUrls = await Promise.all(uploadPromises);
      } catch (err) {
        setSaving(false);
        toast.error(err instanceof Error ? err.message : "Error al procesar las imágenes.");
        console.error(err);
        return;
      }
    }

    const finalArea = area || category?.area || "";
    const isOtro = category?.id === "otro";
    const finalLocation = location || (isOtro ? "Ubicación automática (GPS del dispositivo)" : "");
    
    // 🔴 INYECCIÓN DEL MUNICIPIO EVITANDO EL FALLBACK AL PUEBLO POR DEFECTO
    const payload: ClaimPayload & { municipality_id: string | null } = {
      user_id: user.id,
      category: category?.label || category?.id || "General",
      area: finalArea,
      address: finalLocation,
      description: description || `${category?.label} - ${finalLocation}`,
      evidence_photos: uploadedUrls, 
      status: "Pendiente",
      municipality_id: profile?.municipality_id || null, 
    };

    const { data, error } = await supabase
      .from("claims")
      .insert(payload)
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
    setStep(0); setCategory(null); setArea(""); setPhotos([]); setPhotoFiles([]); setLocation(""); setDescription(""); setTicket(null);
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
                {claim_categories.map((cRaw) => {
                  const c = cRaw as ClaimCategory;
                  // SOLUCIÓN TS: Extracción segura de la key del módulo Icons
                  const Icon = (Icons[c.icon as keyof typeof Icons] as React.ElementType) || Icons.Circle;
                  const active = category?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setCategory(c); if (!area) setArea(c.area || ""); }}
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
                Área asignada automáticamente: <strong className="text-isa-navy">{area || category.area}</strong>
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
                  <div key={`photo-slot-${i}`} className="aspect-square rounded-2xl border-2 border-dashed bg-muted overflow-hidden relative">
                    {url ? (
                      <>
                        <img src={url} className="w-full h-full object-cover" alt="Evidencia" />
                        <button 
                          onClick={() => {
                            setPhotos(photos.filter((_, j) => j !== i));
                            setPhotoFiles(photoFiles.filter((_, j) => j !== i));
                          }} 
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"
                        >
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
            disabled={(step === 0 && (!category || (category.id === "otro" ? (!area || !description.trim()) : !(category.area || area)))) || (step === 2 && !location)}
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