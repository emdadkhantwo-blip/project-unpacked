-- Fix the overly permissive INSERT policy for website_inquiries
-- Drop the existing policy and create a more specific one
DROP POLICY IF EXISTS "Public can create website inquiries" ON public.website_inquiries;

-- Create a new policy that still allows public inserts but with explicit column validation
CREATE POLICY "Public can create website inquiries" ON public.website_inquiries FOR INSERT
  WITH CHECK (
    website_id IN (SELECT id FROM website_configurations WHERE is_published = true)
    AND name IS NOT NULL 
    AND email IS NOT NULL 
    AND message IS NOT NULL
    AND status = 'new'
  );