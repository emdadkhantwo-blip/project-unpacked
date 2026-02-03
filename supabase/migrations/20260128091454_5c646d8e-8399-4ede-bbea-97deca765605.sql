-- Add explicit SELECT policy for owners/managers to view all documents in their tenant
CREATE POLICY "Owners/managers can view all tenant documents"
ON public.hr_documents
FOR SELECT
USING (
  (tenant_id = current_tenant_id()) 
  AND (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);