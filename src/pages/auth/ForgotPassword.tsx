import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Email inválido").max(255).safeParse(email);
    if (!parsed.success) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen w-full bg-isa-light grid place-items-center p-4">
      <div className="w-full max-w-[400px] bg-card rounded-[20px] shadow-xl p-7 space-y-5">
        <div className="text-center space-y-2">
          <h1 className="font-display text-[20px] font-extrabold text-isa-navy">Recuperar contraseña</h1>
          <p className="text-[13px] text-muted-foreground">
            Te enviamos un link a tu email para que puedas crear una nueva.
          </p>
        </div>

        {sent ? (
          <div className="bg-isa-light rounded-[16px] p-4 text-center space-y-3">
            <p className="text-[13px] text-isa-navy font-semibold">Revisá tu casilla 📬</p>
            <Link to="/auth/login" className="inline-block text-[12px] font-bold text-muno-blue">
              Volver a ingresar
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
              placeholder="vos@ejemplo.com"
              className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-isa-navy text-isa-white rounded-[16px] py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar link
            </button>
            <Link to="/auth/login" className="block text-center text-[12px] font-bold text-muno-blue">
              Volver
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
