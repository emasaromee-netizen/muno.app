import { Link } from "react-router-dom";
import { Lock, UserPlus } from "lucide-react";
import { useSession } from "@/lib/session";

export default function TouristGate({
  children,
  title = "Función exclusiva para residentes",
  message = "Esta sección es para vecinos registrados. Registrate y mejorá tu ciudad en pocos minutos.",
}: {
  children: React.ReactNode;
  title?: string;
  message?: string;
}) {
  const { isTourist } = useSession();
  if (!isTourist) return <>{children}</>;

  return (
    <div className="max-w-md mx-auto isa-card p-8 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-isa-light grid place-items-center text-isa-navy">
        <Lock strokeWidth={1.5} className="w-7 h-7" />
      </div>
      <h2 className="font-display font-extrabold text-isa-navy text-[20px] mt-4">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
      <Link
        to="/auth/signup"
        className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold text-sm"
      >
        <UserPlus className="w-4 h-4" /> Registrarme
      </Link>
      <Link to="/auth/login" className="mt-3 inline-block text-xs text-muted-foreground underline">
        Ya tengo cuenta
      </Link>
    </div>
  );
}
