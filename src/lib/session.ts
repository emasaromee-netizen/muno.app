import { useAuth } from "@/context/AuthContext";
import { usePreview } from "@/context/PreviewContext";
import { useRole } from "@/context/RoleContext";

/**
 * Devuelve si el usuario tiene "sesión efectiva" (logueado o demo no-turista).
 * Turistas (sin login o preview=turista) NO ven funciones de gestión.
 */
export function useSession() {
  const { user } = useAuth();
  const { preview } = usePreview();
  const { role } = useRole();

  const isPreviewTurista = preview === "turista";
  const isAnonymous = !user && !preview;
  const isTourist = isAnonymous || isPreviewTurista || role === "turista";
  const isLoggedIn = !isTourist;

  return { isLoggedIn, isTourist, role };
}
