-- Guest Notes table for staff observations
CREATE TABLE public.guest_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_notes
CREATE POLICY "Tenant users can view guest notes"
ON public.guest_notes FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Authorized staff can manage guest notes"
ON public.guest_notes FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'front_desk')
  )
);

CREATE POLICY "Superadmins full access to guest_notes"
ON public.guest_notes FOR ALL
USING (is_superadmin(auth.uid()));

-- Corporate Accounts table
CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  account_code TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  discount_percentage NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT DEFAULT 'net30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corporate_accounts
CREATE POLICY "Tenant users can view corporate accounts"
ON public.corporate_accounts FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Authorized staff can manage corporate accounts"
ON public.corporate_accounts FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'front_desk')
  )
);

CREATE POLICY "Superadmins full access to corporate_accounts"
ON public.corporate_accounts FOR ALL
USING (is_superadmin(auth.uid()));

-- Add unique constraint for account_code per tenant
ALTER TABLE public.corporate_accounts 
ADD CONSTRAINT unique_account_code_per_tenant UNIQUE (tenant_id, account_code);

-- Create trigger for updated_at
CREATE TRIGGER update_corporate_accounts_updated_at
BEFORE UPDATE ON public.corporate_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();