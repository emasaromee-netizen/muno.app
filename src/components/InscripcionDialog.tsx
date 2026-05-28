import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { addInscripcion } from "@/lib/inscripciones";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (eventId: string) => void;
  evento: {
    id: string;
    titulo: string;
    fecha: string;
    tipo: "Cultura" | "Deportes" | "Taller";
    lugar?: string;
  } | null;
}

export default function InscripcionDialog({ open, onClose, onSuccess, evento }: Props) {
  const { user } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Argentina");
  const [people, setPeople] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setSubmitting(false);
    if (user) {
      supabase
        .from("profiles")
        .select("full_name,email,municipality_id")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setNombre(data?.full_name || "");
          setEmail(data?.email || user.email || "");
        });
    } else {
      setNombre("");
      setEmail("");
      setCity("");
      setCountry("Argentina");
    }
    setPeople("1");
  }, [open, user]);

  if (!open || !evento) return null;

  const submit = async () => {
    const n = nombre.trim();
    const e = email.trim();
    const c = city.trim();
    const co = country.trim();
    const p = parseInt(people, 10);
    if (!n) return toast.error("Ingresá tu nombre completo");
    if (!e || !/^\S+@\S+\.\S+$/.test(e)) return toast.error("Ingresá un email válido");
    if (!user && !c) return toast.error("Ingresá tu ciudad");
    if (!user && !co) return toast.error("Ingresá tu país");
    if (!Number.isInteger(p) || p < 1) return toast.error("Cantidad de personas inválida");

    setSubmitting(true);

    addInscripcion({
      eventoId: evento.id,
      titulo: evento.titulo,
      fecha: evento.fecha,
      tipo: evento.tipo,
      lugar: evento.lugar,
      acompanantes: Array.from({ length: Math.max(0, p - 1) }, (_, i) => `Acompañante ${i + 1}`),
    });

    const payload: any = {
      event_id: evento.id,
      event_title: evento.titulo,
      event_date: evento.fecha,
      event_type: evento.tipo,
      event_place: evento.lugar ?? null,
      people_count: p,
      companions: [],
    };
    if (user) {
      payload.user_id = user.id;
      // Asegurar municipality_id explícito desde el perfil
      const { data: prof } = await supabase
        .from("profiles")
        .select("municipality_id")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.municipality_id) payload.municipality_id = prof.municipality_id;
    } else {
      payload.user_id = null;
      payload.guest_name = n;
      payload.guest_email = e;
      payload.guest_city = c;
      payload.guest_country = co;
    }

    const { error } = await supabase.from("registrations").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Error al registrar", { description: error.message });
      return;
    }
    toast.success("¡Inscripción exitosa!");
    setDone(true);
    window.dispatchEvent(new Event("muno:inscripciones"));
    onSuccess?.(evento.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end md:place-items-center p-0 md:p-4" onClick={onClose}>
      <div className="w-full md:max-w-md rounded-t-[24px] md:rounded-[16px] bg-white p-5 space-y-4 relative" onClick={(ev) => ev.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-isa-navy text-white">
          <X className="w-4 h-4" />
        </button>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Inscripción</div>
          <h3 className="font-display text-[20px] font-extrabold text-isa-navy mt-1 leading-tight">{evento.titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1">{evento.fecha} {evento.lugar ? `· ${evento.lugar}` : ""}</p>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
            <p className="font-display text-lg font-bold text-isa-navy">¡Inscripción exitosa!</p>
            <p className="text-sm text-muted-foreground">Te esperamos.</p>
            <button onClick={onClose} className="mt-2 bg-isa-navy text-white rounded-[20px] py-2.5 px-6 font-bold text-sm">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-isa-navy">Nombre completo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-isa-navy">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
              />
            </div>
            {!user && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-isa-navy">Ciudad</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad de origen"
                    className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-isa-navy">País</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="País"
                    className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-isa-navy">Cantidad de personas</label>
              <input
                type="number"
                min={1}
                step={1}
                value={people}
                onChange={(e) => setPeople(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-isa-navy text-white rounded-[20px] py-3 font-bold text-sm disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Confirmar inscripción"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
