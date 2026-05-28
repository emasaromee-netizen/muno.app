import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, routeForRoles } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(1, "Ingresá tu contraseña").max(72),
});

export default function Login() {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(routeForRoles(roles), { replace: true });
  }, [user, roles, loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: email.trim().toLowerCase(), password });
    if (!parsed.success) {
      toast({ title: "Error", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "No pudimos ingresar",
        description: error.message.includes("Invalid")
          ? "Email o contraseña incorrectos."
          : error.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      toast({ title: "Error con Google", description: String(r.error), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-isa-light grid place-items-center p-4">
      <div className="w-full max-w-[400px] bg-card rounded-[20px] shadow-xl p-7 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-[18px] bg-isa-navy text-isa-white items-center justify-center font-display font-extrabold text-2xl mx-auto">
            M
          </div>
          <h1 className="font-display text-[28px] font-extrabold text-isa-navy tracking-tight">MUNO+</h1>
          <p className="text-[13px] text-muted-foreground">La huella digital de tu comunidad</p>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-border rounded-[16px] py-3 text-sm font-bold text-isa-navy flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          <GoogleIcon /> Continuar con Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-bold uppercase">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Email</label>
            <div className="relative">
              <Mail strokeWidth={1.5} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[16px] border border-border bg-card pl-10 pr-4 py-3 text-sm"
                placeholder="vos@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Contraseña</label>
            <div className="relative">
              <Lock strokeWidth={1.5} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[16px] border border-border bg-card pl-10 pr-11 py-3 text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-isa-navy"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/auth/forgot" className="text-[12px] font-bold text-muno-blue">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-isa-navy text-isa-white rounded-[16px] py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Ingresar
          </button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link to="/auth/signup" className="font-bold text-isa-navy">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.5-4.5 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2c-.4.4 6.7-4.9 6.7-14.8 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
