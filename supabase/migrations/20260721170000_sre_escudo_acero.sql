-- 1. BLOQUEO DE MALWARE EN STORAGE (Bucket 'avatars')
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.extension(name) IN ('jpg','jpeg','png','webp','gif'))
  );

-- 2. BLOQUEO DE MASS ASSIGNMENT EN RECLAMOS (Anti-Tampering)
CREATE OR REPLACE FUNCTION public.prevent_closed_claim_tampering()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Si el reclamo ya estaba cerrado y sigue cerrado
  IF OLD.status = 'Cerrado' AND NEW.status = 'Cerrado' THEN
    -- Si intenta cambiar algo que NO sea el rating (calificación)
    IF NEW.description != OLD.description OR NEW.category != OLD.category OR NEW.evidence_photos != OLD.evidence_photos OR NEW.municipality_id != OLD.municipality_id THEN
      RAISE EXCEPTION 'Fraude detectado: No se pueden alterar los datos periciales de un reclamo cerrado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_closed_claim_tampering ON public.claims;
CREATE TRIGGER trg_prevent_closed_claim_tampering 
  BEFORE UPDATE ON public.claims 
  FOR EACH ROW EXECUTE FUNCTION public.prevent_closed_claim_tampering();