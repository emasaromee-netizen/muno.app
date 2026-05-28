import { useEffect, useRef, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, User, Store, LogOut, Camera, Loader2 } from "lucide-react";
import MisInscripciones from "@/components/MisInscripciones";
import RatePueblo from "@/components/RatePueblo";
import MisFavoritos from "@/components/MisFavoritos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MiCuenta() {
  const { role, setRole } = useRole();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isComercio = role === "comercio";
  const toggle = () => setRole(isComercio ? "vecino" : "comercio");

  const [profile, setProfile] = useState<{ full_name?: string | null; email?: string | null; phone?: string | null; avatar_url?: string | null; cuit?: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cuitDraft, setCuitDraft] = useState("");
  const [savingCuit, setSavingCuit] = useState(false);
  const [business, setBusiness] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,email,phone,avatar_url,cuit" as any).eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data as any);
      setCuitDraft((data as any)?.cuit || "");
    });
  }, [user]);

  useEffect(() => {
    const cuit = profile?.cuit?.trim();
    if (!cuit) { setBusiness(null); return; }
    (supabase.from("businesses") as any).select("id,name,tax_expires_at,tax_amount,enabled").eq("cuit", cuit).maybeSingle().then(({ data }: any) => {
      setBusiness(data);
    });
  }, [profile?.cuit]);

  const saveCuit = async () => {
    if (!user) return;
    setSavingCuit(true);
    const { error } = await supabase.from("profiles").update({ cuit: cuitDraft.trim() || null } as any).eq("id", user.id);
    setSavingCuit(false);
    if (error) toast.error("No se pudo guardar el CUIT");
    else {
      toast.success("CUIT guardado");
      setProfile((p) => ({ ...(p || {}), cuit: cuitDraft.trim() || null }));
    }
  };

  const onPick = () => fileRef.current?.click();

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profiles").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error("No se pudo subir la foto");
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("profiles").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (updErr) {
      toast.error("No se guardó la foto en tu perfil");
    } else {
      setProfile((p) => ({ ...(p || {}), avatar_url: url }));
      toast.success("Foto actualizada");
    }
    setUploading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/auth/login");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Vecino MUNO";
  const displayEmail = profile?.email || user?.email || "—";
  const displayPhone = profile?.phone || "—";
  const initial = (displayName[0] || "V").toUpperCase();

  return (
    <div className="space-y-5">
      <div className="isa-card p-6 flex items-center gap-4">
        <div className="relative">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Foto de perfil" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-isa-navy text-isa-white grid place-items-center text-2xl font-extrabold">{initial}</div>
          )}
          {user && (
            <button
              onClick={onPick}
              disabled={uploading}
              aria-label="Cambiar foto"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-isa-navy text-white grid place-items-center shadow-md disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-extrabold text-isa-navy truncate">{displayName}</div>
          <div className="text-sm text-muted-foreground capitalize">Perfil: {role}</div>
        </div>
      </div>

      <div className="isa-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muno-blue/10 text-muno-blue grid place-items-center"><Store strokeWidth={1.5} /></div>
            <div>
              <div className="font-extrabold text-isa-navy">Mi Comercio</div>
              <div className="text-xs text-muted-foreground">Activá el panel de gestión si sos dueño de un negocio (cabaña, restaurante, etc.).</div>
            </div>
          </div>
          <button onClick={toggle} className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${isComercio ? "bg-muno-teal" : "bg-muted"}`} aria-label="Activar Mi Comercio">
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isComercio ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="isa-card p-6 space-y-4">
        <h3 className="font-extrabold text-isa-navy">Datos personales</h3>
        {[
          { icon: User, label: "Nombre", value: displayName },
          { icon: Mail, label: "Email", value: displayEmail },
          { icon: Phone, label: "Teléfono", value: displayPhone },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-3 py-2 border-b last:border-0">
            <f.icon strokeWidth={1.5} className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="font-semibold text-isa-navy">{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <div className="isa-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muno-blue/10 text-muno-blue grid place-items-center"><Store strokeWidth={1.5} /></div>
            <div>
              <div className="font-extrabold text-isa-navy">Estado de tasas (Hacienda)</div>
              <div className="text-[11px] text-muted-foreground">Vinculá tu CUIT para ver el estado de tu comercio.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={cuitDraft}
              onChange={(e) => setCuitDraft(e.target.value)}
              placeholder="CUIT (ej. 30-12345678-9)"
              className="flex-1 px-3 py-2 rounded-xl border bg-background text-sm"
            />
            <button onClick={saveCuit} disabled={savingCuit} className="bg-isa-navy text-white rounded-xl px-4 text-sm font-bold disabled:opacity-60">
              {savingCuit ? "…" : "Guardar"}
            </button>
          </div>
          {profile?.cuit && !business && (
            <div className="text-[12px] text-muted-foreground">No encontramos un comercio asociado a este CUIT.</div>
          )}
          {business && (() => {
            const exp = business.tax_expires_at ? new Date(business.tax_expires_at) : null;
            const overdue = exp && exp.getTime() < Date.now();
            const soon = exp && !overdue && exp.getTime() - Date.now() < 15 * 86400000;
            const status = overdue ? "Vencida" : soon ? "Por vencer" : "Al día";
            const color = overdue ? "text-muno-red bg-muno-red/10" : soon ? "text-amber-700 bg-amber-100" : "text-muno-teal bg-muno-teal/10";
            return (
              <div className="rounded-xl border p-3 space-y-1">
                <div className="font-bold text-isa-navy">{business.name}</div>
                <div className="text-xs text-muted-foreground">
                  Vencimiento: {exp ? exp.toLocaleDateString("es-AR") : "—"}
                  {business.tax_amount ? ` · $${Number(business.tax_amount).toLocaleString("es-AR")}` : ""}
                </div>
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>{status}</span>
                <div className="text-[11px] text-muted-foreground pt-1">Información a cargo de Hacienda. Para regularizar acercate a la oficina municipal.</div>
              </div>
            );
          })()}
        </div>
      )}

      {role === "turista" && (
        <>
          <MisFavoritos />
          <RatePueblo />
        </>
      )}

      <MisInscripciones />

      {user && (
        <button
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 bg-muno-red text-white rounded-[20px] py-3 font-bold text-sm hover:opacity-90"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      )}
    </div>
  );
}
