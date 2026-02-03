-- Add policy to allow owners to update their own tenant
CREATE POLICY "Owners can update their own tenant" 
ON public.tenants 
FOR UPDATE 
USING (id = current_tenant_id() AND public.has_role(auth.uid(), 'owner'))
WITH CHECK (id = current_tenant_id() AND public.has_role(auth.uid(), 'owner'));