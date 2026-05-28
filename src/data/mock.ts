// Mock data MUNO · San Francisco del Monte de Oro (San Luis)
export const ZONES = ["Todas", "San Francisco del Monte de Oro", "Luján", "Quines", "Potrero", "La Toma"] as const;
export type Zone = (typeof ZONES)[number];

// Provincias / ciudades de origen para captura de leads (turistas)
export const ORIGINS = [
  "Buenos Aires", "Córdoba", "Mendoza", "Rosario", "La Plata", "Santa Fe",
  "Tucumán", "Salta", "Neuquén", "Bariloche", "Chile", "Brasil", "Otro",
];

export const places = [
  { id: "1", name: "Dique La Florida", type: "Naturaleza", zone: "San Francisco del Monte de Oro", photo_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", address: "Dique La Florida, San Luis", how_to_get: "https://maps.google.com/?q=Dique+La+Florida+San+Luis", schedule: "Acceso libre 24hs", days: "Todos los días", price: 0, requirements: "Llevar agua y calzado cómodo. Pesca con permiso." },
  { id: "2", name: "Salto El Gavilán", type: "Salto", zone: "San Francisco del Monte de Oro", photo_url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800", address: "Sierras de San Francisco del Monte de Oro", how_to_get: "https://maps.google.com/?q=Salto+El+Gavilan+San+Francisco+del+Monte+de+Oro", schedule: "9 a 19hs", days: "Todos los días", price: 0, requirements: "Sendero de dificultad media. Recomendado guía local." },
  { id: "3", name: "Sierra de las Quijadas", type: "Parque Nacional", zone: "Quines", photo_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", address: "Ruta Nac. 147, San Luis", how_to_get: "https://maps.google.com/?q=Sierra+de+las+Quijadas", schedule: "8 a 18hs", days: "Mar a Dom", price: 2500, requirements: "Entrada al Parque Nacional. Guía obligatorio en sendero largo." },
  { id: "4", name: "Salto de la Quebrada", type: "Salto", zone: "La Toma", photo_url: "https://images.unsplash.com/photo-1502786129293-79981df4e689?w=800", address: "La Toma, San Luis", how_to_get: "https://maps.google.com/?q=La+Toma+San+Luis", schedule: "10 a 18hs", days: "Vie a Dom", price: 1200, requirements: "Calzado de trekking." },
  { id: "5", name: "Casa Histórica de Sarmiento", type: "Museo", zone: "San Francisco del Monte de Oro", photo_url: "https://images.unsplash.com/photo-1565060169187-5284a3b2c0f4?w=800", address: "Pringles s/n, San Francisco del Monte de Oro", how_to_get: "https://maps.google.com/?q=Casa+Sarmiento+San+Francisco+del+Monte+de+Oro", schedule: "9 a 13hs / 16 a 20hs", days: "Mar a Dom", price: 0, requirements: "Entrada gratuita. Visitas guiadas." },
  { id: "6", name: "Museo de Arte Sacro", type: "Museo", zone: "Luján", photo_url: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800", address: "Luján, San Luis", how_to_get: "https://maps.google.com/?q=Lujan+San+Luis", schedule: "10 a 17hs", days: "Mié a Dom", price: 800, requirements: "—" },
  { id: "7", name: "Centro Cultural Sarmientino", type: "Cultural", zone: "San Francisco del Monte de Oro", photo_url: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800", address: "Plaza San Martín, San Francisco del Monte de Oro", how_to_get: "https://maps.google.com/?q=Plaza+San+Martin+San+Francisco+del+Monte+de+Oro", schedule: "Según evento", days: "Vie/Sáb", price: 0, requirements: "Entrada gratuita." },
];

export const gastronomy = [
  { id: "g1", name: "La Posta del Virrey", type: "Parrilla", zone: "Potrero", photo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", address: "Av. Illia 459", how_to_get: "https://maps.google.com/?q=San+Luis+Argentina", schedule: "12 a 15hs / 20 a 24hs", days: "Mar a Dom", price: 8500, requirements: "Reserva sugerida los fines de semana." },
  { id: "g2", name: "Café del Centro", type: "Cafetería", zone: "San Francisco", photo_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800", address: "Pringles 250", how_to_get: "https://maps.google.com/?q=San+Luis+Argentina", schedule: "8 a 21hs", days: "Lun a Sáb", price: 3200, requirements: "—" },
];

export const commerces = [
  { id: "c1", name: "Almacén Don José", type: "Almacén", zone: "Luján", photo_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800", address: "Belgrano 120", how_to_get: "https://maps.google.com/?q=San+Luis+Argentina", schedule: "8 a 13 / 17 a 21", days: "Lun a Sáb", price: 0, requirements: "—" },
  { id: "c2", name: "Librería La Plaza", type: "Librería", zone: "La Toma", photo_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800", address: "San Martín 800", how_to_get: "https://maps.google.com/?q=San+Luis+Argentina", schedule: "9 a 19hs", days: "Lun a Vie", price: 0, requirements: "—" },
];

export const lodging = [
  { id: "l1", name: "Cabañas Los Álamos", type: "Cabaña", zone: "San Francisco del Monte de Oro", photos: ["https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=800", "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"], address: "Camino al Dique La Florida, San Francisco del Monte de Oro", price: 42000, schedule: "Check-in 14hs · Check-out 10hs", requirements: "Mínimo 2 noches en temporada alta." },
  { id: "l2", name: "La Posta del Monte", type: "Posada", zone: "San Francisco del Monte de Oro", photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"], address: "Av. San Martín 245, San Francisco del Monte de Oro", price: 35000, schedule: "Check-in 15hs · Check-out 11hs", requirements: "Reserva con seña 30%." },
];

export const wifi_zones = [
  { id: "w1", name: "Plaza San Martín", address: "Centro, San Francisco del Monte de Oro", is_free: true, password: "PLAZA-SFMO-2026", password_hint: null, active: true, zone: "San Francisco del Monte de Oro" },
  { id: "w2", name: "Casa de Sarmiento", address: "Pringles s/n, San Francisco del Monte de Oro", is_free: false, password: "SARMIENTO-MUNO", password_hint: "Pedir en recepción", active: true, zone: "San Francisco del Monte de Oro" },
];

export type AgendaCategory = "Hoy" | "Fin de Semana" | "Conciertos";
export const agenda: { id: string; title: string; date: string; place: string; category: AgendaCategory; zone: string }[] = [
  { id: "a1", title: "Feria de Artesanos", date: "2026-05-06", place: "Plaza Pringles", category: "Hoy", zone: "San Francisco" },
  { id: "a2", title: "Festival Folclórico", date: "2026-05-09", place: "Anfiteatro Municipal", category: "Fin de Semana", zone: "Potrero" },
  { id: "a3", title: "Concierto Sinfónico", date: "2026-05-15", place: "Teatro Municipal", category: "Conciertos", zone: "San Francisco" },
  { id: "a4", title: "Recital de Rock Nacional", date: "2026-05-22", place: "Anfiteatro Quines", category: "Conciertos", zone: "Quines" },
];

export const workshops = [
  { id: "t1", name: "Guitarra Inicial", teacher: "Prof. Romero", capacity: 20, enrolled: 18, schedule: "18 a 20hs", days: "Mar/Jue", price: 4500, requirements: "Llevar guitarra propia. Edad mínima 12 años.", photo: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800" },
  { id: "t2", name: "Pintura al Óleo", teacher: "Prof. Vega", capacity: 15, enrolled: 15, schedule: "10 a 12hs", days: "Sábados", price: 6000, requirements: "Materiales incluidos. Mayores de 16.", photo: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800" },
];

export const cultural_events = [
  { id: "ce1", title: "Concierto Sinfónico", date: "2026-05-15", place: "Teatro Municipal", capacity: 300, reserved: 120, price: 5500, schedule: "21hs", days: "Viernes", requirements: "Mayores de 8 años.", photo: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800" },
];

export type SportStatus = "available" | "few" | "full";
export const sport_events = [
  { id: "se1", name: "Maratón San Luis 10K", date: "2026-06-01", status: "available" as SportStatus, price: 7500, schedule: "8hs", requirements: "Apto físico obligatorio." },
  { id: "se2", name: "Torneo de Vóley", date: "2026-05-25", status: "few" as SportStatus, price: 3000, schedule: "10 a 18hs", requirements: "Equipos de 6." },
  { id: "se3", name: "Liga Municipal de Fútbol", date: "2026-05-10", status: "full" as SportStatus, price: 4000, schedule: "16hs", requirements: "Apto físico." },
];

export const sport_activities = [
  { id: "sa1", name: "Fútbol Infantil", discipline: "Fútbol", age_range: "Infantil", schedule: "17 a 19hs", days: "Lun/Mié", capacity: 30, enrolled: 22, price: 2500, requirements: "Apto físico pediátrico." },
  { id: "sa2", name: "Yoga Adultos", discipline: "Yoga", age_range: "Adultos", schedule: "9 a 10:30hs", days: "Mar/Jue", capacity: 25, enrolled: 12, price: 3500, requirements: "Mat propio." },
  { id: "sa3", name: "Vóley Jóvenes", discipline: "Vóley", age_range: "Jóvenes", schedule: "19 a 21hs", days: "Viernes", capacity: 20, enrolled: 8, price: 2800, requirements: "13 a 18 años." },
];

export const claim_categories = [
  { id: "luminaria", label: "Luminaria", icon: "Lightbulb", area: "Obras Públicas" },
  { id: "baches", label: "Bacheo", icon: "Construction", area: "Obras Públicas" },
  { id: "basura", label: "Basura", icon: "Trash", area: "Medio Ambiente" },
  { id: "residuos", label: "Residuos", icon: "Trash2", area: "Medio Ambiente" },
  { id: "agua", label: "Agua / Cloacas", icon: "Droplets", area: "Obras Públicas" },
  { id: "espacios", label: "Espacios verdes", icon: "Trees", area: "Medio Ambiente" },
  { id: "otro", label: "Otro", icon: "HelpCircle", area: "" },
];

export const CLAIM_AREAS = [
  "Cultura",
  "Deportes",
  "Salud",
  "Obras Públicas",
  "Seguridad",
  "Medio Ambiente",
] as const;
export type ClaimArea = (typeof CLAIM_AREAS)[number];

export type ClaimStatus = "Pendiente" | "En curso" | "Cerrado";
export interface MyClaim {
  id: string;
  category: string;
  status: ClaimStatus;
  date: string;
  description: string;
  photo: string;
  resolution?: { response: string; resolved_photo: string; closed_at: string; agent: string };
  vecino_rating?: number;
}
export const my_claims: MyClaim[] = [
  {
    id: "#SL-2026-0042", category: "Luminaria", status: "Cerrado", date: "2026-04-28",
    description: "Foco de calle Belgrano 450 sin funcionar.",
    photo: "https://images.unsplash.com/photo-1565636192335-1f3c4b8a2c91?w=600",
    resolution: {
      response: "Se reemplazó la luminaria LED. Funcionando con normalidad.",
      resolved_photo: "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=600",
      closed_at: "2026-05-02 11:30",
      agent: "Cuadrilla Infraestructura · J. Fernández",
    },
  },
  { id: "#SL-2026-0051", category: "Baches", status: "En curso", date: "2026-05-01", description: "Bache profundo Av. Illia y San Martín.", photo: "https://images.unsplash.com/photo-1597007030739-6d2e7172ee27?w=600" },
  { id: "#SL-2026-0063", category: "Residuos", status: "Pendiente", date: "2026-05-04", description: "Contenedor desbordado.", photo: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600" },
];

export const AREAS = ["Cultura", "Turismo", "Deporte", "Infraestructura", "Comercios"] as const;
export type Area = (typeof AREAS)[number];

export const collaborators = [
  { id: "co1", email: "j.fernandez@muno.gob.ar", area: "Infraestructura" as Area, role: "Editor" },
  { id: "co2", email: "m.lopez@muno.gob.ar", area: "Cultura" as Area, role: "Editor" },
];

export const reservations = [
  { id: "r1", guest: "Familia Pérez", date: "2026-05-10", nights: 3, status: "Confirmada" },
  { id: "r2", guest: "Carla Suárez", date: "2026-05-18", nights: 2, status: "Pendiente" },
];

// Tareas internas por área
export type AreaTask = { id: string; area: Area; title: string; assignee: string; due: string; status: "Pendiente" | "Hecho" };
export const area_tasks: AreaTask[] = [
  { id: "tk1", area: "Cultura", title: "Cargar agenda mensual de mayo", assignee: "m.lopez@muno.gob.ar", due: "2026-05-08", status: "Pendiente" },
  { id: "tk2", area: "Infraestructura", title: "Cerrar reclamos pendientes >7 días", assignee: "j.fernandez@muno.gob.ar", due: "2026-05-09", status: "Pendiente" },
];

// Comercios habilitados (admin)
export type AdminCommerce = {
  id: string;
  name: string;
  owner: string;
  email: string;
  category: string;
  zone: string;
  photo: string;
  enabled: boolean;
  tax_due: string;
  tax_amount: number;
  tax_paid: boolean;
};
export const admin_commerces: AdminCommerce[] = [
  { id: "ac1", name: "Cabañas del Cerro", owner: "Luis Romero", email: "luis@cabanas.com", category: "Alojamiento", zone: "Potrero", photo: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=400", enabled: true, tax_due: "2026-05-15", tax_amount: 12500, tax_paid: false },
  { id: "ac2", name: "La Posta del Virrey", owner: "Marta Sosa", email: "marta@laposta.com", category: "Gastronomía", zone: "Potrero", photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400", enabled: true, tax_due: "2026-06-01", tax_amount: 8200, tax_paid: true },
  { id: "ac3", name: "Hostería Sierras", owner: "Pedro Díaz", email: "pedro@sierras.com", category: "Alojamiento", zone: "La Toma", photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400", enabled: false, tax_due: "2026-04-30", tax_amount: 15000, tax_paid: false },
];

// Ratings de lugares (mock)
export const initial_ratings: Record<string, number[]> = {
  "1": [5, 4, 5], "2": [5, 5, 4, 5], "3": [4, 5], "5": [5, 4],
};
