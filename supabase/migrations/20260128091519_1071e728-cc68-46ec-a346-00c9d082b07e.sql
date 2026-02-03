-- Add storage policies for hr-documents bucket
CREATE POLICY "Owners/managers can upload HR documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hr-documents' 
  AND has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owners/managers can view HR documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hr-documents' 
  AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Staff can view their own HR documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hr-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);