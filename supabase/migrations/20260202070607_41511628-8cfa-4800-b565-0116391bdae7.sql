-- Create enums for rate and tax modules
CREATE TYPE rate_period_type AS ENUM ('weekend', 'seasonal', 'event', 'last_minute', 'holiday');
CREATE TYPE rate_adjustment_type AS ENUM ('fixed', 'percentage', 'override');
CREATE TYPE package_adjustment_type AS ENUM ('fixed', 'percentage');
CREATE TYPE tax_applies_to AS ENUM ('room', 'food', 'service', 'other', 'all');
CREATE TYPE tax_exemption_type AS ENUM ('full', 'partial');
CREATE TYPE tax_exemption_entity_type AS ENUM ('corporate_account', 'guest');
CREATE TYPE contact_submission_status AS ENUM ('new', 'read', 'replied');

-- =============================================
-- RATE & PACKAGE MANAGEMENT TABLES
-- =============================================

-- Rate Periods table for dynamic pricing
CREATE TABLE public.rate_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type rate_period_type NOT NULL DEFAULT 'seasonal',
  amount NUMERIC NOT NULL DEFAULT 0,
  adjustment_type rate_adjustment_type NOT NULL DEFAULT 'override',
  start_date DATE,
  end_date DATE,
  days_of_week INTEGER[] DEFAULT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Packages table for bundled offerings
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  adjustment_type package_adjustment_type NOT NULL DEFAULT 'fixed',
  valid_from DATE,
  valid_until DATE,
  min_nights INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  inclusions JSONB DEFAULT '[]'::jsonb,
  applicable_room_types UUID[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily rates for price calendar view
CREATE TABLE public.daily_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calculated_rate NUMERIC NOT NULL,
  rate_period_id UUID REFERENCES public.rate_periods(id) ON DELETE SET NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, room_type_id, date)
);

-- =============================================
-- VAT/TAX MODULE TABLES
-- =============================================

-- Tax configurations table
CREATE TABLE public.tax_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  is_compound BOOLEAN NOT NULL DEFAULT false,
  applies_to tax_applies_to[] NOT NULL DEFAULT '{all}',
  is_inclusive BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  calculation_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tax exemptions table
CREATE TABLE public.tax_exemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tax_configuration_id UUID NOT NULL REFERENCES public.tax_configurations(id) ON DELETE CASCADE,
  entity_type tax_exemption_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  exemption_type tax_exemption_type NOT NULL DEFAULT 'full',
  exemption_rate NUMERIC DEFAULT 100,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- WEBSITE BUILDER TABLES
-- =============================================

-- Website configurations table
CREATE TABLE public.website_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL DEFAULT 'modern',
  subdomain TEXT UNIQUE,
  custom_domain TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  primary_color TEXT DEFAULT '#1E3A5F',
  secondary_color TEXT DEFAULT '#D4AF37',
  font_family TEXT DEFAULT 'Inter',
  sections JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  hero_image_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

-- Website pages table
CREATE TABLE public.website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.website_configurations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(website_id, slug)
);

-- Website gallery table
CREATE TABLE public.website_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.website_configurations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact form submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.website_configurations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status contact_submission_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- MODIFY EXISTING TABLES
-- =============================================

-- Add tax_breakdown to folio_items
ALTER TABLE public.folio_items ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '{}'::jsonb;

-- Add use_advanced_tax to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS use_advanced_tax BOOLEAN DEFAULT false;

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_rate_periods_updated_at
  BEFORE UPDATE ON public.rate_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_configurations_updated_at
  BEFORE UPDATE ON public.tax_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_configurations_updated_at
  BEFORE UPDATE ON public.website_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_pages_updated_at
  BEFORE UPDATE ON public.website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TENANT VALIDATION TRIGGERS
-- =============================================

CREATE TRIGGER validate_rate_periods_tenant
  BEFORE INSERT OR UPDATE ON public.rate_periods
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

CREATE TRIGGER validate_packages_tenant
  BEFORE INSERT OR UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

CREATE TRIGGER validate_daily_rates_tenant
  BEFORE INSERT OR UPDATE ON public.daily_rates
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

CREATE TRIGGER validate_tax_configurations_tenant
  BEFORE INSERT OR UPDATE ON public.tax_configurations
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_tenant_match();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.rate_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Rate Periods policies
CREATE POLICY "Superadmins full access to rate_periods"
  ON public.rate_periods FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage rate_periods"
  ON public.rate_periods FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Tenant users can view rate_periods"
  ON public.rate_periods FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Packages policies
