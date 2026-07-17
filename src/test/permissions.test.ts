import { describe, it, expect } from "vitest";
import { can } from "../security/can";
import { PERMISSIONS } from "../security/permissions";
import type { AppRole } from "../context/AuthContext";

describe("Sistema de Permisos de MUNO", () => {
  it("debe validar acceso total para ISA Super Admin e ISA Consultant", () => {
    const rolesSuper: AppRole[] = ["isa_super_admin"];
    const rolesConsultant: AppRole[] = ["isa_consultant"];
    const area = null;
    
    // Validar ISA Super Admin
    expect(can(rolesSuper, area, PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
    expect(can(rolesSuper, area, PERMISSIONS.CONTENT_CREATE)).toBe(true);
    expect(can(rolesSuper, area, PERMISSIONS.USERS_MANAGE)).toBe(true);

    // Validar ISA Consultant
    expect(can(rolesConsultant, area, PERMISSIONS.SYSTEM_ADMIN)).toBe(true);
    expect(can(rolesConsultant, area, PERMISSIONS.CONTENT_CREATE)).toBe(true);
  });

  it("debe restringir permisos de escritura directa al Intendente (mayor)", () => {
    const roles: AppRole[] = ["mayor"];
    const area = null;

    // El intendente puede ver analíticas y gestionar la vista de gabinete
    expect(can(roles, area, PERMISSIONS.ANALYTICS_VIEW)).toBe(true);
    expect(can(roles, area, PERMISSIONS.USERS_VIEW_ALL)).toBe(true);
    
    // Pero tiene estrictamente prohibido crear o editar contenido o tareas directamente
    expect(can(roles, area, PERMISSIONS.CONTENT_CREATE)).toBe(false);
    expect(can(roles, area, PERMISSIONS.CONTENT_EDIT)).toBe(false);
    expect(can(roles, area, PERMISSIONS.TASKS_MANAGE)).toBe(false);
  });

  it("debe permitir al Jefe de Área (area_manager) gestionar contenido de su incumbencia", () => {
    const roles: AppRole[] = ["area_manager"];
    const area = "Cultura";

    // El jefe puede crear y editar contenido y tareas
    expect(can(roles, area, PERMISSIONS.CONTENT_CREATE)).toBe(true);
    expect(can(roles, area, PERMISSIONS.CONTENT_EDIT)).toBe(true);
    expect(can(roles, area, PERMISSIONS.TASKS_MANAGE)).toBe(true);
    
    // Pero no puede gestionar otros jefes de gabinete ni ver analíticas globales
    expect(can(roles, area, PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(can(roles, area, PERMISSIONS.ANALYTICS_VIEW)).toBe(false);
  });

  it("debe denegar accesos administrativos a un Vecino (resident) común", () => {
    const roles: AppRole[] = ["resident"];
    const area = null;

    expect(can(roles, area, PERMISSIONS.CONTENT_CREATE)).toBe(false);
    expect(can(roles, area, PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(can(roles, area, PERMISSIONS.SYSTEM_ADMIN)).toBe(false);
  });
});