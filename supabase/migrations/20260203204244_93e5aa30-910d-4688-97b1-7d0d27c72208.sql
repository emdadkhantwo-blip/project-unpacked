-- Add password column to admin_applications table for storing the initial password
ALTER TABLE public.admin_applications
ADD COLUMN IF NOT EXISTS password TEXT;