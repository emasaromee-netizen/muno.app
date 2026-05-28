import { Phone, Heart, Shield, Flame, Building2 } from "lucide-react";

const ITEMS = [
  { label: "Emergencias Médicas (SAME)", number: "107", icon: Heart, hint: "Hospital San Francisco" },
  { label: "Policía", number: "911", icon: Shield, hint: "Comisaría 14ª SFMO" },
  { label: "Bomberos Voluntarios", number: "100", icon: Flame, hint: "San Francisco del Monte de Oro" },
  { label: "Defensa Civil", number: "103", icon: Building2, hint: "Provincia de San Luis" },
  { label: "Municipalidad SFMO", number: "+542656493007", icon: Building2, hint: "Atención al vecino" },
];

export default function Emergencias() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-isa-navy font-display font-extrabold text-[20px]">Emergencias</h1>
        <p className="text-sm text-muted-foreground">Llamada directa, 24 horas. San Francisco del Monte de Oro.</p>
      </header>
      <div className="space-y-3">
        {ITEMS.map((it) => (
          <a
            key={it.label}
            href={`tel:${it.number}`}
            className="flex items-center gap-4 p-4 rounded-[16px] min-h-[64px]"
            style={{ background: "#FEE2E2" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center text-[hsl(var(--muno-red))] shrink-0">
              <it.icon strokeWidth={1.5} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-isa-navy text-sm">{it.label}</div>
              <div className="text-[11px] text-muted-foreground truncate">{it.hint}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-full bg-[hsl(var(--muno-red))] text-white text-sm font-extrabold shrink-0">
              <Phone className="w-4 h-4" /> {it.number}
            </div>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-center text-muted-foreground pt-2">
        En caso de emergencia, mantené la calma e indicá tu ubicación exacta.
      </p>
    </div>
  );
}
