import type { AppRole } from "@/context/AuthContext";

export type Permission =
  | "content.create"
  | "content.edit"
  | "content.delete"
  | "content.publish"
  | "tasks.manage"
  | "tasks.delete"
  | "tasks.all_areas"
  | "users.manage"
  | "users.view_all"
  | "analytics.view"
  | "system.admin";

export const PERMISSIONS = {
  CONTENT_CREATE: "content.create",
  CONTENT_EDIT: "content.edit",
  CONTENT_DELETE: "content.delete",
  CONTENT_PUBLISH: "content.publish",

  TASKS_MANAGE: "tasks.manage",
  TASKS_DELETE: "tasks.delete",
  TASKS_ALL_AREAS: "tasks.all_areas",

  USERS_MANAGE: "users.manage",
  USERS_VIEW_ALL: "users.view_all",

  ANALYTICS_VIEW: "analytics.view",

  SYSTEM_ADMIN: "system.admin",
} as const;

export function getPermissions(
  roles: AppRole[],
  area: string | null
): Set<Permission> {
  const perms = new Set<Permission>();

  const isAdmin = roles.includes("admin");
  const isISA =
    roles.includes("isa_super_admin") ||
    roles.includes("isa_consultant");
  const isMayor = roles.includes("mayor");
  const isAreaManager = roles.includes("area_manager");

  if (isISA) {
  perms.add(PERMISSIONS.SYSTEM_ADMIN);

  perms.add(PERMISSIONS.ANALYTICS_VIEW);

  perms.add(PERMISSIONS.USERS_MANAGE);
  perms.add(PERMISSIONS.USERS_VIEW_ALL);

  perms.add(PERMISSIONS.CONTENT_CREATE);
  perms.add(PERMISSIONS.CONTENT_EDIT);
  perms.add(PERMISSIONS.CONTENT_DELETE);
  perms.add(PERMISSIONS.CONTENT_PUBLISH);

  perms.add(PERMISSIONS.TASKS_MANAGE);
  perms.add(PERMISSIONS.TASKS_DELETE);
  perms.add(PERMISSIONS.TASKS_ALL_AREAS);

  return perms;
}

  if (isAdmin) {
  perms.add(PERMISSIONS.CONTENT_CREATE);
  perms.add(PERMISSIONS.CONTENT_EDIT);
  perms.add(PERMISSIONS.CONTENT_DELETE);
  perms.add(PERMISSIONS.CONTENT_PUBLISH);

  perms.add(PERMISSIONS.TASKS_MANAGE);
  perms.add(PERMISSIONS.TASKS_DELETE);
  perms.add(PERMISSIONS.TASKS_ALL_AREAS);

  perms.add(PERMISSIONS.USERS_MANAGE);
  perms.add(PERMISSIONS.USERS_VIEW_ALL);

  perms.add(PERMISSIONS.ANALYTICS_VIEW);

  return perms;
}

  if (isMayor) {
  perms.add(PERMISSIONS.ANALYTICS_VIEW);

  perms.add(PERMISSIONS.USERS_MANAGE);
  perms.add(PERMISSIONS.USERS_VIEW_ALL);

  return perms;
}

  if (isAreaManager) {
  perms.add(PERMISSIONS.CONTENT_CREATE);
  perms.add(PERMISSIONS.CONTENT_EDIT);

  perms.add(PERMISSIONS.TASKS_MANAGE);

  return perms;
}

  return perms;
}