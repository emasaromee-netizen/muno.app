import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const passwordRule = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72)
  .regex(/[A-Z]/, "Debe incluir una mayúscula")
  .regex(/[0-9]/, "Debe incluir un número");

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordRule.safeParse(password);
    if (!parsed.success) {
      toast({ title: "Contraseña débil", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Ya podés ingresar." });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-isa-light grid place-items-center p-4">
      <div className="w-full max-w-[400px] bg-card rounded-[20px] shadow-xl p-7 space-y-5">
        <h1 className="font-display text-[20px] font-extrabold text-isa-navy text-center">
          Nueva contraseña
        </h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            className="w-full rounded-[16px] border border-border bg-card px-4 py-3 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">Mín. 8 caracteres, una mayúscula y un número.</p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-isa-navy text-isa-white rounded-[16px] py-3 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
