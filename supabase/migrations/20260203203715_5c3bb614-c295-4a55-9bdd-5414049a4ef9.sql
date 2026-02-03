-- Add logo_url column to admin_applications table
ALTER TABLE public.admin_applications
ADD COLUMN IF NOT EXISTS logo_url TEXT;