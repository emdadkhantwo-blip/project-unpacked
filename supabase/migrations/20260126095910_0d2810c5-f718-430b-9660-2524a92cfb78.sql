-- Allow anyone to upload to the applications folder in hotel-logos bucket
CREATE POLICY "Anyone can upload application logos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'hotel-logos' AND 
  (storage.foldername(name))[1] = 'applications'
);

-- Allow public read access to application logos
CREATE POLICY "Public can view application logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'hotel-logos' AND 
  (storage.foldername(name))[1] = 'applications'
);