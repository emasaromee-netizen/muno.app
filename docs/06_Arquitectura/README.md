# DOC-006 — Arquitectura del Sistema MUNO

---

## Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-006 |
| Documento | Arquitectura de Software e Infraestructura |
| Proyecto | MUNO |
| Versión | 3.0 |
| Estado | Estabilizado y Certificado (Hito 2) |
| Fecha de Emisión | 13 de Julio de 2026 |
| Responsable | Equipo de Arquitectura MUNO |

---

# 1. Objetivo

Este documento describe de manera exhaustiva la arquitectura técnica validada de la plataforma MUNO tras la conclusión del Hito 2 (Estabilización). 

Su finalidad es proporcionar el mapa estructural definitivo del sistema, documentando los componentes de software, el esquema de base de datos, el aislamiento multi-inquilino (Multi-Tenant) y las defensas perimetrales implementadas para certificar su paso a producción.

---

# 2. Visión General y Paradigma

La plataforma MUNO es una **Progressive Web App (PWA) Empresarial** desarrollada en **React 18** y **TypeScript Estricto** (cero deuda técnica de tipado).

Adopta un paradigma **BaaS (Backend-as-a-Service) Serverless** apoyado sobre **Supabase**, utilizando:
- **PostgreSQL:** Como motor de datos relacional y transaccional.
- **Row Level Security (RLS):** Como núcleo duro de la seguridad multi-tenant.
- **Edge Functions (Deno):** Para lógica de negocio aislada.
- **Supabase Storage:** Para el almacenamiento de archivos y evidencias binarias.
- **Supabase Auth:** Para la identidad criptográfica y validación de tokens JWT (OAuth).

El despliegue del frontend se orquesta en **Vercel**, inyectando una capa de protección perimetral mediante cabeceras HTTP restrictivas (CSP).

---

# 3. Arquitectura Frontend (React + Vite)

El código fuente está modularizado en la carpeta `src/`, diseñado bajo patrones de Alta Cohesión y Bajo Acoplamiento:

```text
src/
├── components/       # UI Reutilizable, Widgets y Layouts (AdminShell, AppLayout)
├── context/          # Gestión de Estado Global (Auth, Municipality)
├── hooks/            # Encapsulamiento de lógica y optimizaciones (useCallback/useQuery)
├── integrations/     # Clientes de APIs, validación OAuth y esquemas de base de datos
├── lib/              # Utilidades puras, métricas y trazabilidad (audit.ts)
├── pages/            # Vistas enrutables (Mobile y Backoffice)
├── security/         # Motor de Autorización RBAC/ABAC (can.ts, permissions.ts)
├── styles/           # Tailwind globals
├── test/             # Pipeline de Regresión Automatizada (permissions.test.ts)
├── App.tsx           # Enrutador principal y Telemetría de Tolerancia a Fallos (ErrorBoundary)
└── main.tsx          # Punto de anclaje de React DOM
```

---

# 4. Motor de Autorización y Componentes Críticos

A diferencia del prototipo inicial, la aplicación no utiliza verificaciones estáticas de roles en la UI. Toda decisión de renderizado y ruteo es evaluada por el motor de permisos cruzado.

## 4.1. Módulo de Seguridad Central (`src/security/`)
- `permissions.ts`: Diccionario de permisos atómicos (ej. `CONTENT_CREATE`, `USERS_MANAGE`).
- `can.ts`: Función evaluadora que intersecta los roles del usuario (`admin`, `mayor`, `area_manager`, etc.) contra su área de incumbencia y los permisos declarados, dictaminando booleanos (`true/false`).

## 4.2. Tolerancia a Fallos (`ErrorBoundary`)
El componente raíz (`App.tsx`) envuelve la aplicación en una frontera de errores asíncrona. Si ocurre una excepción no controlada ("White Screen of Death"), el sistema captura el *Stack Trace* y envía un payload a la tabla `activity_logs` (Supabase) detallando el contexto, URL y credenciales del dispositivo afectado, garantizando observabilidad en producción.

---

# 5. Gestión del Estado y Context Providers

La información transaccional y el contexto multi-jurisdiccional se manejan globalmente mediante:

