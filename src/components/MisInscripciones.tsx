import { useEffect, useState } from "react";
import { CalendarCheck, X, Users } from "lucide-react";
import { listInscripciones, cancelInscripcion, type Inscripcion } from "@/lib/inscripciones";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type Item = Inscripcion & { source: "db" };

export default function MisInscripciones() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  const userId = user?.id;

  useEffect(() => {
    let isMounted = true; // Control de Memory Leak

    const refresh = async () => {
      if (!userId) {
        if (isMounted) setItems([]);
        return;
      }

      try {
        // 🔴 FIX TS: Esperamos la promesa y le pasamos el userId
        const dbInscripciones = await listInscripciones(userId);
        
        if (isMounted) {
          setItems(dbInscripciones.map((i) => ({ ...i, source: "db" })));
        }
      } catch (error) {
        console.error("Error al obtener inscripciones", error);
      }
    };

    refresh();
    
    // 🟠 FIX ALTO 1: Escuchar eventos locales EXCLUSIVAMENTE (Ahorro de 50K Sockets)
    const handleLocalEvent = () => refresh();
    window.addEventListener("muno:inscripciones", handleLocalEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("muno:inscripciones", handleLocalEvent);
    };
  }, [userId]); 

  const cancel = async (it: Item) => {
    try {
      // COMPLIANCE FIX: Soft Delete legal asíncrono
      await cancelInscripcion(it.id);
      toast.success("Inscripción cancelada");
      // El helper ya dispara el evento "muno:inscripciones" para auto-recargar
    } catch (err) {
      toast.error("No se pudo cancelar");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2>Mis Inscripciones</h2>
      </div>
      <div className="isa-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-isa-navy" strokeWidth={1.5} />
          <h3 className="font-extrabold text-isa-navy">Talleres y eventos</h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes inscripciones. ¡Explora la agenda municipal!</p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.source + i.id} className="flex items-start justify-between gap-3 border rounded-xl p-3 bg-background">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-isa-navy truncate">{i.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.fecha} {i.tipo ? `· ${i.tipo}` : ""}
                    {i.lugar ? ` · ${i.lugar}` : ""}
                  </div>
                  {i.acompanantes.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {i.acompanantes.length} acompañante(s): {i.acompanantes.join(", ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => cancel(i)}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-muno-red border border-muno-red/30 rounded-full px-2.5 py-1.5 hover:bg-muno-red/10"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}