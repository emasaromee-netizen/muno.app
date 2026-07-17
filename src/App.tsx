import React, { Component, ErrorInfo, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BannersProvider } from "@/context/BannersContext";
import { AuthProvider } from "@/context/AuthContext";
import { PreviewProvider } from "@/context/PreviewContext";
import { MunicipalityProvider } from "@/context/MunicipalityContext";
import PreviewSwitcher from "@/components/PreviewSwitcher";
import AppLayout from "@/components/AppLayout";
import AdminShell from "@/components/admin/AdminShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Turismo from "./pages/Turismo";
import GuiaVecinal from "./pages/GuiaVecinal";
import Eventos from "./pages/Eventos";
import WifiAccess from "./pages/WifiAccess";
import Lugares from "./pages/Lugares";
import Cultura from "./pages/Cultura";
import Deporte from "./pages/Deporte";
import Reclamos from "./pages/Reclamos";
import Emergencias from "./pages/Emergencias";
import TouristGate from "./components/TouristGate";
import MiCuenta from "./pages/MiCuenta";
import MiComercio from "./pages/MiComercio";
import AdminLugares from "./pages/admin/AdminLugares";
import AdminWifi from "./pages/admin/AdminWifi";
import AdminDeporte from "./pages/admin/AdminDeporte";
import AdminCultura from "./pages/admin/AdminCultura";
import AdminReclamos from "./pages/admin/AdminReclamos";
import AdminArea from "./pages/admin/AdminArea";
import AdminColaboradores from "./pages/admin/AdminColaboradores";
import AdminContenido from "./pages/admin/AdminContenido";
import AdminComercios from "./pages/admin/AdminComercios";
import AdminMetricas from "./pages/admin/AdminMetricas";
import AdminMetricasInput from "./pages/admin/AdminMetricasInput";
import AdminTareas from "./pages/admin/AdminTareas";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminTurismo from "./pages/admin/AdminTurismo";
import TurismoPanel from "./pages/admin/Turismo";
import IntendenteDashboard from "./pages/admin/IntendenteDashboard";
import AdminNovedadesJefes from "./pages/admin/AdminNovedadesJefes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAuditoria from "./pages/admin/AdminAuditoria";
import AdminUsuariosMunicipales from "./pages/admin/AdminUsuariosMunicipales";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion";
import IsaPanel from "./pages/isa/IsaPanel";
import IsaGlobalPanel from "./pages/isa/IsaGlobalPanel";
import ReclamoDetalle from "./pages/ReclamoDetalle";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { Terminos, Privacidad } from "./pages/legal/Legales";
import ClaimInvitation from "./pages/auth/ClaimInvitation";
import NotFound from "./pages/NotFound";

// --- INYECCIÓN M-10 & M-12: ErrorBoundary con Observabilidad ---
interface ErrorProps {
  children: ReactNode;
}

interface ErrorState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorProps, ErrorState> {
  public state: ErrorState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorState {
    return { hasError: true };
  }

