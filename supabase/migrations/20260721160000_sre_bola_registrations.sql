-- 🔴 CRÍTICO: Bloqueo de Suplantación de Identidad y Contaminación Cruzada en Inscripciones
DROP POLICY IF EXISTS "registrations_public_insert" ON public.registrations;

CREATE POLICY "registrations_public_insert" ON public.registrations 
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (
      (auth.uid() IS NULL AND user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
      OR 
      (auth.uid() = user_id)
    )
    AND EXISTS (
      SELECT 1 FROM public.content_items 
      WHERE content_items.id::text = registrations.event_id::text
        AND content_items.municipality_id = registrations.municipality_id
    )
  );