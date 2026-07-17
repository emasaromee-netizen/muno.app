# Arquitectura y Estado del Sistema: MUNO App
**Última actualización:** Finalización Hito 2 (Estabilización, Seguridad y Multi-Tenant)
**Estado:** Producción (Release Candidate)

Este documento detalla la estructura actual de jerarquías de roles, flujos de datos y módulos consolidados tras la estabilización de seguridad y refactorización técnica.

---

## 1. Seguridad, Roles y Permisos (Matriz Dinámica)
El sistema ha abandonado las verificaciones *hardcodeadas* de roles en los componentes. Todo el control de acceso se rige por un motor de permisos estricto (`can()`) definido en `src/security/permissions.ts`.

**Roles Activos (`AppRole`):**
- `admin`: Administrador técnico (acceso total a su municipio).
- `mayor`: Intendente (Supervisión global *read-only* de analíticas y métricas, capacidad de publicar en tablero de novedades).
- `area_manager`: Jefe de Área (Acceso de escritura exclusivo a los módulos de su incumbencia, ej: Cultura, Deporte, Infraestructura).
- `tourism_chief`: Jefe de Turismo (Manejo exclusivo de la guía turística y eventos destacados).
- `isa_consultant` / `isa_super_admin`: Analistas externos (Acceso a carga de métricas y cross-tenant global de informes).
- `resident`: Vecino/Ciudadano.

**Aislamiento RLS (Row Level Security):**
Todas las tablas PostgreSQL utilizan la columna `municipality_id` forzada con cláusulas `WITH CHECK` para aislar datos. Un usuario jamás puede ver ni interactuar con registros fuera de su jurisdicción.

---

## 2. Módulo Turismo y Eventos
El Jefe de Turismo (`tourism_chief`) administra la "Guía Turista".
- El contenido turístico y los eventos ya no viven en estructuras aisladas temporales, sino que se apoyan en la tabla unificada `content_items` (filtrada por `kind`) y en el catálogo `businesses` verificado.
- **Categorización visible:** La tabla `businesses` posee categorías con segmentación de audiencia (`vecino+turista`, `solo turista`, `solo vecino`). Por ejemplo, *Hospedaje* solo es visible en la app del turista, mientras que *Gastronomía* es visible para ambos perfiles.

---

## 3. Módulo de Comercios e Intendencia (Hacienda)
- **Persistencia Directa:** La vinculación del comercio con el ciudadano se realiza de forma segura mediante la columna `owner_id` (vinculada al `user.id` de autenticación), reemplazando el frágil emparejamiento por CUIT.
- **`MiComercio.tsx`:** Vista ciudadana del comerciante con soporte integral de Pestañas: *Datos, Habilitaciones, Pagos, Fotos (Subida real a Storage) y Reservas*.
- **Reservas:** Sistema de agendamiento sincronizado y persistido asíncronamente en PostgreSQL (`business_reservations`).

---

## 4. Analíticas ISA y Tablero de Intendente
El rol `mayor` posee un *dashboard* ejecutivo sin capacidades de mutación accidental de operativas diarias.
- **Novedades Internas:** Funcionalidad implementada en `InternalAnnouncement` apoyada sobre la tabla `internal_announcements`. Notifica a los Jefes de Área directamente en el *Dashboard*.
- **Notificación ISA:** Alerta cruzada inteligente basada en base de datos (`analytics_reports.id`). La plataforma avisa a los funcionarios cuando ISA publica un reporte y lo marca como leído asíncronamente para evitar cruces en *localStorage*.
- **RPC Optimizado:** El cálculo de contadores globales se extrae en paralelo mediante la función PostgreSQL `get_municipality_counts` y conteos `{ head: true }` para reducir drásticamente el consumo de red móvil.

---

## 5. Observabilidad y Resiliencia (Producción)
- **Cero `any`:** El proyecto completo está tipado de forma estricta. Las interfaces rechazan excesos de propiedades interactuando con el cliente estricto de Supabase.
- **Telemetría de Crashes:** Toda la app está envuelta en un `ErrorBoundary`. Excepciones no controladas (`FRONTEND_CRASH`) se persisten asíncronamente en la tabla `activity_logs` con su *stack trace*, silenciando fallos de red hacia el usuario y permitiendo depuración proactiva de dispositivos antiguos.
- **Hardening Vercel:** Cabeceras HTTP inyectadas (`vercel.json`) implementando Content Security Policy (CSP) y bloqueo anti-XSS y Clickjacking.

---

## 6. Pipeline de Calidad (Testing)
El proyecto implementa pruebas de regresión unitarias configuradas bajo Vitest.
- **`permissions.test.ts`:** Garantiza la inviolabilidad de la matriz de autorización. Una falla en las reglas de `can()` (ej: un Vecino obteniendo acceso a funciones de Intendente) detendrá inmediatamente el flujo de integración continua.

---

## 7. Archivos de Referencia Arquitectónica

```text
src/security/permissions.ts                  # Matriz de acceso RLS del Frontend
src/security/can.ts                          # Motor evaluador de roles vs área
src/lib/audit.ts                             # Trazabilidad multi-tenant legal
src/App.tsx                                  # Enrutador, ProtectedRoute y ErrorBoundary
src/pages/MiComercio.tsx                     # Motor de autogestión comercial
src/pages/admin/AdminDashboard.tsx           # Hub gerencial y alertas asíncronas
src/integrations/supabase/types.ts           # Diccionario de base de datos estricto
vercel.json                                  # Escudo de seguridad perimetral
src/test/permissions.test.ts                 # Automatización de Regresión de Roles