CREATE POLICY "Superadmins full access to packages"
  ON public.packages FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage packages"
  ON public.packages FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Tenant users can view packages"
  ON public.packages FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Daily Rates policies
CREATE POLICY "Superadmins full access to daily_rates"
  ON public.daily_rates FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage daily_rates"
  ON public.daily_rates FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Tenant users can view daily_rates"
  ON public.daily_rates FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Tax Configurations policies
CREATE POLICY "Superadmins full access to tax_configurations"
  ON public.tax_configurations FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers/accountants can manage tax_configurations"
  ON public.tax_configurations FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'))
  );

CREATE POLICY "Tenant users can view tax_configurations"
  ON public.tax_configurations FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Tax Exemptions policies
CREATE POLICY "Superadmins full access to tax_exemptions"
  ON public.tax_exemptions FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers/accountants can manage tax_exemptions"
  ON public.tax_exemptions FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'))
  );

CREATE POLICY "Tenant users can view tax_exemptions"
  ON public.tax_exemptions FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Website Configurations policies
CREATE POLICY "Superadmins full access to website_configurations"
  ON public.website_configurations FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage website_configurations"
  ON public.website_configurations FOR ALL
  USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Tenant users can view website_configurations"
  ON public.website_configurations FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Public access for published websites (for public website viewing)
CREATE POLICY "Public can view published websites"
  ON public.website_configurations FOR SELECT
  USING (is_published = true);

-- Website Pages policies
CREATE POLICY "Superadmins full access to website_pages"
  ON public.website_pages FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage website_pages"
  ON public.website_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id 
      AND wc.tenant_id = current_tenant_id()
      AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    )
  );

CREATE POLICY "Tenant users can view website_pages"
  ON public.website_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id AND wc.tenant_id = current_tenant_id()
    )
  );

CREATE POLICY "Public can view published pages"
  ON public.website_pages FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id AND wc.is_published = true
    )
  );

-- Website Gallery policies
CREATE POLICY "Superadmins full access to website_gallery"
  ON public.website_gallery FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage website_gallery"
  ON public.website_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id 
      AND wc.tenant_id = current_tenant_id()
      AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    )
  );

CREATE POLICY "Tenant users can view website_gallery"
  ON public.website_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id AND wc.tenant_id = current_tenant_id()
    )
  );

CREATE POLICY "Public can view gallery of published websites"
  ON public.website_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id AND wc.is_published = true
    )
  );

-- Contact Submissions policies
CREATE POLICY "Superadmins full access to contact_submissions"
  ON public.contact_submissions FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners/managers can manage contact_submissions"
  ON public.contact_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id 
      AND wc.tenant_id = current_tenant_id()
      AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    )
  );

CREATE POLICY "Front desk can view contact_submissions"
  ON public.contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id 
      AND wc.tenant_id = current_tenant_id()
      AND has_role(auth.uid(), 'front_desk')
    )
  );

-- Allow public to submit contact forms
CREATE POLICY "Public can submit contact forms"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.website_configurations wc
      WHERE wc.id = website_id AND wc.is_published = true
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_rate_periods_property ON public.rate_periods(property_id);
CREATE INDEX idx_rate_periods_room_type ON public.rate_periods(room_type_id);
CREATE INDEX idx_rate_periods_dates ON public.rate_periods(start_date, end_date);
CREATE INDEX idx_rate_periods_active ON public.rate_periods(is_active);

CREATE INDEX idx_packages_property ON public.packages(property_id);
CREATE INDEX idx_packages_dates ON public.packages(valid_from, valid_until);
CREATE INDEX idx_packages_active ON public.packages(is_active);

CREATE INDEX idx_daily_rates_lookup ON public.daily_rates(property_id, room_type_id, date);

CREATE INDEX idx_tax_configurations_property ON public.tax_configurations(property_id);
CREATE INDEX idx_tax_configurations_active ON public.tax_configurations(is_active);

CREATE INDEX idx_tax_exemptions_entity ON public.tax_exemptions(entity_type, entity_id);
CREATE INDEX idx_tax_exemptions_tax ON public.tax_exemptions(tax_configuration_id);

CREATE INDEX idx_website_configurations_subdomain ON public.website_configurations(subdomain);
CREATE INDEX idx_website_configurations_published ON public.website_configurations(is_published);

CREATE INDEX idx_website_pages_website ON public.website_pages(website_id);
CREATE INDEX idx_website_pages_slug ON public.website_pages(website_id, slug);

CREATE INDEX idx_website_gallery_website ON public.website_gallery(website_id);

CREATE INDEX idx_contact_submissions_website ON public.contact_submissions(website_id);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);