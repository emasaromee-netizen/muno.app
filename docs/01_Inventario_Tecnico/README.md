# DOC-001 — Inventario Técnico del Proyecto MUNO

---

# Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-001 |
| Documento | Inventario Técnico |
| Proyecto | MUNO |
| Versión | 2.0 |
| Estado | En desarrollo |
| Fecha de creación | 29/06/2026 |
| Última actualización | 30/06/2026 |
| Responsable | Equipo MUNO |

---

# 1. Objetivo

El presente documento constituye el inventario técnico oficial del proyecto MUNO.

Su finalidad es registrar de forma objetiva la totalidad de la arquitectura existente antes del proceso de estabilización correspondiente al Hito 2.

Toda la información aquí documentada proviene exclusivamente del análisis del código fuente y del repositorio oficial.

---

# 2. Estado General del Proyecto

Estado actual:

🟡 Hito 2 — Estabilización

Se dispone actualmente de:

- Código fuente completo.
- Repositorio Git.
- Repositorio GitHub.
- Proyecto Supabase vinculado mediante CLI.
- Historial completo de migraciones.
- Edge Functions.
- Documentación técnica en construcción.

---

# 3. Arquitectura Tecnológica

## Frontend

- React 18
- TypeScript
- Vite

## UI

- Tailwind CSS
- shadcn/ui
- Radix UI

## Gestión de Estado

- React Context API
- TanStack React Query

## Routing

- React Router DOM

## Backend

- Supabase

## Base de Datos

- PostgreSQL

## Edge Functions

Actualmente se encuentra registrada la función:

- invite-staff

## Testing

- Vitest
- Testing Library

## Deploy

- Vercel

---

# 4. Arquitectura del Código

La aplicación se encuentra organizada principalmente mediante la siguiente estructura:

src/

- components/
- context/
- data/
- hooks/
- integrations/
- lib/
- pages/
- services/
- styles/

Backend:

supabase/

- migrations/
- functions/
- config.toml

Documentación:

docs/

Auditorías:

audit/

---

# 5. Sistema de Autenticación

La autenticación se encuentra implementada mediante Supabase Auth.

El contexto principal de autenticación es:

src/context/AuthContext.tsx

Responsabilidades:

- Inicio de sesión
- Persistencia de sesión
- Obtención del usuario
- Carga de roles
- Obtención del área administrativa
- Logout
- Redirección automática según permisos

---

# 6. Sistema de Roles

Roles actualmente implementados:

- tourist
- resident
- admin
- area_manager
- isa_consultant
- isa_super_admin
- tourism_chief
- mayor

La autorización se realiza mediante:

- ProtectedRoute
- routeForRoles()
- políticas RLS en Supabase

---

# 7. Context Providers

Actualmente el proyecto utiliza los siguientes Context Providers:

- AuthProvider
- PreviewProvider
- MunicipalityProvider
- BannersProvider

Estos providers centralizan el estado global de la aplicación.

# 8. Sistema de Navegación

El archivo principal de rutas es:

src/App.tsx

Se identifican tres grandes grupos de navegación:

• Aplicación pública

- Login
- Registro
- Recuperación de contraseña
- Documentación legal

• Aplicación móvil protegida

- Inicio
- Turismo
- Guía Vecinal
- Reclamos
- Cultura
- Deportes
- Eventos
- Emergencias
- Mi Cuenta
- Mi Comercio

• Backoffice Administrativo

Paneles para:

- Administración
- Cultura
- Turismo
- Deportes
- Reclamos
- Comercios
- Métricas
- Usuarios
- Configuración
- Auditoría
- Intendencia

---

# 9. Base de Datos

El proyecto utiliza Supabase PostgreSQL.

Actualmente existen:

- múltiples migraciones SQL versionadas
- políticas RLS
- triggers
- funciones SQL
- enums personalizados

La reconstrucción completa del esquema se realizará en el documento DOC-006 Arquitectura.

---

# 10. Estado Actual del Inventario

Hasta el momento fueron verificados:

✅ Frontend

✅ Routing

✅ Context API

✅ Autenticación

✅ Roles

✅ Estructura del proyecto

✅ Integración con Supabase

✅ Migraciones

Pendiente:

- Inventario completo de componentes React
- Inventario de Hooks
- Inventario de tablas SQL
- Inventario de Edge Functions
- Inventario de servicios
- Inventario de dependencias
- Inventario de assets

---

# 11. Riesgo Técnico Actual

El proyecto presenta una arquitectura funcional, aunque con evidencia de crecimiento incremental.

Durante la auditoría inicial se detectaron áreas que requieren consolidación:

- duplicación parcial de responsabilidades entre contextos
- elevado número de páginas administrativas
- gran cantidad de migraciones acumuladas
- ausencia de documentación técnica integral

Estas observaciones serán desarrolladas en el DOC-002 Documento Maestro de Hallazgos.

---

# Historial de Versiones

| Versión | Fecha | Descripción |
|----------|--------|-------------|
| 1.0 | 29/06/2026 | Creación inicial del documento |
| 2.0 | 30/06/2026 | Primera versión basada en la inspección real del código fuente |

## Estado de la infraestructura (30/06/2026)

Durante el proceso de estabilización del Hito 2 se migró el proyecto a una nueva infraestructura de Supabase.

Proyecto anterior:
- Conservado únicamente como respaldo.

Proyecto activo:
- muno-platform

Estado:
- Proyecto enlazado mediante Supabase CLI.
- 22 migraciones aplicadas correctamente.
- Esquema sincronizado con el repositorio Git.
- Base de datos inicializada sin errores.
- Edge Functions pendientes de despliegue.
- Variables de entorno pendientes de actualización en la aplicación.