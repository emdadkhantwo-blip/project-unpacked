-- Create storage bucket for hotel logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-logos', 'hotel-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to applications folder (for application submissions)
CREATE POLICY "Anyone can upload application logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hotel-logos' AND (storage.foldername(name))[1] = 'applications');

-- Allow public read access to all hotel logos
CREATE POLICY "Public read access to hotel logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hotel-logos');