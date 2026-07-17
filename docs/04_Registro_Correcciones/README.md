# DOC-004 — Registro de Correcciones (Bitácora de Ejecución)

---

## Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-004 |
| Documento | Registro de Correcciones (Changelog) |
| Proyecto | MUNO |
| Versión | 3.0 |
| Estado | Ejecutado y Certificado |
| Fecha de Cierre | 13 de Julio de 2026 |
| Responsable | Equipo de Desarrollo |

---

# 1. Resumen de Ejecución
Este documento certifica las intervenciones técnicas exactas aplicadas sobre la base de código de MUNO en cumplimiento del Plan Maestro (DOC-003) para subsanar los hallazgos de la auditoría del Hito 2 (DOC-002).

# 2. Intervenciones Técnicas (Changelog)

## 2.1. Seguridad y Autenticación
* **Base de Datos (Supabase):**
  * Modificado el trigger `handle_new_user()` para extraer de manera robusta el DNI y el ID del municipio desde `new.raw_user_meta_data`.
  * Añadida cláusula `WITH CHECK (user_id = auth.uid())` en la política `claims_admin_update` para impedir el fraude de autoría en expedientes urbanos.
* **`src/pages/auth/Signup.tsx`:** 
  * Inyectada lógica de almacenamiento temporal en `localStorage` (`muno.pending.dni`) para garantizar que la verificación asíncrona de email por SMTP no produzca pérdida de datos de identidad.
* **`src/integrations/lovable/index.ts`:**
  * Implementada validación estructural estricta. El sistema ahora fragmenta el JWT (`split(".")`) y verifica la presencia de sus 3 componentes criptográficos antes de invocar `supabase.auth.setSession()`.

## 2.2. Aislamiento Multi-Tenant y Permisos
* **`src/security/can.ts` & `permissions.ts`:**
  * Creado el sistema de evaluación centralizado de permisos.
* **Múltiples Vistas (ej: `InternalAnnouncement.tsx`, `AdminDashboard.tsx`):**
  * Eliminadas más de 15 instancias de verificaciones frágiles de roles (`roles.includes`). Reemplazadas por llamadas unificadas a la matriz `can()`.
* **`supabase/functions/invite-staff/index.ts`:**
  * Refactorizada para incluir chequeo cruzado de jurisdicción (`callerMunicipality`). 
  * Añadido `onConflict: 'email'` e `ignoreDuplicates: true` en la operación de inserción para neutralizar ataques BOLA de sobreescritura.

## 2.3. Resiliencia, Logs y Observabilidad
* **`src/App.tsx`:**
  * Integrada y tipada la clase `ErrorBoundary`.
  * Configurada rutina asíncrona `componentDidCatch` que sincroniza el objeto de error, el rastro de la pila (stack trace) y la ruta actual hacia la tabla `activity_logs` usando el evento estandarizado `"FRONTEND_CRASH"`.
* **`src/lib/audit.ts`:**
  * Refactorizada la función `logActivity`. Ahora resuelve asíncronamente el `municipality_id` del usuario en sesión (`supabase.auth.getUser()`) asegurando que los registros periciales no puedan cruzar fronteras municipales.

## 2.4. Optimizaciones de Red y Almacenamiento
* **`src/pages/Reclamos.tsx`:**
  * Eliminado el uso de URLs transitorias de Blob en memoria para las evidencias.
  * Implementado pipeline asíncrono `supabase.storage.from("claims").upload()` con generación de identificadores únicos UUIDv4 para persistencia física en la nube.
* **`src/pages/admin/AdminDashboard.tsx`:**
  * Refactorizadas las métricas clave. Migración completa al uso de `Promise.all` con destructuración de promesas y el modificador `{ count: "exact", head: true }` para optimizar ancho de banda móvil.
* **`src/pages/isa/IsaGlobalPanel.tsx`:**
  * Eliminado el bucle `for` (Problema N+1). Reemplazado por el consumo único del Remote Procedure Call (RPC) `get_municipality_counts`.

## 2.5. Estandarización de TypeScript y QA
* **`src/pages/admin/AdminMetricasInput.tsx`:**
  * Eliminados más de 5 `any` en funciones y arrays. Tipado estricto mediante la interfaz `DBMetricHistory`. 
  * Resuelto problema de dependencias del Linter aislando la carga en un `useCallback`.
* **`src/test/permissions.test.ts`:**
  * Eliminado el archivo `example.test.ts` (dummy test).
  * Creada y aprobada la suite unitaria de validación de matriz de roles, testeando el helper `can()` bajo Vitest (Aprobado al 100%).

## 2.6. Hardening de Infraestructura
* **`vercel.json`:**
  * Creado el archivo de reglas de despliegue inyectando políticas HTTP estrictas de Content-Security-Policy (CSP), `X-Frame-Options` y protección contra sniffing MIME.

# 3. Estado Final
Todas las intervenciones fueron desplegadas al repositorio local y pre-compiladas con 0 errores bajo `npx tsc --noEmit`. El Hito 2 queda oficialmente clausurado.