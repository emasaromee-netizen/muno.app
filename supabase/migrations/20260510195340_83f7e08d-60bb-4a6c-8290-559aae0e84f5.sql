-- Permitir a cualquier usuario autenticado insertar municipios (la UI ya está restringida a Super Admin)
DROP POLICY IF EXISTS "municipalities_authenticated_insert" ON public.municipalities;
CREATE POLICY "municipalities_authenticated_insert"
ON public.municipalities
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "municipalities_authenticated_update" ON public.municipalities;
CREATE POLICY "municipalities_authenticated_update"
ON public.municipalities
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'isa_super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'isa_super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));