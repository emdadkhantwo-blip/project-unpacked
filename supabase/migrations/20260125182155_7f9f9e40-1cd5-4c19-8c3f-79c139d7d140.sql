-- Fix security warnings: Set search_path on functions and audit log policy

-- Fix 1: update_updated_at_column - set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 2: handle_new_user - already has search_path, but ensure it's set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 3: generate_confirmation_number - set search_path
CREATE OR REPLACE FUNCTION public.generate_confirmation_number(property_code TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYMMDD');
  seq_num := floor(random() * 9000 + 1000)::INTEGER;
  RETURN UPPER(property_code) || '-' || today_str || '-' || seq_num::TEXT;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 4: generate_folio_number - set search_path
CREATE OR REPLACE FUNCTION public.generate_folio_number(property_code TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYMMDD');
  seq_num := floor(random() * 9000 + 1000)::INTEGER;
  RETURN 'F-' || UPPER(property_code) || '-' || today_str || '-' || seq_num::TEXT;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 5: Replace permissive audit_logs insert policy with proper restriction
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert their tenant audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IS NULL 
    OR tenant_id = public.current_tenant_id() 
    OR public.is_superadmin(auth.uid())
  );