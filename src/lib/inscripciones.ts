// Manejo simple de inscripciones del usuario en localStorage
export type Inscripcion = {
  id: string;
  eventoId: string;
  titulo: string;
  fecha: string;
  tipo: "Cultura" | "Deportes" | "Taller";
  lugar?: string;
  acompanantes: string[];
  creada: string;
};

const KEY = "muno.inscripciones.v1";

export function listInscripciones(): Inscripcion[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveInscripciones(items: Inscripcion[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("muno:inscripciones"));
}

export function addInscripcion(i: Omit<Inscripcion, "id" | "creada">) {
  const items = listInscripciones();
  const nueva: Inscripcion = { ...i, id: crypto.randomUUID(), creada: new Date().toISOString() };
  saveInscripciones([nueva, ...items]);
  return nueva;
}

export function cancelInscripcion(id: string) {
  saveInscripciones(listInscripciones().filter((x) => x.id !== id));
}
