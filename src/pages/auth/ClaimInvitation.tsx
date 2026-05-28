import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ClaimInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("municipal_invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setError("Invitación no encontrada o no válida.");
      } else if (data.status === "accepted") {
        setError("Esta invitación ya fue aceptada.");
      } else if (new Date(data.expires_at) < new Date()) {
        setError("Esta invitación venció. Pedile al intendente que te envíe una nueva.");
      } else {
        setInvite(data);
      }
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!user) {
      toast.info("Iniciá sesión o registrate primero", {
        description: `Usá el email ${invite.email}.`,
      });
      navigate(`/auth/signup?email=${encodeURIComponent(invite.email)}&invite=${token}`);
      return;
    }
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error("Email distinto", {
        description: `Esta invitación es para ${invite.email}.`,
      });
      return;
    }
    setAccepting(true);
    // Crear el rol
    const { error: roleErr } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role: invite.role,
      area: invite.area,
    });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      setAccepting(false);
      toast.error("No se pudo asignar el rol", { description: roleErr.message });
      return;
    }
    await supabase
      .from("municipal_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", invite.id);
    setAccepting(false);
    toast.success("¡Listo! Bienvenido al equipo municipal.");
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-isa-light grid place-items-center p-4">
      <div className="w-full max-w-[440px] bg-card rounded-[20px] shadow-xl p-7 space-y-5">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-isa-navy text-white items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-[22px] font-extrabold text-isa-navy mt-3">
            Invitación municipal
          </h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Validando…
          </div>
        )}

        {!loading && error && (
          <div className="bg-muno-red/10 text-muno-red rounded-xl p-4 flex gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!loading && invite && (
          <>
            <div className="space-y-2 text-sm">
              <Row k="Email" v={invite.email} />
              <Row k="Rol" v={invite.role === "admin" ? "Intendente" : invite.role === "area_manager" ? "Jefe de área" : "Colaborador"} />
              {invite.area && <Row k="Área" v={invite.area} />}
              <Row k="Invita" v={invite.invited_by_email || "Municipio"} />
            </div>
            <button
              onClick={accept}
              disabled={accepting}
              className="w-full bg-isa-navy text-white rounded-[16px] py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {accepting && <Loader2 className="w-4 h-4 animate-spin" />}
              {user ? "Aceptar invitación" : "Registrarme y aceptar"}
            </button>
            {user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
              <p className="text-[11px] text-muno-red text-center">
                Estás logueado con otro email. Cerrá sesión y volvé a entrar con {invite.email}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold text-isa-navy">{v}</span>
    </div>
  );
}
