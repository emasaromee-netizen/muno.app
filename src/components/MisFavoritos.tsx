import { useEffect, useState, useContext } from "react";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// 🔴 FIX SRE: Importamos el contexto del municipio
import MunicipalityContext from "@/context/MunicipalityContext";

type Fav = Database["public"]["Tables"]["tourist_favorites"]["Row"];

// 🔴 FIX TS: Interfaz limpia y estricta para leer el contexto
interface MunicipalityContextType {
  id?: string;
}

export default function MisFavoritos() {
  const { user } = useAuth();
  
  // 🔴 FIX TS: Doble casteo seguro para extraer el ID del municipio actual sin usar 'any'
  const ctx = (useContext(MunicipalityContext) as unknown) as MunicipalityContextType | null;
  const municipalityId = ctx?.id || null;

  const [items, setItems] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevención de Memory Leak

    const load = async () => {
      // 🔴 FIX SRE: Si no hay usuario o no hay municipio, abortamos la carga
      if (!user || !municipalityId) {
        if (isMounted) setLoading(false);
        return;
      }
      
      setLoading(true);
      
      const { data } = await supabase
        .from("tourist_favorites")
        .select("*")
        .eq("user_id", user.id)
        .eq("municipality_id", municipalityId) // 🔴 FIX SRE: Sello Multi-Tenant (Aislamiento Turístico)
        .order("created_at", { ascending: false });

      if (isMounted) {
        setItems(data || []);
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user, municipalityId]); // Agregamos municipalityId a las dependencias

  const remove = async (id: string) => {
    const { error } = await supabase.from("tourist_favorites").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Eliminado");
    }
  };

  if (!user) {
    return (
      <div className="isa-card p-5 text-center text-sm text-muted-foreground">
        Iniciá sesión para guardar y ver tus lugares favoritos.
      </div>
    );
  }

  return (
    <div className="isa-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-muno-red fill-muno-red" />
        <h3 className="font-extrabold text-isa-navy">Mis Favoritos</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no guardaste lugares. Tocá el ❤️ en la Guía de Turismo para agregarlos.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2 rounded-xl border bg-background">
              {f.place_photo_url ? (
                <img src={f.place_photo_url} alt={f.place_name || "Lugar"} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-accent grid place-items-center text-isa-navy">
                  <MapPin className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-isa-navy text-sm truncate">{f.place_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {[f.place_type, f.place_zone].filter(Boolean).join(" · ") || "Lugar guardado"}
                </div>
              </div>
              <button
                onClick={() => remove(f.id)}
                aria-label="Eliminar de favoritos"
                className="w-8 h-8 rounded-full bg-muno-red/10 text-muno-red grid place-items-center hover:bg-muno-red/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}