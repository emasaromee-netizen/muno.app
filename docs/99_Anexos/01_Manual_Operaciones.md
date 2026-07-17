# DOC-099 — Anexos: Manual de Operaciones y Glosario Técnico

---

## Control del Documento
| Campo | Valor |
|--------|--------|
| Proyecto | MUNO |
| Documento | Anexo 01: Glosario y Comandos Frecuentes |
| Estado | Actualizado (Hito 2) |

---

# 1. Glosario Técnico de Arquitectura MUNO

Para facilitar el *onboarding* (inducción) de nuevos desarrolladores al proyecto, se definen los siguientes términos arquitectónicos utilizados en la plataforma:

* **Multi-Tenant (Multi-Inquilino):** Arquitectura donde una única instancia de la aplicación y la base de datos sirve a múltiples clientes (municipios). Los datos están aislados lógicamente para que ningún municipio vea los datos de otro.
* **RLS (Row Level Security):** Característica de PostgreSQL que permite filtrar qué filas puede leer, insertar, actualizar o borrar un usuario, basándose en su token de autenticación (JWT). Es el motor del aislamiento Multi-Tenant de MUNO.
* **BOLA (Broken Object Level Authorization):** Vulnerabilidad de seguridad donde un usuario puede manipular el ID de un objeto en una petición HTTP para acceder o modificar datos de otro usuario. Las Edge Functions de MUNO están protegidas contra esto.
* **CSP (Content Security Policy):** Capa de seguridad agregada en `vercel.json` que previene ataques de inyección (XSS) declarando qué fuentes dinámicas están permitidas para cargar scripts o estilos.
* **ErrorBoundary:** Componente de React que actúa como "caja de arena" (sandbox). Si ocurre un error de JavaScript en sus componentes hijos, evita que la aplicación entera colapse ("pantalla blanca") y muestra una interfaz de recuperación, enviando el log del error a Supabase.
* **TanStack Query (React Query):** Librería utilizada para manejar el estado asíncrono, cachear las respuestas de Supabase y optimizar el consumo de red en dispositivos móviles.

---

# 2. Cheat Sheet (Comandos Frecuentes de Terminal)

Directorio de comandos útiles para el desarrollo, testing y despliegue del proyecto:

### 🚀 Desarrollo Local
```bash
# Iniciar el servidor local de desarrollo
npm run dev

# Instalar dependencias nuevas
npm install <nombre-paquete>


Control de Calidad (QA) y Testing
# Ejecutar el compilador estricto de TypeScript (Control de 0 Errores)
npx tsc --noEmit

# Ejecutar la suite de pruebas unitarias (Validación de Permisos)
npm run test
# (o usando bun si está disponible)
bun test


Construcción y Producción
# Simular el empaquetado de producción de Vite
npm run build

# Previsualizar el empaquetado de producción localmente
npm run preview

3. Referencia de Variables de Entorno (.env)
El proyecto requiere un archivo .env en la raíz (nunca debe subirse a Git) con la siguiente estructura mínima para operar:
# URL de la instancia de Supabase (Local o Producción)
VITE_SUPABASE_URL=https://<tu-id-de-proyecto>.supabase.co

# Clave pública anónima de Supabase (Segura para exponer en el cliente)
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...<tu-clave-anon>...

# (Opcional) Clave para la integración del panel inteligente ISA
GEMINI_API_KEY=AIza...