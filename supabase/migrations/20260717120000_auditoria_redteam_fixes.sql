-- FIX 1: REGRESIÓN DE STORAGE (Evitar phishing, solo permitir imágenes)
DROP POLICY IF EXISTS "profiles_bucket_owner_insert" ON storage.objects;
CREATE POLICY "profiles_bucket_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) IN ('jpg','jpeg','png','webp','gif'))
);

-- FIX 2: TRIGGER DE NUEVOS USUARIOS (Guardar DNI y Municipio de forma nativa al registrarse)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dni, municipality_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'dni',
    (NEW.raw_user_meta_data->>'municipality_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- FIX 3: DESBLOQUEO RLS PARA CALIFICACIONES (Permitir al vecino votar cuando está Cerrado)
DROP POLICY IF EXISTS "claims_owner_rate" ON public.claims;
CREATE POLICY "claims_owner_rate" ON public.claims
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'Cerrado'::claim_status
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'Cerrado'::claim_status
  );