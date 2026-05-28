INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "profiles_bucket_public_read" ON storage.objects;
CREATE POLICY "profiles_bucket_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles_bucket_owner_insert" ON storage.objects;
CREATE POLICY "profiles_bucket_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profiles_bucket_owner_update" ON storage.objects;
CREATE POLICY "profiles_bucket_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profiles_bucket_owner_delete" ON storage.objects;
CREATE POLICY "profiles_bucket_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);