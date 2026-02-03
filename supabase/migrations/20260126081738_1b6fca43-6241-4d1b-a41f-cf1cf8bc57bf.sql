-- Create storage bucket for hotel logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-logos',
  'hotel-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create policies for hotel-logos bucket
-- Allow public read access
CREATE POLICY "Public can view hotel logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hotel-logos');

-- Allow authenticated users with owner/manager role to upload logos for their tenant
CREATE POLICY "Owners and managers can upload hotel logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hotel-logos' 
  AND auth.role() = 'authenticated'
  AND (
    public.has_role(auth.uid(), 'owner') 
    OR public.has_role(auth.uid(), 'manager')
  )
);

-- Allow owners and managers to update their logos
CREATE POLICY "Owners and managers can update hotel logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hotel-logos'
  AND (
    public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'manager')
  )
);

-- Allow owners and managers to delete their logos
CREATE POLICY "Owners and managers can delete hotel logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hotel-logos'
  AND (
    public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'manager')
  )
);