import { useState, useEffect } from "react";
import { Wifi, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { logActivity } from "@/lib/audit";

// SOLUCIÓN TS: Interfaz estricta para eliminar el 'any'
interface WiFiItem {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  price: number | null;
}

export default function AdminWifi() {
  const { user } = useAuth();
  const [items, setItems] = useState<WiFiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWifi = async () => {
      if (!user) return;
      
      // 1. Obtenemos el municipio del administrador
      const { data: prof } = await supabase
        .from("profiles")
        .select("municipality_id")
        .eq("id", user.id)
        .maybeSingle();
        
      if (!prof?.municipality_id) {
        if (isMounted) setLoading(false);
        return;
      }

      // 2. Cargamos las redes WiFi desde la base de datos real (Aislamiento Multi-Tenant)
      const { data, error } = await supabase
        .from("content_items")
        .select("id, title, description, published, price")
        .eq("municipality_id", prof.municipality_id)
        .eq("kind", "WiFi")
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (!error) setItems((data as WiFiItem[]) || []);
        setLoading(false);
      }
    };

    fetchWifi();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 3. Mutación Real: Sincroniza con Supabase y evita falso log de auditoría
  const toggleStatus = async (id: string, currentStatus: boolean, title: string) => {
    const { error } = await supabase
      .from("content_items")
      .update({ published: !currentStatus })
      .eq("id", id);
    
    if (error) {
      toast.error("Error de conexión. No se pudo actualizar la red.");
      return; // 🛑 Cortamos la ejecución. El log no se dispara si la BD falla.
    }

    // Actualización optimista de la UI
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, published: !currentStatus } : x));
    
    // Logueamos la actividad legalmente
    logActivity(currentStatus ? "Desactivar WiFi" : "Activar WiFi", { 
      entity: "wifi_zone", 
      entity_id: id, 
      meta: { name: title } 
    });
    
    toast.success(currentStatus ? "Red WiFi desactivada" : "Red WiFi activada");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-isa-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
            No hay redes WiFi públicas cargadas en el municipio.
          </div>
        )}
        {items.map((w) => (
          <div key={w.id} className="isa-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muno-teal/10 text-muno-teal grid place-items-center">
                <Wifi strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-isa-navy truncate">{w.title}</div>
                <div className="text-sm text-muted-foreground truncate">{w.description || "Ubicación no especificada"}</div>
              </div>
              <button 
                onClick={() => toggleStatus(w.id, w.published, w.title)} 
                className={`relative w-12 h-7 rounded-full shrink-0 ${w.published ? "bg-muno-teal" : "bg-muted"}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${w.published ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="isa-chip bg-accent text-isa-navy">
                {!w.price || w.price === 0 ? "Libre" : "Con clave"}
              </span>
              <span className="isa-chip bg-muted text-isa-navy">
                {w.published ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}