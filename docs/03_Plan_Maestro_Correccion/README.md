# DOC-003 — Plan Maestro de Corrección (Estrategia de Ingeniería Hito 2)

---

## Control del Documento

| Campo | Valor |
|--------|--------|
| Código | DOC-003 |
| Documento | Plan Maestro de Corrección |
| Proyecto | MUNO |
| Versión | 3.0 |
| Estado | Ejecutado y Validado |
| Fecha de Emisión | 13 de Julio de 2026 |
| Responsable | Arquitectura y Operaciones |

---

# 1. Resumen Ejecutivo y Enfoque

El presente documento define la arquitectura de la solución y la metodología técnica exacta aplicada para subsanar los 18 hallazgos detectados en la auditoría del Hito 2 (DOC-002). El objetivo de este plan no fue aplicar "parches" rápidos, sino realizar una **cirugía de fondo** sobre la arquitectura de la plataforma, garantizando que el sistema escale como una solución SaaS Multi-Tenant (Multi-Inquilino) de nivel gubernamental.

# 2. Metodología de Intervención: Los 4 Pilares

La refactorización se ejecutó estructurando las correcciones en cuatro pilares fundamentales de ingeniería:

## Pilar 1: Aislamiento Multi-Tenant y Seguridad BOLA (Broken Object Level Authorization)
Para garantizar que los datos de un municipio jamás crucen sus límites jurisdiccionales, la estrategia de seguridad se basó en el principio de "Confianza Cero" (Zero Trust):
* **Hardening de PostgreSQL (RLS):** Todas las políticas de actualización (`UPDATE`) en la base de datos deben incluir obligatoriamente la cláusula `WITH CHECK` para bloquear la manipulación fraudulenta de los identificadores de propietario (`user_id`) o municipio (`municipality_id`).
* **Validación Cruzada en Edge Functions:** Las funciones de servidor (como `invite-staff`) no deben confiar ciegamente en el payload del cliente. El plan estipuló que el backend debe consultar la tabla `profiles` para resolver el `municipality_id` del administrador emisor, y usar este dato como filtro inmutable en cualquier operación `upsert`.

## Pilar 2: Control de Accesos Centralizado (RBAC/ABAC)
* **Erradicación de Roles Estáticos:** Se prohibió el uso de comprobaciones *hardcodeadas* (ej: `roles.includes('admin')`) dentro de los componentes de React.
* **Motor `can()`:** Se definió la creación de un motor de autorización dinámico (`src/security/can.ts`) y un diccionario oficial de permisos (`src/security/permissions.ts`). Cada componente de interfaz de usuario debe delegar la decisión de renderizado a esta función, la cual evalúa el rol del usuario contra su área de incumbencia.

## Pilar 3: Tolerancia a Fallos y Observabilidad Asíncrona
* **Resiliencia en el Cliente:** Para combatir los fallos silenciosos en dispositivos móviles (pantallas en blanco), la estrategia exigió implementar el patrón arquitectónico `ErrorBoundary` en el nivel superior de la aplicación (`src/App.tsx`).
* **Telemetría Transparente:** En lugar de depender de servicios de terceros (como Sentry), el plan definió utilizar el SDK nativo de Supabase para capturar las excepciones del `ErrorBoundary` e insertar el *Stack Trace* de forma asíncrona directamente en la tabla `activity_logs`.

## Pilar 4: Tipado Estricto y Eficiencia de Red
* **Deuda Técnica "Zero Any":** Se prohibió el uso del tipo `any` en TypeScript. Las respuestas de base de datos deben ser mapeadas contra interfaces explícitas para habilitar el chequeo de tipos en tiempo de compilación.
* **Optimización de Payload:** Para reducir el consumo de red en tableros de gestión, las consultas de conteo deben ejecutarse en paralelo (`Promise.all`) utilizando el parámetro de encabezado HTTP `{ head: true, count: 'exact' }`, evitando la descarga innecesaria de filas completas.

# 3. Flujo de Control de Calidad (QA Pipeline)

Para dar por cerrada cualquier intervención, el equipo definió el siguiente embudo de validación estricta:
1. **Compilación Estática:** Ejecución de `npx tsc --noEmit` para verificar la ausencia de errores de tipado.
2. **Pruebas de Regresión:** Ejecución de la suite `Vitest` para garantizar la inviolabilidad de la matriz de roles y permisos.
3. **Auditoría IA:** Revisión final del código empaquetado (mediante Repomix) por un auditor experto (Google AI Studio) para detectar vulnerabilidades residuales.