- **`AuthProvider`:** Inicializa y valida la sesión criptográfica, decodifica el JWT, inyecta los roles y gestiona el caché transitorio (`muno.pending.dni`) durante flujos de registro asíncrono.
- **`MunicipalityProvider`:** Resuelve el UUID real del municipio seleccionado y su metadata visual, eliminando búsquedas redundantes y blindando el flujo cruzado del home y panel.
- **`TanStack React Query`:** Administra el caché de datos remotos, paralelizando peticiones a Supabase con parámetros optimizados (`{ head: true }` para contadores).

---

# 6. Arquitectura Backend (PostgreSQL & Supabase)

El esquema `public` de la base de datos ha sido refactorizado para garantizar persistencia física y aislamiento total de jurisdicciones.

## 6.1. Tablas Transaccionales Principales

| Tabla | Propósito y Modificación Hito 2 |
|---------|--------------------------------|
| `profiles` | Perfiles ciudadanos. Vinculados de forma nativa a `auth.users`. |
| `claims` | Reclamos. Evidencias apuntan a Supabase Storage y autores inmutables. |
| `businesses` | Comercio local. Tipado estricto para roles `mayor` y `tourism_chief`. |
| `business_reservations` | *(NUEVA)* Persistencia transaccional de turnos y agendas comerciales. |
| `activity_logs` | Trazabilidad legal aislada por `municipality_id` y telemetría de crashes. |
| `analytics_events` | Almacén de big data para métricas ISA sin bloqueos UI. |
| `content_items` | Consolidación universal de eventos, lugares turísticos y cultura. |

## 6.2. Seguridad Multi-Tenant (Row Level Security - RLS)

Todas las tablas están protegidas. Destacan las siguientes reglas estrictas:
- **Lecturas (`SELECT`):** Filtradas obligatoriamente por la cláusula `municipality_id = auth.jwt() ->> 'municipality_id'` o validando el perfil.
- **Escrituras/Actualizaciones (`INSERT`, `UPDATE`):** Reforzadas con la cláusula **`WITH CHECK`**. Esto prohíbe explícitamente que un administrador altere registros de usuarios de otros municipios, bloqueando fraudes y ataques BOLA.

---

# 7. Procedimientos Almacenados (RPC) y Triggers

La lógica pesada y los extractores de datos están delegados a la capa de base de datos para minimizar la latencia de red.

- **RPC `get_municipality_counts`:** Procedimiento PL/pgSQL que realiza la agregación de reclamos, usuarios y comercios en una sola transacción, eliminando el problema de saturación "N+1" del panel global ISA.
- **Trigger `handle_new_user()`:** Disparador optimizado que intercepta la creación asíncrona de usuarios para inyectar correctamente el `dni` y `municipality_id` a la tabla `profiles` desde el objeto `new.raw_user_meta_data`.

---

# 8. Edge Functions (Deno)

- **`invite-staff`:**
  * **Objetivo:** Enviar enlaces mágicos a funcionarios municipales para unirse al Backoffice.
  * **Seguridad (Hardening):** Evalúa el `callerMunicipality` cruzando el ID del emisor para prevenir ataques de escalada o sobreescritura (`onConflict`, `ignoreDuplicates: true`) sobre cuentas de otras intendencias.

---

# 9. Seguridad Perimetral y Despliegue (Vercel)

El proyecto se despliega sobre la infraestructura de Vercel. La arquitectura perimetral fue sellada mediante el archivo `vercel.json`, inyectando las siguientes cabeceras a toda petición entrante/saliente:

1. **`Content-Security-Policy` (CSP):** Lista blanca de dominios permitidos (Supabase, Google Fonts) para prevenir inyecciones de código malicioso (XSS).
2. **`X-Frame-Options: DENY`:** Bloqueo de secuestro de iFrames (Clickjacking).
3. **`X-Content-Type-Options: nosniff`:** Prevención de ataques MIME-sniffing.
4. **`Referrer-Policy: strict-origin-when-cross-origin`:** Privacidad de metadatos de navegación.

---

# 10. Pipeline de Regresión (QA Automático)

La arquitectura soporta integraciones continuas garantizadas a través de `Vitest`.
- **`src/test/permissions.test.ts`:** Automatiza pruebas unitarias sobre el motor `can()`. Valida matemáticamente que un rol de vecino (`resident`) no pueda realizar acciones de intendente (`mayor`), y que los jefes de área (`area_manager`) estén limitados a su incumbencia (ej. Cultura).