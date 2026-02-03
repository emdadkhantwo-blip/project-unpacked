-- Add username column to admin_applications table
ALTER TABLE public.admin_applications
ADD COLUMN IF NOT EXISTS username TEXT;