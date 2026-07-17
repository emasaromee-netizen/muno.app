# DOC-007 — Sistema de Permisos y Autorización (MUNO)

---

## Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-007 |
| Documento | Arquitectura del Sistema de Permisos |
| Proyecto | MUNO |
| Versión | 3.0 |
| Estado | Consolidado y Automatizado (Hito 2) |
| Fecha de Emisión | 13 de Julio de 2026 |
| Responsable | Security & Architecture Task Force |

---

# 1. Objetivo y Paradigma

El objetivo de este módulo es gobernar el acceso perimetral de la aplicación mediante un **Control de Acceso Basado en Roles y Atributos (RBAC/ABAC)**. 

Se prohíbe terminantemente la evaluación *hardcodeada* de roles en los componentes de UI (ej: `roles.includes('admin')`). Toda validación de autorización en el frontend debe canalizarse a través de un único punto de verdad, garantizando homogeneidad y previniendo fugas de seguridad (falsos positivos/negativos en el renderizado).

---

# 2. Componentes del Ecosistema de Seguridad

El sistema está compuesto por cuatro pilares que operan en conjunto:

1. **`src/security/permissions.ts`:** El diccionario oficial. Define el tipo estricto `Permission` y agrupa los permisos atómicos vigentes.
2. **`src/security/can.ts`:** El motor evaluador. Expone la función pura `can(roles, area, permission)`, que cruza el rol del usuario, su área de incumbencia y la acción solicitada.
3. **`src/context/AuthContext.tsx`:** El proveedor de identidad. Inyecta el usuario, los roles y el área asignada en el árbol de React.
4. **`src/test/permissions.test.ts`:** El pipeline de aseguramiento (QA). Suite de pruebas en Vitest que garantiza que nadie pueda alterar las reglas de autorización sin disparar una alerta en el compilador.

---

# 3. Matriz de Roles y Alcance

* **ISA Super Admin / ISA Consultant:**
  * Accesos "Cross-Tenant" globales (únicos roles exentos del aislamiento municipal).
  * Control total sobre métricas y generación de reportes estratégicos.
* **Administrador Municipal (`admin`):**
  * Control total e irrestricto sobre la totalidad de los módulos de **su municipio**.
* **Intendente (`mayor`):**
  * Supervisión ejecutiva (*Read-Only Global*).
  * Acceso al tablero de control, métricas ISA y publicación de novedades. Tiene estrictamente denegada la mutación de operativas diarias (no puede editar reclamos ni crear eventos).
* **Jefe de Turismo (`tourism_chief`):**
  * Acceso administrativo exclusivo a la Guía de Turismo y categorización de comercios destacados.
* **Jefe de Área (`area_manager`):**
  * Acceso condicionado por el atributo `area` (Ej: Cultura, Deportes, Infraestructura).
  * Mutación restringida: Puede crear contenido o gestionar tareas **solo** si pertenecen a su jurisdicción temática.
* **Vecino / Turista (`resident` / `tourist`):**
  * Sin acceso administrativo. Operan sobre la interfaz pública y autogestiva.

---

# 4. Catálogo de Permisos Vigentes (Atómicos)

### 📝 Contenido y Agenda
* `content.create`
* `content.edit`
* `content.delete`
* `content.publish`

### 📋 Gestión de Tareas y Reclamos
* `tasks.manage`
* `tasks.delete`
* `tasks.all_areas` (Permite ver/asignar tareas fuera de la propia área).

### 👥 Administración de Usuarios
* `users.manage` (Creación/edición de gabinete municipal).
* `users.view_all` (Lectura del directorio).

### 📈 Analítica y Sistema
* `analytics.view` (Acceso al módulo ISA y reportes).
* `system.admin` (Configuración de infraestructura y banners fijos).

---

# 5. Seguridad en Profundidad (Frontend + Backend)

La función `can()` dicta qué botones y pantallas **ve** el usuario. Sin embargo, si un usuario malicioso intentara forzar una petición HTTP directa a Supabase (saltándose el frontend), el sistema está respaldado por **Row Level Security (RLS)**.

Las políticas SQL en la base de datos exigen correspondencia entre el `auth.uid()`, el rol en `user_roles` y el `municipality_id`, asegurando que la infraestructura física coincida con la validación de React.

---

# 6. Reglas de Mantenimiento y Extensión

Para preservar el estado de "Cero Vulnerabilidades":

1. **Declaración Unificada:** Todo nuevo permiso debe declararse primero en el objeto `PERMISSIONS` de `permissions.ts`.
2. **Uso Exclusivo:** Los componentes solo pueden usar `if (can(roles, area, PERMISSIONS.NUEVO_PERMISO))`.
3. **Prohibición de Literales:** No pasar *strings* mágicos (`"content.create"`) directamente a la función `can()`.
4. **Test Driven (TDD):** Cualquier modificación en las reglas de `can.ts` debe acompañarse de su respectivo caso de prueba automatizado en `permissions.test.ts`.

---

# 7. Estado de Certificación
✅ **Sistema consolidado, tipado bajo TypeScript estricto, con 100% de cobertura de pruebas unitarias al cierre del Hito 2.**