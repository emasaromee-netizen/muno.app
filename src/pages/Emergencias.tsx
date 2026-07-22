import { useEffect, useState, useContext } from "react";
import { Phone, Heart, Shield, Flame, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Inyectamos el contexto de forma segura para obtener la jurisdicción
import MunicipalityContext from "@/context/MunicipalityContext";

// Interfaces estrictas para evitar 'any'
interface MunicipalityContextType {
  id?: string;
  name?: string;
}

export default function Emergencias() {
  const ctx = (useContext(MunicipalityContext) as unknown) as MunicipalityContextType | null;
  const municipalityId = ctx?.id || null;
  const municipalityName = ctx?.name || "tu municipio";

  const [muniPhone, setMuniPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPhone = async () => {
      if (!municipalityId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // 🔴 FIX TS: Le decimos al compilador que es la tabla original para que valide los tipos,
        // pero le pasamos el nombre de la vista ("settings_public") para evadir el bloqueo RLS de Supabase.
        const viewName = "settings_public" as "municipal_settings";

        const { data, error } = await supabase
          .from(viewName)
          .select("emergency_phone")
          .eq("municipality_id", municipalityId)
          .maybeSingle();

        if (!error && isMounted && data) {
          setMuniPhone(data.emergency_phone);
        }
      } catch (err) {
        console.error("Error al cargar teléfono de emergencia:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPhone();

    return () => {
      isMounted = false;
    };
  }, [municipalityId]);

  // Lista base de números nacionales fijos (Universales para Argentina)
  const baseItems = [
    { label: "Emergencias Médicas (SAME)", number: "107", icon: Heart, hint: "Atención médica urgente" },
    { label: "Policía", number: "911", icon: Shield, hint: "Fuerza de seguridad provincial" },
    { label: "Bomberos Voluntarios", number: "100", icon: Flame, hint: `Cuartel local` },
    { label: "Defensa Civil", number: "103", icon: Building2, hint: "Protección civil" },
  ];

  // Si el municipio configuró un teléfono de emergencia propio, lo adjuntamos dinámicamente
  const items = muniPhone
    ? [...baseItems, { label: `Municipalidad de ${municipalityName}`, number: muniPhone, icon: Building2, hint: "Atención al vecino" }]
    : baseItems;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-isa-navy font-display font-extrabold text-[20px]">Emergencias</h1>
        <p className="text-sm text-muted-foreground">Llamada directa, 24 horas. {municipalityName}.</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-6 h-6 animate-spin text-isa-navy" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <a
              key={it.label}
              href={`tel:${it.number}`}
              className="flex items-center gap-4 p-4 rounded-[16px] min-h-[64px] hover:opacity-90 transition-opacity"
              style={{ background: "#FEE2E2" }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center text-[hsl(var(--muno-red))] shrink-0 shadow-sm">
                <it.icon strokeWidth={1.5} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-isa-navy text-sm">{it.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{it.hint}</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-full bg-[hsl(var(--muno-red))] text-white text-sm font-extrabold shrink-0 shadow-sm">
                <Phone className="w-4 h-4" /> {it.number}
              </div>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-center text-muted-foreground pt-2">
        En caso de emergencia, mantené la calma e indicá tu ubicación exacta.
      </p>
    </div>
  );
}