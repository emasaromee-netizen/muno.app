import { useState } from "react";
import { X } from "lucide-react";
import { ORIGINS } from "@/data/mock";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  title: string;
  description: string;
  fields: ("name" | "email" | "origin")[];
  kind: "wifi_lead" | "reserva_lead" | "rating";
  meta?: Record<string, any>;
  onClose: () => void;
  onSuccess?: (data: { name?: string; email?: string; origin?: string }) => void;
}

export default function LeadDialog({ open, title, description, fields, kind, meta, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const valid =
    (!fields.includes("name") || name.trim().length > 1) &&
    (!fields.includes("email") || /\S+@\S+\.\S+/.test(email)) &&
    (!fields.includes("origin") || !!origin);

  const submit = async () => {
    setBusy(true);
    track({ kind, origin, meta: { ...meta, name, email } });
    if (kind === "wifi_lead" || kind === "reserva_lead") {
      try {
        await supabase.from("tourist_leads").insert({
          name: name || "Anónimo",
          origin: origin || "Sin especificar",
          email: email || null,
          source: kind,
          meta: meta || {},
        });
      } catch (_) {
        // silent
      }
    }
    toast.success("¡Listo! Recibimos tu consulta.");
    onSuccess?.({ name, email, origin });
    setName(""); setEmail(""); setOrigin("");
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
      <div className="isa-card p-6 max-w-sm w-full animate-scale-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-extrabold text-isa-navy">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2.5">
          {fields.includes("name") && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
          )}
          {fields.includes("email") && (
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
          )}
          {fields.includes("origin") && (
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm">
              <option value="">¿Desde qué ciudad/provincia?</option>
              {ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
        <button onClick={submit} disabled={!valid || busy} className="mt-4 w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm disabled:opacity-40">
          {busy ? "Enviando…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
