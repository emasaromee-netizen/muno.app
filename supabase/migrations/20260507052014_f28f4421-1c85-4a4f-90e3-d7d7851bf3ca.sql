-- Restore EXECUTE permission on has_role for authenticated/anon/public
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, public, service_role;