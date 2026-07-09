import { getPermissions, type Permission } from "./permissions";
import type { AppRole } from "@/context/AuthContext";

export function can(
  roles: AppRole[],
  area: string | null,
  permission: Permission
): boolean {
  return getPermissions(roles, area).has(permission);
}