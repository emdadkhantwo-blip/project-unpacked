-- Create biometric_credentials table for storing WebAuthn credentials
CREATE TABLE public.biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, credential_id)
);

-- Enable Row Level Security
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own credentials
CREATE POLICY "Users can manage their own credentials"
  ON public.biometric_credentials FOR ALL
  USING (profile_id = auth.uid());

-- RLS Policy: Owners/managers can view all tenant credentials
CREATE POLICY "Owners/managers can view all tenant credentials"
  ON public.biometric_credentials FOR SELECT
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

-- RLS Policy: Superadmins full access
CREATE POLICY "Superadmins full access to biometric_credentials"
  ON public.biometric_credentials FOR ALL
  USING (is_superadmin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_biometric_credentials_profile_id ON public.biometric_credentials(profile_id);
CREATE INDEX idx_biometric_credentials_tenant_id ON public.biometric_credentials(tenant_id);