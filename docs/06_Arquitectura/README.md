# DOC-006 — Arquitectura del Sistema MUNO

---

# Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-006 |
| Documento | Arquitectura del Sistema |
| Proyecto | MUNO |
| Versión | 1.0 |
| Estado | En desarrollo |
| Fecha | 30/06/2026 |

---

# 1. Objetivo

Este documento describe la arquitectura técnica completa de la plataforma MUNO.

Su finalidad es proporcionar una visión integral del sistema, documentando los componentes que intervienen en el funcionamiento de la aplicación, las relaciones entre ellos y las decisiones arquitectónicas actualmente implementadas.

Toda la información incluida en este documento se obtiene exclusivamente del análisis del código fuente y de la infraestructura asociada al proyecto.

---

# 2. Visión General

La plataforma MUNO está desarrollada como una Progressive Web App (PWA) basada en React y TypeScript.

La aplicación consume servicios Backend-as-a-Service proporcionados por Supabase, utilizando PostgreSQL como motor de base de datos, Supabase Auth para autenticación, Row Level Security (RLS) para autorización y Edge Functions para lógica de servidor.

El frontend está organizado mediante componentes reutilizables, Context API y React Router, mientras que el backend se encuentra completamente desacoplado mediante la infraestructura de Supabase.

La arquitectura sigue un modelo cliente-servidor con separación entre:

- Presentación (React)
- Gestión del estado (Context API + React Query)
- Servicios (Supabase)
- Persistencia (PostgreSQL)

---

# 3. Arquitectura Frontend

El frontend de MUNO está desarrollado utilizando React 18 con TypeScript sobre Vite.

La aplicación adopta una arquitectura basada en componentes reutilizables, Context API para el estado global y React Router para la navegación.

La organización principal del código fuente es la siguiente:

```
src/
├── components/
│   ├── admin/
│   └── ui/
├── context/
├── data/
├── hooks/
├── integrations/
├── lib/
├── pages/
│   ├── admin/
│   ├── auth/
│   ├── isa/
│   └── legal/
├── styles/
└── main.tsx
```

No se identificó una carpeta `services`, por lo que actualmente la lógica de acceso a datos se encuentra distribuida entre Context Providers, utilidades (`lib`) e integraciones con Supabase.

---

# 4. Componentes React

El proyecto utiliza una arquitectura basada en componentes reutilizables.

## Componentes principales

- AppLayout
- BottomNav
- EmergencyBanner
- EmptyState
- FavoriteButton
- FullscreenToggle
- HomeBanners
- InscripcionDialog
- InternalAnnouncement
- LeadDialog
- MayorFullscreen
- MisFavoritos
- MisInscripciones
- MisReclamos
- NavLink
- NewsCarousel
- NotificationsBell
- PreviewSwitcher
- ProtectedRoute
- RatePueblo
- RatingStars
- TouristGate
- VecinoHomeBlocks
- VecinoHomeCarousel

---

## Componentes administrativos

- AdminShell
- StaffNewsWidget

---

## Biblioteca UI

El proyecto incorpora una biblioteca de componentes basada en shadcn/ui y Radix UI.

Actualmente se identifican más de 45 componentes reutilizables, entre ellos:

- Accordion
- Alert
- Avatar
- Badge
- Breadcrumb
- Button
- Calendar
- Card
- Carousel
- Chart
- Checkbox
- Dialog
- Drawer
- Dropdown
- Form
- Input
- Label
- Menubar
- Navigation Menu
- Pagination
- Popover
- Progress
- Radio Group
- Scroll Area
- Select
- Sheet
- Sidebar
- Slider
- Sonner
- Switch
- Table
- Tabs
- Textarea
- Toast
- Tooltip

Estos componentes constituyen la base visual común utilizada por toda la plataforma.

---

# 5. Hooks Personalizados

Actualmente el proyecto implementa los siguientes hooks propios:

| Hook | Función |
|-------|----------|
| use-mobile | Detección de dispositivos móviles |
| use-toast | Gestión centralizada de notificaciones |

La mayor parte del comportamiento compartido de la aplicación se implementa mediante Context API en lugar de hooks personalizados.

---

# 6. Biblioteca de Utilidades

La carpeta `src/lib` centraliza funciones auxiliares utilizadas por distintos módulos.

Actualmente contiene:

| Archivo | Función |
|----------|----------|
| analytics.ts | Métricas y analítica |
| audit.ts | Registro de auditoría |
| data.ts | Utilidades de datos |
| format.ts | Formateo |
| inscripciones.ts | Gestión de inscripciones |
| isaReport.ts | Reportes ISA |
| session.ts | Manejo de sesión |
| utils.ts | Funciones generales |

---

# 7. Arquitectura Backend

La capa backend de MUNO se encuentra implementada íntegramente sobre Supabase.

Los servicios utilizados actualmente son:

- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- Edge Functions
- Storage
- Realtime (habilitado por Supabase)

Toda la lógica persistente se implementa mediante:

- tablas SQL
- funciones PL/pgSQL
- triggers
- políticas RLS
- migraciones versionadas

La evolución del esquema se encuentra registrada mediante migraciones SQL almacenadas en:

supabase/migrations/

Actualmente el proyecto dispone de más de veinte migraciones versionadas.

---

# 8. Base de Datos

Motor:

PostgreSQL

Proveedor:

Supabase

El esquema principal utilizado por la aplicación es:

public

La autenticación utiliza el esquema:

auth

Los archivos del proyecto indican una arquitectura basada en migraciones, evitando modificaciones manuales sobre producción.

---

# 9. Tablas Principales

Durante la inspección del código se identifican inicialmente las siguientes tablas principales:

| Tabla | Propósito |
|---------|------------|
| profiles | Información del usuario |
| user_roles | Roles del sistema |
| claims | Reclamos ciudadanos |
| businesses | Comercios |
| analytics_reports | Reportes ISA |
| announcements | Banners públicos |

El resto de las tablas será documentado conforme avance el relevamiento completo del esquema.

---

# 10. Relaciones

Las relaciones actualmente verificadas son:

auth.users
│
├── profiles
│
├── user_roles
│
├── claims
│
├── analytics_reports
│
└── businesses

Todas estas relaciones utilizan claves UUID.

La autenticación depende del identificador generado por Supabase Auth.

---

# 11. Triggers

Actualmente fueron identificados los siguientes triggers:

- handle_new_user
- set_updated_at
- businesses_auto_disable

Los triggers permiten automatizar la creación de perfiles, mantener fechas de modificación y deshabilitar automáticamente comercios vencidos.

---

# 12. Funciones SQL

Durante la inspección inicial se identifican las siguientes funciones:

- has_role()
- handle_new_user()
- set_updated_at()
- businesses_auto_disable()

Estas funciones implementan parte de la lógica de negocio directamente dentro de PostgreSQL.

---

# 13. Row Level Security

Todas las tablas principales operan bajo políticas RLS.

Las políticas implementan controles de acceso para:

- perfiles
- reclamos
- comercios
- reportes
- anuncios
- roles

La autorización depende de la función has_role() y de los roles asignados a cada usuario.

---

# 14. Edge Functions

Actualmente se identificó la siguiente Edge Function:

invite-staff

Su finalidad es gestionar el proceso de invitación de colaboradores municipales.

La implementación completa será documentada durante el relevamiento funcional del backend.

---