import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type PlaceLite = {
  id: string;
  name: string;
  type?: string;
  photo_url?: string;
  zone?: string;
};

export default function FavoriteButton({ place, className = "" }: { place: PlaceLite; className?: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay usuario o no hay ID del lugar, no hacemos nada
    if (!user?.id || !place?.id) return;
    
    let isMounted = true; // Prevención de fuga de memoria en móviles

    const checkFavorite = async () => {
      try {
        const { data } = await supabase
          .from("tourist_favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("place_id", String(place.id))
          .maybeSingle();

        // Solo actualizamos el estado si el componente sigue abierto en pantalla
        if (isMounted) {
          setFavId(data?.id || null);
        }
      } catch (error) {
        console.error("Error verificando favoritos:", error);
      }
    };

    checkFavorite();

    // Cleanup function: se ejecuta si el usuario sale de la pantalla rápido
    return () => {
      isMounted = false;
    };
  }, [user?.id, place?.id]); // Dependemos solo de los IDs primitivos, no del objeto completo

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Iniciá sesión para guardar favoritos");
      return;
    }
    
    setLoading(true);
    
    if (favId) {
      const { error } = await supabase.from("tourist_favorites").delete().eq("id", favId);
      if (!error) {
        setFavId(null);
        toast.success("Eliminado de favoritos");
      }
    } else {
      const { data, error } = await supabase
        .from("tourist_favorites")
        .insert({
          user_id: user.id,
          place_id: String(place.id),
          place_name: place.name,
          place_type: place.type || null,
          place_photo_url: place.photo_url || null,
          place_zone: place.zone || null,
        })
        .select("id")
        .maybeSingle();
        
      if (!error && data) {
        setFavId(data.id);
        toast.success("Guardado en favoritos");
      } else if (error) {
        toast.error("No se pudo guardar");
      }
    }
    setLoading(false);
  };

  const active = !!favId;
  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur bg-white/90 border shadow-sm transition-all hover:scale-105 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <Heart strokeWidth={2} className={`w-4 h-4 ${active ? "fill-muno-red text-muno-red" : "text-isa-navy"}`} />
      )}
    </button>
  );
}