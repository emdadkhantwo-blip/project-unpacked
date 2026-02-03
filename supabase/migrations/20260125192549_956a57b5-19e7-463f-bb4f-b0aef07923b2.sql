-- Update handle_new_user function to auto-create tenant and property for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tenant_id uuid;
  new_property_id uuid;
  user_name text;
BEGIN
  -- Get user's name for tenant naming
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Create new tenant for the user
  INSERT INTO public.tenants (name, slug, contact_email, status)
  VALUES (
    user_name || '''s Hotel',
    'tenant-' || substr(NEW.id::text, 1, 8),
    NEW.email,
    'active'
  )
  RETURNING id INTO new_tenant_id;

  -- Create a default property for the tenant
  INSERT INTO public.properties (tenant_id, name, code, email, status)
  VALUES (
    new_tenant_id,
    'Main Property',
    'MAIN',
    NEW.email,
    'active'
  )
  RETURNING id INTO new_property_id;

  -- Create the user profile with tenant association
  INSERT INTO public.profiles (id, username, email, full_name, tenant_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_tenant_id,
    true
  );

  -- Assign owner role to the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');

  -- Grant property access to the new user
  INSERT INTO public.property_access (user_id, property_id)
  VALUES (NEW.id, new_property_id);

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();