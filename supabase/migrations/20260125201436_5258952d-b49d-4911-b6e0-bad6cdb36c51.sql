-- Create night audit status enum
CREATE TYPE public.night_audit_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create night_audits table to track audit runs
CREATE TABLE public.night_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  status night_audit_status NOT NULL DEFAULT 'pending',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  run_by uuid REFERENCES auth.users(id),
  
  -- Statistics and report data
  rooms_charged integer DEFAULT 0,
  total_room_revenue numeric DEFAULT 0,
  total_fb_revenue numeric DEFAULT 0,
  total_other_revenue numeric DEFAULT 0,
  total_payments numeric DEFAULT 0,
  occupancy_rate numeric DEFAULT 0,
  adr numeric DEFAULT 0, -- Average Daily Rate
  revpar numeric DEFAULT 0, -- Revenue Per Available Room
  
  -- Detailed report data
  report_data jsonb DEFAULT '{}'::jsonb,
  notes text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one audit per property per business date
  UNIQUE (property_id, business_date)
);

-- Enable RLS
ALTER TABLE public.night_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Night auditors can manage night_audits"
  ON public.night_audits FOR ALL
  USING (
    tenant_id = current_tenant_id() AND (
      has_role(auth.uid(), 'owner') OR 
      has_role(auth.uid(), 'manager') OR 
      has_role(auth.uid(), 'night_auditor') OR
      has_role(auth.uid(), 'accountant')
    )
  );

CREATE POLICY "Superadmins full access to night_audits"
  ON public.night_audits FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view night_audits"
  ON public.night_audits FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Create trigger for updated_at
CREATE TRIGGER update_night_audits_updated_at
  BEFORE UPDATE ON public.night_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();