  // SOLUCIÓN M-12: Persistencia asíncrona de Crash Logs en Supabase
  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRASH DETECTADO] MUNO+ Error:", error, errorInfo);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("municipality_id")
          .eq("id", user.id)
          .maybeSingle();

        const userMuniId = profile?.municipality_id || null;

        await supabase.from("activity_logs").insert({
          user_id: user.id,
          user_email: user.email ?? null,
          action: "FRONTEND_CRASH",
          entity: "ErrorBoundary",
          entity_id: error.name || "ReactError",
          meta: {
            message: error.message,
            stack: error.stack || null,
            componentStack: errorInfo.componentStack || null,
            url: window.location.href,
            userAgent: navigator.userAgent
          },
          ...(userMuniId ? { municipality_id: userMuniId } : {})
        });
      }
    } catch (err) {
      console.warn("[OBSERVABILIDAD] No se pudo persistir el reporte de error en Supabase:", err);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-isa-light text-center select-none">
          <div className="isa-card p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-xl bg-muno-red/10 text-muno-red grid place-items-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-isa-navy">Inconveniente técnico</h3>
              <p className="text-xs text-muted-foreground mt-1">La aplicación móvil experimentó un error inesperado al procesar la información.</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="w-full bg-isa-navy text-white rounded-[14px] py-2.5 text-xs font-bold min-h-[44px]"
            >
              Reiniciar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PreviewProvider>
              <MunicipalityProvider>
                <BannersProvider>
                  <PreviewSwitcher />
                  <Routes>
                    {/* Públicas */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />
                    <Route path="/auth/forgot" element={<ForgotPassword />} />
                    <Route path="/auth/reset" element={<ResetPassword />} />
                    <Route path="/legal/terminos" element={<Terminos />} />
                    <Route path="/legal/privacidad" element={<Privacidad />} />
                    <Route path="/invitacion/:token" element={<ClaimInvitation />} />

                    {/* Panel ISA dedicado */}
                    <Route
                      path="/isa/panel"
                      element={
                        <ProtectedRoute allowed={["isa_consultant", "isa_super_admin"]}>
                          <IsaPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/isa/global"
                      element={
                        <ProtectedRoute allowed={["isa_super_admin"]}>
                          <IsaGlobalPanel />
                        </ProtectedRoute>
                      }
                    />

                    {/* Backoffice Web (Sidebar Navy) */}
                    <Route element={<ProtectedRoute allowed={["admin", "area_manager", "tourism_chief", "mayor"]}><AdminShell /></ProtectedRoute>}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/lugares" element={<ProtectedRoute allowedAreas={["Turismo","Comercios","Intendencia"]}><AdminLugares /></ProtectedRoute>} />
                      <Route path="/admin/wifi" element={<AdminWifi />} />
                      <Route path="/admin/deporte" element={<ProtectedRoute allowedAreas={["Deporte","Intendencia"]}><AdminDeporte /></ProtectedRoute>} />
                      <Route path="/admin/cultura" element={<ProtectedRoute allowedAreas={["Cultura","Intendencia"]}><AdminCultura /></ProtectedRoute>} />
                      <Route path="/admin/reclamos" element={<ProtectedRoute allowedAreas={["Infraestructura","Intendencia"]}><AdminReclamos /></ProtectedRoute>} />
                      <Route path="/admin/area/:area" element={<AdminArea />} />
                      <Route path="/admin/colaboradores" element={<AdminColaboradores />} />
                      <Route path="/admin/contenido" element={<ProtectedRoute allowedAreas={["Cultura","Deporte","Intendencia"]}><AdminContenido /></ProtectedRoute>} />
                      <Route path="/admin/comercios" element={<ProtectedRoute allowedAreas={["Comercios","Intendencia"]}><AdminComercios /></ProtectedRoute>} />
                      <Route path="/admin/metricas" element={<AdminMetricas />} />
                      <Route path="/admin/metricas/cargar" element={<AdminMetricasInput />} />
                      <Route path="/admin/tareas" element={<AdminTareas />} />
                      <Route path="/admin/banners" element={<ProtectedRoute allowedAreas={["Intendencia"]}><AdminBanners /></ProtectedRoute>} />
                      <Route path="/admin/auditoria" element={<AdminAuditoria />} />
                      <Route path="/admin/usuarios" element={<AdminUsuariosMunicipales />} />
                      <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
                      <Route path="/admin/turismo" element={<TurismoPanel />} />
                      <Route path="/admin/guia-turista" element={<TurismoPanel />} />
                      <Route path="/admin/turismo-guia" element={<AdminTurismo />} />
                      <Route path="/admin/intendente" element={<IntendenteDashboard />} />
                      <Route path="/admin/hacienda" element={<ProtectedRoute allowedAreas={["Comercios","Intendencia"]}><AdminComercios /></ProtectedRoute>} />
                      <Route path="/admin/dashboard-intendente" element={<IntendenteDashboard />} />
                      <Route path="/admin/novedades" element={<AdminNovedadesJefes />} />
                    </Route>

                    {/* App protegida (mobile shell) */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/" element={<Index />} />
                      <Route path="/turismo" element={<Turismo />} />
                      <Route path="/guia-vecinal" element={<GuiaVecinal />} />
                      <Route path="/eventos" element={<Eventos />} />
                      <Route path="/wifi-access" element={<WifiAccess />} />
                      <Route path="/lugares" element={<Lugares />} />
                      <Route path="/cultura" element={<Cultura />} />
                      <Route path="/deporte" element={<Deporte />} />
                      <Route path="/reclamos" element={<TouristGate><Reclamos /></TouristGate>} />
                      <Route path="/reclamos/:id" element={<TouristGate><ReclamoDetalle /></TouristGate>} />
                      <Route path="/emergencias" element={<Emergencias />} />
                      <Route path="/mi-cuenta" element={<TouristGate><MiCuenta /></TouristGate>} />
                      <Route path="/mi-comercio" element={<TouristGate><MiComercio /></TouristGate>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BannersProvider>
              </MunicipalityProvider>
            </PreviewProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;