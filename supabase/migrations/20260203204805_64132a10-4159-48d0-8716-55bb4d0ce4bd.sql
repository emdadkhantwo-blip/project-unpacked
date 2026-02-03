-- Create plans table for subscription management
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'growth', 'pro')),
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  max_properties INTEGER NOT NULL DEFAULT 1,
  max_rooms INTEGER NOT NULL DEFAULT 10,
  max_staff INTEGER NOT NULL DEFAULT 5,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.plans (name, plan_type, price_monthly, max_properties, max_rooms, max_staff, features) VALUES
  ('Starter', 'starter', 29, 1, 20, 5, '{"basic_reports": true, "email_support": true}'::jsonb),
  ('Growth', 'growth', 79, 3, 100, 20, '{"advanced_reports": true, "priority_support": true, "pos_integration": true}'::jsonb),
  ('Premium', 'pro', 199, 999, 999, 999, '{"all_features": true, "dedicated_support": true, "custom_integrations": true}'::jsonb);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read plans (public pricing)
CREATE POLICY "Anyone can view plans"
ON public.plans
FOR SELECT
USING (true);