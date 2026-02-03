-- POS OUTLETS: Restaurant, bar, etc.
CREATE TABLE public.pos_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'restaurant', -- restaurant, bar, cafe, room_service
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, code)
);

-- POS MENU CATEGORIES
CREATE TABLE public.pos_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.pos_outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS MENU ITEMS
CREATE TABLE public.pos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.pos_outlets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.pos_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  prep_time_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, code)
);

-- POS ORDER STATUS ENUM
CREATE TYPE public.pos_order_status AS ENUM (
  'pending',
  'preparing',
  'ready',
  'served',
  'cancelled',
  'posted'
);

-- POS ORDERS
CREATE TABLE public.pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.pos_outlets(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  folio_id UUID REFERENCES public.folios(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  table_number TEXT,
  covers INTEGER DEFAULT 1,
  status pos_order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS ORDER ITEMS
CREATE TABLE public.pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.pos_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, served
  prepared_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generate POS order number function
CREATE OR REPLACE FUNCTION public.generate_pos_order_number(outlet_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYMMDD');
  seq_num := floor(random() * 9000 + 1000)::INTEGER;
  RETURN UPPER(outlet_code) || '-' || today_str || '-' || seq_num::TEXT;
END;
$$;

-- Enable RLS
ALTER TABLE public.pos_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;

-- POS Outlets policies
CREATE POLICY "Tenant users can view pos_outlets"
ON public.pos_outlets FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Managers can manage pos_outlets"
ON public.pos_outlets FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Superadmins full access to pos_outlets"
ON public.pos_outlets FOR ALL
USING (is_superadmin(auth.uid()));

-- POS Categories policies
CREATE POLICY "Tenant users can view pos_categories"
ON public.pos_categories FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Managers can manage pos_categories"
ON public.pos_categories FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Superadmins full access to pos_categories"
ON public.pos_categories FOR ALL
USING (is_superadmin(auth.uid()));

-- POS Items policies
CREATE POLICY "Tenant users can view pos_items"
ON public.pos_items FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Managers can manage pos_items"
ON public.pos_items FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Superadmins full access to pos_items"
ON public.pos_items FOR ALL
USING (is_superadmin(auth.uid()));

-- POS Orders policies
CREATE POLICY "Tenant users can view pos_orders"
ON public.pos_orders FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Authorized staff can manage pos_orders"
ON public.pos_orders FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'front_desk') OR
    has_role(auth.uid(), 'waiter') OR
    has_role(auth.uid(), 'kitchen')
  )
);

CREATE POLICY "Superadmins full access to pos_orders"
ON public.pos_orders FOR ALL
USING (is_superadmin(auth.uid()));

-- POS Order Items policies
CREATE POLICY "Tenant users can view pos_order_items"
ON public.pos_order_items FOR SELECT
USING (tenant_id = current_tenant_id());

CREATE POLICY "Authorized staff can manage pos_order_items"
ON public.pos_order_items FOR ALL
USING (
  tenant_id = current_tenant_id() AND (
    has_role(auth.uid(), 'owner') OR
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'front_desk') OR
    has_role(auth.uid(), 'waiter') OR
    has_role(auth.uid(), 'kitchen')
  )
);

CREATE POLICY "Superadmins full access to pos_order_items"
ON public.pos_order_items FOR ALL
USING (is_superadmin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_pos_outlets_updated_at
BEFORE UPDATE ON public.pos_outlets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_items_updated_at
BEFORE UPDATE ON public.pos_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_orders_updated_at
BEFORE UPDATE ON public.pos_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for kitchen display
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_order_items;