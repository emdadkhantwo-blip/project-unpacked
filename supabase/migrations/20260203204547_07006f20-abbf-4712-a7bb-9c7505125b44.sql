-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view tenant profiles" ON public.profiles;

-- Recreate with non-recursive logic using auth.uid() directly
CREATE POLICY "Users can view tenant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() 
  OR 
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Add SELECT policy for superadmins to view admin_applications
CREATE POLICY "Superadmins can view applications" 
ON public.admin_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Add UPDATE policy for superadmins to manage applications
CREATE POLICY "Superadmins can update applications" 
ON public.admin_applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Add DELETE policy for superadmins
CREATE POLICY "Superadmins can delete applications" 
ON public.admin_applications 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Fix tenants table RLS - add policy for superadmins
CREATE POLICY "Superadmins can view all tenants" 
ON public.tenants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can manage all tenants" 
ON public.tenants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);