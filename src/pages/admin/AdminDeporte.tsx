import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Interfaces para erradicar tipos 'any' y hacer feliz a ESLint
interface DBRegistration {
  people_count: number;
}

interface DBContentItem {
  id: string;
  title: string;
  description: string | null;
  schedule: string | null;
  price: number | null;
  registrations: DBRegistration[] | null;
}

interface SportActivity {
  id: string;
  title: string;
  description: string | null;
  schedule: string | null;
  enrolled: number;
  capacity: number;
}

export default function AdminDeporte() {
  const { user } = useAuth();
  const [items, setItems] = useState<SportActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("municipality_id")
        .eq("id", user.id)
        .maybeSingle();
        
      if (!profile?.municipality_id) {
        if (isMounted) setLoading(false);
        return;
      }

      // Traer eventos deportivos (Deportes) y las inscripciones anidadas
      const { data, error } = await supabase
        .from("content_items")
        .select(`
          id, title, description, schedule, price,
          registrations ( people_count )
        `)
        .eq("municipality_id", profile.municipality_id)
        .eq("kind", "Evento")
        .eq("area", "Deportes")
        .order("created_at", { ascending: false });

      if (!error && isMounted) {
        // 🔴 FIX TS: Casteamos a la interfaz cruda para evitar 'any'
        const rawData = (data || []) as unknown as DBContentItem[];
        
        const formatted = rawData.map((row) => {
          const totalEnrolled = row.registrations?.reduce((acc, curr) => acc + (curr.people_count || 1), 0) || 0;
          return {
            id: row.id,
            title: row.title,
            description: row.description || "Deporte",
            schedule: row.schedule || "Sin horario",
            enrolled: totalEnrolled,
            capacity: row.price || 30 // Usamos temporalmente price como capacidad
          };
        });
        setItems(formatted);
      }
      
      if (isMounted) setLoading(false);
    };
    
    load();
    
    return () => { 
      isMounted = false; 
    };
  }, [user]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-isa-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="isa-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-isa-navy">
            <tr>
              <th className="text-left p-4">Actividad</th>
              <th className="text-left p-4">Disciplina</th>
              <th className="text-left p-4">Horario</th>
              <th className="text-left p-4">Inscriptos</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  No hay actividades deportivas cargadas
                </td>
              </tr>
            )}
            {items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-4 font-bold">{a.title}</td>
                <td className="p-4">{a.description}</td>
                <td className="p-4 text-muted-foreground">{a.schedule}</td>
                <td className="p-4">
                  <span className="font-bold text-isa-navy">{a.enrolled}</span>
                  <span className="text-muted-foreground">/{a.capacity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}