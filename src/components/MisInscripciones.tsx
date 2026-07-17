import { useEffect, useState } from "react";
import { CalendarCheck, X, Users } from "lucide-react";
import { listInscripciones, cancelInscripcion, type Inscripcion } from "@/lib/inscripciones";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];

type Item = {
  id: string;
  titulo: string;
  fecha: string;
  tipo: string;
  lugar?: string | null;
  acompanantes: string[];
  source: "db" | "local";
};

export default function MisInscripciones() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let isMounted = true; // Control de Memory Leak en dispositivos móviles
    let channel: RealtimeChannel | null = null; // Tipado estricto

    const refresh = async () => {
      const local: Item[] = listInscripciones().map((i: Inscripcion) => ({
        id: i.id,
        titulo: i.titulo,
        fecha: i.fecha,
        tipo: i.tipo,
        lugar: i.lugar,
        acompanantes: i.acompanantes,
        source: "local",
      }));

      if (!user) {
        if (isMounted) setItems(local);
        return;
      }

      try {
        const { data } = await supabase
          .from("registrations")
          .select("id,event_title,event_date,event_type,event_place,companions")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Eliminamos el any, utilizando inferencia segura
        const db: Item[] = (data || []).map((r) => ({
          id: r.id,
          titulo: r.event_title,
          fecha: r.event_date || "",
          tipo: r.event_type || "",
          lugar: r.event_place,
          // Asegurar que es un array de strings si viene de Supabase (Json)
          acompanantes: Array.isArray(r.companions) ? r.companions.map(String) : [],
          source: "db",
        }));

        if (isMounted) {
          const seen = new Set(db.map((d) => d.titulo + d.fecha));
          setItems([...db, ...local.filter((l) => !seen.has(l.titulo + l.fecha))]);
        }
      } catch (error) {
        console.error("Error al obtener inscripciones", error);
      }
    };

    refresh();
    
    // Escuchar eventos locales (ej. al abrir el diálogo de inscripción en otra pestaña)
    const handleLocalEvent = () => refresh();
    window.addEventListener("muno:inscripciones", handleLocalEvent);

    // Conexión segura a Sockets de Supabase
    if (user) {
      channel = supabase
        .channel(`registrations-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "registrations", filter: `user_id=eq.${user.id}` },
          () => refresh()
        )
        .subscribe();
    }

    // Cleanup: Desmontaje del componente
    return () => {
      isMounted = false;
      window.removeEventListener("muno:inscripciones", handleLocalEvent);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]); // El array de dependencias correcto

  const cancel = async (it: Item) => {
    if (it.source === "db") {
      const { error } = await supabase.from("registrations").delete().eq("id", it.id);
      if (error) {
        toast.error("No se pudo cancelar");
        return;
      }
    } else {
      cancelInscripcion(it.id);
    }
    toast.success("Inscripción cancelada");
    // Emitimos el evento para forzar recarga local
    window.dispatchEvent(new Event("muno:inscripciones"));
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