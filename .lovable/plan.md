## Configuración integral: Turismo, Hacienda, Intendente

Este pedido toca jerarquías de roles, nuevas tablas, paneles nuevos y vínculos entre módulos. Lo divido en fases para ejecutarlo de forma ordenada y poder validar cada parte antes de seguir.

---

### Fase 1 — Roles y permisos (DB)

Ampliar el enum `app_role` con dos roles nuevos:

- `tourism_chief` — Jefe de Turismo
- `mayor` — Intendente

Actualizar `routeForRoles` y `ProtectedRoute` para reconocerlos. Crear funciones `has_role` checks en RLS de las tablas afectadas.

---

### Fase 2 — Módulo Turismo (Jefe de Turismo)

Nueva tabla `tourism_items` con columnas:

- `category` (`commerce` | `gastronomy` | `lodging` | `nature` | `event`)
- `title`, `description`, `photo_url`, `location` (texto), `lat`, `lng`
- `featured` (bool), `business_id` (FK opcional a `businesses` para destacar comercios de Hacienda)
- `municipality_id`, `published`, timestamps

RLS:
- SELECT público si `published`
- INSERT/UPDATE/DELETE: `admin`, `tourism_chief`, `mayor` (mayor sólo SELECT — ver Fase 4)

Panel `/admin/turismo` con tabs por categoría + buscador. Para "Comercios" carga desde `businesses` (solo `enabled=true`) y permite marcar `featured` (lo persiste en `tourism_items`).

---

### Fase 3 — Conexión Turismo ↔ Hacienda

En el tab Comercios del panel de Turismo:
- Lista los `businesses` con `enabled=true` y tasa al día
- Switch "Destacar en guía turística" → crea/elimina fila `tourism_items` con `business_id`, `category='commerce'`, copia foto/datos
- En la guía pública (`/turismo` o `/lugares`) los destacados aparecen primero

---

### Fase 4 — Rol Intendente

**Supervisión read-only:**
- RLS: SELECT permitido en `claims`, `content_items`, `tourism_items`, `businesses`, `isa_metrics`, `registrations` para `mayor`
- UI: AdminShell muestra todos los paneles pero oculta botones de edición cuando `roles.includes('mayor')` y NO incluye admin

**Banners con audiencia:**
- Nueva columna `audience` en `announcements` (`residents` | `tourists` | `both`, default `residents`)
- Admin puede editar; `mayor` también
- Home de turistas (`Turismo.tsx`) filtra `audience in ('tourists','both')`; home vecino filtra `('residents','both')`

**Novedades para Jefes:**
- Tabla `staff_announcements` (`title`, `body`, `created_by`, `municipality_id`, timestamps)
- INSERT/UPDATE/DELETE: `mayor` y `admin`
- SELECT: cualquier rol interno (`admin`, `area_manager`, `tourism_chief`, `mayor`)
- Componente en AdminDashboard mostrando últimas 5

---

### Fase 5 — Vista comerciante en Mi Cuenta

En `MiCuenta.tsx`:
- Agregar campo `cuit` al `profiles`
- Si `profile.cuit` matchea con `businesses.cuit` → mostrar tarjeta "Estado de tasas" con `tax_expires_at`, monto y estado (al día / vencida / por vencer)
- Solo lectura (sin pago)

Requiere agregar columna `cuit` a `profiles` y a `businesses`.

---

### Fase 6 — Persistencia

Auditar formularios que aún usan `localStorage` o estado en memoria y migrarlos a Supabase. Foco:

- `AdminContenido` (ya migrado en pedido anterior — verificar)
- Banners de turismo (Fase 2)
- Novedades internas (Fase 4)

---

### Archivos principales a crear/editar

```text
supabase/migrations/<ts>_tourism_mayor.sql   # roles, tablas, RLS
src/context/AuthContext.tsx                  # nuevos roles en tipos
src/components/ProtectedRoute.tsx            # allowed[]
src/App.tsx                                  # rutas /admin/turismo, /admin/novedades
src/pages/admin/AdminTurismo.tsx             # NUEVO
src/pages/admin/AdminNovedadesJefes.tsx      # NUEVO
src/components/admin/AdminShell.tsx          # menú según rol + read-only para mayor
src/pages/admin/AdminBanners.tsx             # selector audiencia
src/pages/MiCuenta.tsx                       # tarjeta comercio
src/pages/Turismo.tsx                        # consumir tourism_items destacados
```

---

### Confirmación

Antes de ejecutar quiero confirmar 3 cosas:

1. ¿Te alcanza con que **Turismo** y **Mayor** sean roles asignados manualmente desde `/admin/usuarios` (igual que area_manager hoy), o querés también un flujo de invitación por email?
2. Para el matching comerciante↔vecino, ¿usamos **CUIT** (hay que agregar la columna a `profiles` y `businesses`) o preferís usar **email del owner**?
3. Las "Novedades para Jefes" del Intendente, ¿las publica solo el Intendente, o también el `admin`?

Con esas respuestas arranco con la migración (Fase 1) y avanzo en orden.