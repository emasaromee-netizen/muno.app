-- 1. Agregar columnas de borrado lógico (Soft Delete)
ALTER TABLE public.municipal_invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'activa';

-- 2. Revocar permisos de borrado físico (Hard Delete) a los usuarios y admins
REVOKE DELETE ON public.municipal_invitations FROM anon, authenticated;
REVOKE DELETE ON public.registrations FROM anon, authenticated;