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
    
    // 🔴 FIX AUDITORÍA: Detectamos a todo el Staff y Comercios para no bloquearlos
    const isStaffOrMerchant = roles.some(r => 
      ["admin", "mayor", "tourism_chief", "area_manager", "merchant", "isa_super_admin", "isa_consultant"].includes(r)
    );
    
    // Si no es residente y tampoco es del staff, entonces SÍ es turista
    const isTourist = !isResident && !isStaffOrMerchant;

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