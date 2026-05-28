-- SOLO ISA SUPER ADMIN puede crear municipios

DROP POLICY IF EXISTS "municipalities_authenticated_insert"
ON public.municipalities;

CREATE POLICY "municipalities_super_admin_insert"
ON public.municipalities
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'isa_super_admin'::app_role)
);

-- UPDATE restringido
DROP POLICY IF EXISTS "municipalities_authenticated_update"
ON public.municipalities;

CREATE POLICY "municipalities_authenticated_update"
ON public.municipalities
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'isa_super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'isa_super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);