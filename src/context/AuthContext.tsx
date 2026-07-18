import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole =
  | "tourist"
  | "resident"
  | "merchant"
  | "admin"
  | "area_manager"
  | "isa_consultant"
  | "isa_super_admin"
  | "tourism_chief"
  | "mayor";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  area: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  roles: [],
  area: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [area, setArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer to avoid deadlock
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
        setArea(null);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRoles(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role, area")
      .eq("user_id", uid)
      .eq("active", true); // Corrección quirúrgica P0: impide bypass de roles inactivos

    // Tipado estricto para eliminar el error de 'any'
    const rows = (data || []) as { role: AppRole; area: string | null }[];
    
    setRoles(rows.map((r) => r.role));
    const mgr = rows.find((r) => r.role === "area_manager" && r.area);
    setArea(mgr?.area ?? null);
  };

  const signOut = async () => {
    // 1. Destruimos la sesión en el backend
    await supabase.auth.signOut();
    
    // 2. Limpieza profunda global de la memoria del navegador (Red Team Fix)
    localStorage.removeItem("muno.inscripciones.v1");
    localStorage.removeItem("muno.guest.notif.reads");
    localStorage.removeItem("supabase.auth.token");
  };

  return (
    <Ctx.Provider value={{ user, session, roles, area, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

// Silenciamos la advertencia de react-refresh de forma segura para las exportaciones del Contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

// eslint-disable-next-line react-refresh/only-export-components
export function routeForRoles(roles: AppRole[]): string {
  if (roles.includes("isa_super_admin")) return "/isa/global";
  if (roles.includes("isa_consultant")) return "/isa/panel";
  if (
    roles.includes("admin") || 
    roles.includes("area_manager") || 
    roles.includes("mayor") || 
    roles.includes("tourism_chief")
  ) return "/admin/dashboard";
  
  return "/";
}