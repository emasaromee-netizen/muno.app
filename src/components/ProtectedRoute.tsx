import { Navigate, useLocation } from "react-router-dom";
import { useAuth, routeForRoles } from "@/context/AuthContext";
import { usePreview } from "@/context/PreviewContext";

export default function ProtectedRoute({
  children,
  allowed,
  allowedAreas,
}: {
  children: React.ReactNode;
  allowed?: ("resident" | "tourist" | "admin" | "area_manager" | "isa_consultant" | "isa_super_admin" | "tourism_chief" | "mayor")[];
  allowedAreas?: string[];
}) {
  const { user, roles, area, loading } = useAuth();
  const { preview } = usePreview();
  const location = useLocation();

  // Demo/preview mode bypasses auth completely
  if (preview) return <>{children}</>;

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

  // MODO PRUEBA: admin puede navegar libremente por todas las rutas /admin/*
  const isAdminRole = roles.includes("admin") || roles.includes("isa_super_admin");
  if (isAdminRole) return <>{children}</>;

  if (allowed && !allowed.some((r) => roles.includes(r))) {
    return <Navigate to={routeForRoles(roles)} replace />;
  }

  // Area-based gate: only restricts when user is exclusively area_manager (not admin/mayor/tourism_chief)
  if (allowedAreas && allowedAreas.length > 0) {
    const isPrivileged = roles.includes("mayor") || roles.includes("tourism_chief");
    if (!isPrivileged && roles.includes("area_manager") && area && !allowedAreas.includes(area)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}

