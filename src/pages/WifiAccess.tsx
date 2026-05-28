import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Lock, Check, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ORIGINS } from "@/data/mock";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

const MUNI_SSID = "MUNO-Plaza";
const MUNI_PASSWORD = "PLAZA-SFMO-2026";

export default function WifiAccess() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isLogged = !!user;
  const isResident = roles.includes("resident");

  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [originOther, setOriginOther] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(isLogged);

  const isOther = origin === "Otro";
  const valid =
    name.trim().length > 1 &&
    !!origin &&
    (!isOther || originOther.trim().length > 1) &&
    /\S+@\S+\.\S+/.test(email);

  const handleConnect = async () => {
    if (!valid) return;
    setBusy(true);
    const finalOrigin = isOther ? `Otro · ${originOther.trim()}` : origin;
    track({ kind: "wifi_lead", origin: finalOrigin, meta: { name, email, source: "wifi-access" } });
    try {
      await supabase.from("tourist_leads").insert({
        name,
        origin: finalOrigin,
        email,
        source: "wifi_lead",
        meta: { ssid: MUNI_SSID, origin_other: isOther ? originOther.trim() : null },
      });
    } catch (_) {}
    setBusy(false);
    setRevealed(true);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(MUNI_PASSWORD);
    toast.success("Clave copiada");
  };

  return (
    <div className="space-y-5 max-w-md mx-auto">
      <header className="text-center pt-2">
        <div className="w-16 h-16 rounded-2xl bg-isa-navy text-isa-white grid place-items-center mx-auto">
          <Wifi strokeWidth={1.75} className="w-8 h-8" />
        </div>
        <h1 className="text-isa-navy font-display font-extrabold text-[22px] mt-3">WiFi Municipal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conexión gratuita en la Plaza San Martín y zonas habilitadas.
        </p>
      </header>

      {!revealed && (
        <div className="isa-card p-5 space-y-3">
          <p className="text-xs font-bold text-isa-navy uppercase tracking-wider">
            Datos para conectarse
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
          />
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
          >
            <option value="">Ciudad de origen</option>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {isOther && (
            <input
              value={originOther}
              onChange={(e) => setOriginOther(e.target.value)}
              placeholder="Provincia o país (obligatorio)"
              className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
              required
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm"
          />
          <button
            onClick={handleConnect}
            disabled={!valid || busy}
            className="w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold text-sm disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            {busy ? "Conectando…" : "Conectar"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Usamos tus datos solo para mejorar la oferta turística del municipio.
          </p>
        </div>
      )}

      {revealed && (
        <div
          className="rounded-[16px] p-6 text-center text-isa-white"
          style={{ background: "hsl(var(--isa-navy))" }}
        >
          {isResident && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-full mb-3">
              <Check className="w-3 h-3" /> Bienvenido de nuevo
            </div>
          )}
          <Wifi strokeWidth={1.5} className="w-10 h-10 mx-auto opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80 mt-3">Red WiFi</p>
          <div className="text-lg font-extrabold mt-0.5">{MUNI_SSID}</div>

          <div className="mt-5 bg-white/10 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5 justify-center">
              <Lock className="w-3 h-3" /> Clave de acceso
            </p>
            <div className="text-2xl font-extrabold tracking-[0.2em] mt-1">
              {MUNI_PASSWORD}
            </div>
            <button
              onClick={copyKey}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-white text-isa-navy rounded-full px-3 py-1.5"
            >
              <Copy className="w-3 h-3" /> Copiar clave
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="mt-6 w-full bg-white text-isa-navy rounded-[20px] py-2.5 font-bold text-sm"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}
