import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, routeForRoles } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

const passwordRule = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, "DNI inválido (solo números, 7 a 9 dígitos)"),
  email: z.string().trim().email("Email inválido").max(255),
  password: passwordRule,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Debés aceptar los Términos" }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: "Debés aceptar la Privacidad" }) }),
  acceptIntegrity: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar el compromiso de convivencia" }),
  }),
});

function passwordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invitedEmail = params.get("email") || "";
  const inviteToken = params.get("invite") || "";
  const { user, roles, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptIntegrity, setAcceptIntegrity] = useState(false);
  const [acceptNotifications, setAcceptNotifications] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (inviteToken) navigate(`/invitacion/${inviteToken}`, { replace: true });
      else navigate(routeForRoles(roles), { replace: true });
    }
  }, [user, roles, loading, navigate, inviteToken, roles]);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"][strength];
  const strengthColor = [
    "hsl(var(--muno-red))",
    "hsl(var(--muno-red))",
    "hsl(var(--muno-amber))",
    "hsl(var(--muno-teal))",
    "hsl(var(--muno-emerald))",
  ][strength];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({
      fullName,
      dni,
      email,
      password,
      acceptTerms,
      acceptPrivacy,
      acceptIntegrity,
    });
    if (!parsed.success) {
      toast({
        title: "Revisá el formulario",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.fullName,
          dni: parsed.data.dni,
          notifications_opt_in: acceptNotifications,
        },
      },
    });
    if (error) {
      setSubmitting(false);
      const msg = error.message.includes("already")
        ? "Ese email ya está registrado. Probá iniciar sesión."
        : error.message;
      toast({ title: "No pudimos crear la cuenta", description: msg, variant: "destructive" });
      return;
    }

    // Guardar DNI en el perfil (el trigger ya creó la fila con full_name/email)
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ dni: parsed.data.dni, full_name: parsed.data.fullName })
        .eq("id", data.user.id);
    }

    // Si por configuración no quedó sesión activa, intentamos iniciar sesión
    // automáticamente para evitar el re-login manual.
    if (!data.session) {
      await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
    }

    setSubmitting(false);
    toast({
      title: "¡Bienvenido a MUNO+!",
      description: "Tu cuenta fue creada y ya estás dentro.",
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-isa-light grid place-items-center p-4">
      <div className="w-full max-w-[420px] bg-card rounded-[20px] shadow-xl p-7 space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-[16px] bg-isa-navy text-isa-white items-center justify-center font-display font-extrabold text-xl mx-auto">
            M
          </div>
          <h1 className="font-display text-[22px] font-extrabold text-isa-navy">Crear cuenta</h1>
          <p className="text-[12px] text-muted-foreground">Sumate a MUNO+ como vecino verificado</p>
        </div>

        <div
          className="rounded-[14px] p-3 flex gap-2 text-[11px] leading-snug"
          style={{ background: "hsl(var(--isa-light))", border: "1px solid hsl(var(--border))" }}
        >
          <ShieldCheck className="w-4 h-4 text-isa-navy shrink-0 mt-0.5" />
          <p className="text-isa-navy">
            <strong>Comunidad verificada.</strong> Verificamos los perfiles para proteger la
            integridad de la comunidad. <strong>No se permite violencia política</strong> ni
            discursos de odio. El municipio puede suspender cuentas que vulneren estas reglas.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre completo">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-sm"
              required
            />
          </Field>
          <Field label="DNI (sin puntos)">
            <input
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-sm"
              placeholder="Ej: 30123456"
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              autoComplete="email"
              className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-sm"
              required
            />
          </Field>
          <Field label="Contraseña">
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-[16px] border border-border bg-card pl-4 pr-12 py-3 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muno-blue"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? "Ocultar" : "Ver"}
              </button>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ background: i < strength ? strengthColor : "hsl(var(--border))" }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {password ? strengthLabel : "Mín. 8 caracteres, una mayúscula y un número"}
            </p>
          </Field>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 text-[12px] text-isa-navy cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-isa-navy"
              />
              <span>
                Acepto los{" "}
                <Link to="/legal/terminos" target="_blank" className="font-bold underline">
                  Términos de ISA Business Consulting
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-[12px] text-isa-navy cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-isa-navy"
              />
              <span>
                Acepto la{" "}
                <Link to="/legal/privacidad" target="_blank" className="font-bold underline">
                  Política de Privacidad de ISA
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-[12px] text-isa-navy cursor-pointer">
              <input
                type="checkbox"
                checked={acceptIntegrity}
                onChange={(e) => setAcceptIntegrity(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-isa-navy"
              />
              <span>
                Me comprometo a una <strong>convivencia respetuosa</strong>: sin violencia
                política, sin agresiones ni discursos de odio.
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-[12px] text-isa-navy cursor-pointer">
              <input
                type="checkbox"
                checked={acceptNotifications}
                onChange={(e) => setAcceptNotifications(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-isa-navy"
              />
              <span className="text-muted-foreground">
                Quiero recibir <strong className="text-isa-navy">novedades del municipio</strong>{" "}
                por email <span className="text-[10px]">(opcional)</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-isa-navy text-isa-white rounded-[16px] py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cuenta y entrar
          </button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link to="/auth/login" className="font-bold text-isa-navy">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
