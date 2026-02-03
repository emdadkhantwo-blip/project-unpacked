-- Create a security definer function to look up auth email by username
-- This allows unauthenticated users to find the email needed for login
CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(lookup_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth_email, email)
  FROM public.profiles
  WHERE username = lookup_username
    AND is_active = true
  LIMIT 1
$$;