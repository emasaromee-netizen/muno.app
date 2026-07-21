import { supabase } from "@/integrations/supabase/client";

// Mantenemos la interfaz para compatibilidad con la UI
export type Inscripcion = {
  id: string;
  eventoId: string;
  titulo: string;
  fecha: string;
  tipo: "Cultura" | "Deportes" | "Taller" | string;
  lugar?: string;
  acompanantes: string[];
  creada: string;
};

// 🔴 FIX TS: Interfaz para la respuesta cruda de Supabase
interface DBRegistration {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string | null;
  event_type: string | null;
  event_place: string | null;
  companions: string[] | null;
  created_at: string;
}

// 1. LEER INSCRIPCIONES (Ahora desde Supabase)
export async function listInscripciones(userId: string): Promise<Inscripcion[]> {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null) // 🔴 FIX SRE: Respetamos el Borrado Lógico (Soft Delete)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener inscripciones:", error);
    return [];
  }

  // 🔴 FIX TS: Casteamos a la interfaz estricta en lugar de usar 'any'
  const rawData = (data || []) as unknown as DBRegistration[];

  // Mapeamos la respuesta de la BD a la interfaz del frontend
  return rawData.map((r) => ({
    id: r.id,
    eventoId: r.event_id,
    titulo: r.event_title,
    fecha: r.event_date || "",
    tipo: r.event_type || "Evento",
    lugar: r.event_place || "",
    acompanantes: r.companions || [],
    creada: r.created_at,
  }));
}

// 2. AGREGAR INSCRIPCIÓN (Ahora inserta en Supabase con Aislamiento Multi-Tenant)
export async function addInscripcion(
  userId: string, 
  municipalityId: string, 
  i: Omit<Inscripcion, "id" | "creada">
): Promise<Inscripcion | null> {
  
  const payload = {
    user_id: userId,
    event_id: i.eventoId,
    event_title: i.titulo,
    event_date: i.fecha,
    event_type: i.tipo,
    event_place: i.lugar,
    companions: i.acompanantes,
    people_count: 1 + (i.acompanantes?.length || 0),
    municipality_id: municipalityId, // 🔴 FIX SRE: Aislamiento estricto de jurisdicción
    status: "activa"
  };

  const { data, error } = await supabase
    .from("registrations")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error al guardar inscripción:", error);
    throw error;
  }

  // Disparamos el evento para que la UI se actualice
  window.dispatchEvent(new Event("muno:inscripciones"));

  return {
    id: data.id,
    eventoId: data.event_id,
    titulo: data.event_title,
    fecha: data.event_date || "",
    tipo: data.event_type || "Evento",
    lugar: data.event_place || "",
    acompanantes: data.companions || [],
    creada: data.created_at,
  };
}

// 3. CANCELAR INSCRIPCIÓN (Soft Delete en Supabase)
export async function cancelInscripcion(id: string): Promise<void> {
  const { error } = await supabase
    .from("registrations")
    .update({ 
      deleted_at: new Date().toISOString(), 
      status: 'cancelada' 
    })
    .eq("id", id);
    
  if (error) {
    console.error("Error al cancelar inscripción:", error);
    throw error;
  }
  
  window.dispatchEvent(new Event("muno:inscripciones"));
}