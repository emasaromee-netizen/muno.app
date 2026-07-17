import { Navigate, useLocation } from "react-router-dom";
import { useAuth, routeForRoles } from "@/context/AuthContext";
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";

// Extraemos los roles oficiales del motor 'can' para que el prop 'allowed' sea estricto
type AppRole = Parameters<typeof can>[0][number];

export default function ProtectedRoute({
  children,
  allowed,
  allowedAreas,
}: {
  children: React.ReactNode;
  allowed?: AppRole[];
  allowedAreas?: string[];
}) {
  const { user, roles, area, loading } = useAuth();
  const location = useLocation();

  // Mapeamos los roles del string array genérico al AppRole estricto
  const safeRoles = roles as AppRole[];

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-isa-light">
        <div className="w-10 h-10 border-2 border-isa-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // Si el usuario es SysAdmin (SuperAdmin / ISA), pasa directo por cualquier ruta
  if (can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN)) {
    return <>{children}</>;
  }

  // Bloqueo 1: Por Rol
  if (allowed && !allowed.some((r) => safeRoles.includes(r))) {
    return <Navigate to={routeForRoles(roles)} replace />;
  }

  // Bloqueo 2: Por Área de incumbencia
  // Solo se aplica si la ruta define 'allowedAreas' y si el usuario no tiene permisos para ver TODO el sistema.
  if (allowedAreas && allowedAreas.length > 0) {
    const canBypassAreas = 
      roles.includes("mayor") || 
      roles.includes("tourism_chief") || 
      can(safeRoles, area, PERMISSIONS.SYSTEM_ADMIN);

    if (!canBypassAreas && roles.includes("area_manager") && area && !allowedAreas.includes(area)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}