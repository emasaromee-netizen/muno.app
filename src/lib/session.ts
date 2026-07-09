import { useAuth } from "@/context/AuthContext";
import { usePreview } from "@/context/PreviewContext";

/**
 * Determina la sesión efectiva de la aplicación.
 *
 * Preview solo afecta la interfaz cuando NO hay sesión iniciada.
 * Los permisos siempre provienen de Supabase.
 */
export function useSession() {
  const { user, roles } = useAuth();
  const { preview } = usePreview();

  // Usuario autenticado
  if (user) {
    const isResident = roles.includes("resident");
    const isTourist = !isResident;

    return {
      isLoggedIn: true,
      isTourist,
      roles,
    };
  }

  // Usuario sin login (modo preview o visitante)
  const isPreviewTourist = preview === "turista";

  return {
    isLoggedIn: false,
    isTourist: isPreviewTourist || !preview,
    roles: [],
  };
}