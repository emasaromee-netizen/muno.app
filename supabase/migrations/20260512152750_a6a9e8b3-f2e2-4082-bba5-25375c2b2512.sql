-- Add new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tourism_chief';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mayor';