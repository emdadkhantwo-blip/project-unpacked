-- Create application status enum
CREATE TYPE public.admin_application_status AS ENUM ('pending', 'approved', 'rejected');

-- Create admin_applications table
CREATE TABLE public.admin_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  hotel_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  status public.admin_application_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraints
ALTER TABLE public.admin_applications ADD CONSTRAINT admin_applications_username_key UNIQUE (username);
ALTER TABLE public.admin_applications ADD CONSTRAINT admin_applications_email_key UNIQUE (email);

-- Enable RLS
ALTER TABLE public.admin_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anonymous) can submit application
CREATE POLICY "Anyone can submit application"
  ON public.admin_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Superadmins can view all applications
CREATE POLICY "Superadmins can view applications"
  ON public.admin_applications FOR SELECT
  USING (is_superadmin(auth.uid()));

-- Policy: Superadmins can update applications
CREATE POLICY "Superadmins can update applications"
  ON public.admin_applications FOR UPDATE
  USING (is_superadmin(auth.uid()));

-- Policy: Superadmins can delete applications
CREATE POLICY "Superadmins can delete applications"
  ON public.admin_applications FOR DELETE
  USING (is_superadmin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_applications_updated_at
  BEFORE UPDATE ON public.admin_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();