-- Create references table for managing booking references with discounts
CREATE TABLE public.references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  fixed_discount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Enable RLS
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for references table
CREATE POLICY "Superadmins full access to references"
ON public.references
FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage references"
ON public.references
FOR ALL
USING (
  tenant_id = current_tenant_id() 
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Tenant users can view active references"
ON public.references
FOR SELECT
USING (tenant_id = current_tenant_id() AND is_active = true);

-- Add reference_id and discount_amount to reservations
ALTER TABLE public.reservations 
  ADD COLUMN reference_id UUID REFERENCES public.references(id),
  ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_references_updated_at
BEFORE UPDATE ON public.references
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();