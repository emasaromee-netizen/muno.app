import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "admin" | "vecino" | "turista" | "comercio" | "encargado_comercio";
export type AdminArea = "Cultura" | "Turismo" | "Deporte" | "Infraestructura" | "Comercios" | "Intendencia";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  adminArea: AdminArea;
  setAdminArea: (a: AdminArea) => void;
}

const Ctx = createContext<RoleCtx>({ role: "vecino", setRole: () => {}, adminArea: "Intendencia", setAdminArea: () => {} });

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>("vecino");
  const [adminArea, setAdminArea] = useState<AdminArea>("Intendencia");
  return <Ctx.Provider value={{ role, setRole, adminArea, setAdminArea }}>{children}</Ctx.Provider>;
};

export const useRole = () => useContext(Ctx);

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  vecino: "Vecino",
  turista: "Turista",
  comercio: "Comercio",
  encargado_comercio: "Enc. Comercio",
};
