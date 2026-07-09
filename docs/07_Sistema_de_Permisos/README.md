# Sistema de Permisos de MUNO

## Objetivo

Centralizar y unificar el control de acceso de la aplicación, garantizando que todas las validaciones de autorización se realicen desde un único punto y evitando inconsistencias entre pantallas.

## Componentes principales

* `src/security/permissions.ts`: define el conjunto oficial de permisos (`Permission`) y las constantes agrupadas en `PERMISSIONS`.
* `src/security/can.ts`: expone la función `can()`, utilizada por la interfaz para verificar si un usuario puede ejecutar una acción.
* `src/context/AuthContext.tsx`: provee los roles y el área asignada al usuario autenticado.

## Permisos vigentes

### Contenido

* `content.create`
* `content.edit`
* `content.delete`
* `content.publish`

### Tareas

* `tasks.manage`
* `tasks.delete`
* `tasks.all_areas`

### Usuarios

* `users.manage`
* `users.view_all`

### Analítica y administración

* `analytics.view`
* `system.admin`

## Asignación por rol

* **ISA Super Admin / ISA Consultant:** acceso total.
* **Administrador municipal:** gestión completa de contenido, tareas, usuarios y métricas.
* **Intendente:** acceso a métricas y gestión de usuarios.
* **Jefe de área:** creación y edición de contenido y gestión de tareas de su área.

## Reglas de mantenimiento

1. Todo nuevo permiso debe declararse en `permissions.ts`.
2. Las pantallas y componentes deben consultar permisos únicamente mediante `can()`.
3. No deben utilizarse cadenas literales de permisos fuera de `permissions.ts`.
4. Cualquier cambio en roles o permisos debe actualizar este documento y registrarse en el historial de correcciones del proyecto.

## Estado

Sistema consolidado y compilando correctamente al cierre del Hito 2 – Etapa de estabilización del esquema de permisos.
