-- Add missing columns to tenants table for approve-application edge function
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Also add missing columns to profiles table that the edge function uses
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS auth_email TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Also add missing columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage subscriptions
CREATE POLICY "Superadmins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Tenant members can view their subscription
CREATE POLICY "Tenant members can view their subscription"
ON public.subscriptions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create property_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.property_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS on property_access
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage property access
CREATE POLICY "Superadmins can manage property_access"
ON public.property_access
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Tenant members can view property access
CREATE POLICY "Tenant members can view property_access"
ON public.property_access
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Create feature_flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, feature_name)
);

-- Enable RLS on feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage feature flags
CREATE POLICY "Superadmins can manage feature_flags"
ON public.feature_flags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Tenant members can view their feature flags
CREATE POLICY "Tenant members can view feature_flags"
ON public.feature_flags
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Add reviewed_by and reviewed_at columns to admin_applications
ALTER TABLE public.admin_applications
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;