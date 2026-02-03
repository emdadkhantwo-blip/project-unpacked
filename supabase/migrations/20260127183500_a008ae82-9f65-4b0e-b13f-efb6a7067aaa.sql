-- Create a many-to-many relationship table for guests and corporate accounts
CREATE TABLE public.guest_corporate_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guest_id, corporate_account_id)
);

-- Enable RLS
ALTER TABLE public.guest_corporate_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authorized staff can manage guest_corporate_accounts"
  ON public.guest_corporate_accounts
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND (
      has_role(auth.uid(), 'owner') OR 
      has_role(auth.uid(), 'manager') OR 
      has_role(auth.uid(), 'front_desk')
    )
  );

CREATE POLICY "Tenant users can view guest_corporate_accounts"
  ON public.guest_corporate_accounts
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Superadmins full access to guest_corporate_accounts"
  ON public.guest_corporate_accounts
  FOR ALL
  USING (is_superadmin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_guest_corporate_accounts_guest_id ON public.guest_corporate_accounts(guest_id);
CREATE INDEX idx_guest_corporate_accounts_corporate_account_id ON public.guest_corporate_accounts(corporate_account_id);
CREATE INDEX idx_guest_corporate_accounts_tenant_id ON public.guest_corporate_accounts(tenant_id);

-- Migrate existing data from guests.corporate_account_id to the new table
INSERT INTO public.guest_corporate_accounts (guest_id, corporate_account_id, tenant_id, is_primary)
SELECT id, corporate_account_id, tenant_id, true
FROM public.guests
WHERE corporate_account_id IS NOT NULL;