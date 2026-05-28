# MUNO

Plataforma digital municipal · Propiedad intelectual de **ISA** · Datos del **Municipio**.

Stack: React 18 + Vite 5 + Tailwind + Supabase (Lovable Cloud).

## Desarrollo local

```bash
bun install
bun run dev
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar con los valores de Lovable Cloud.

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del backend Lovable Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Project ref de Supabase |

## Deploy en Vercel

1. Importá el repositorio en Vercel.
2. Framework preset: **Vite**.
3. Build command: `bun run build` (o `npm run build`).
4. Output directory: `dist`.
5. En **Project Settings → Environment Variables** agregá las tres variables `VITE_*` listadas arriba (Production + Preview).
6. Configurar dominio personalizado (opcional) en **Settings → Domains**.

> SPA routing: el archivo `vercel.json` ya rewritea todas las rutas a `index.html` para que React Router funcione con deep links.

## Roles

- `tourist` — visitante sin cuenta (solo lectura pública)
- `resident` — vecino registrado
- `merchant` — vecino con comercio habilitado
- `area_manager` — empleado municipal de área
- `admin` — Intendencia
- `isa_consultant` — Business Analyst de ISA (carga de informes)
