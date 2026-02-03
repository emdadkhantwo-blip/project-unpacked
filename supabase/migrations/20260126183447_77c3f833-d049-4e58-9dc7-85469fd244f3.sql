-- Add policy to allow owners/managers to upload avatars for staff in their tenant
CREATE POLICY "Owners and managers can upload staff avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  )
);

-- Add policy to allow owners/managers to update staff avatars
CREATE POLICY "Owners and managers can update staff avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  )
);

-- Add policy to allow owners/managers to delete staff avatars
CREATE POLICY "Owners and managers can delete staff avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  )
);