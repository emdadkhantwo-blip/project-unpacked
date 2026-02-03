-- ==================== ENUMS ====================

CREATE TYPE public.reservation_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE public.room_status AS ENUM ('vacant', 'occupied', 'dirty', 'maintenance', 'out_of_order');
CREATE TYPE public.housekeeping_status AS ENUM ('clean', 'dirty', 'inspected', 'out_of_service');
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.folio_status AS ENUM ('open', 'closed');
CREATE TYPE public.folio_item_type AS ENUM ('room_charge', 'food_beverage', 'laundry', 'minibar', 'spa', 'parking', 'telephone', 'internet', 'miscellaneous', 'adjustment', 'discount', 'tax', 'service_charge');
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment', 'corporate_billing', 'other');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'front_desk', 'housekeeping', 'maintenance', 'kitchen', 'waiter', 'pos');

-- ==================== TENANTS ====================

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  currency TEXT DEFAULT 'BDT',
  timezone TEXT DEFAULT 'Asia/Dhaka',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== PROPERTIES ====================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  star_rating INTEGER,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '12:00',
  tax_rate NUMERIC DEFAULT 0,
  service_charge_rate NUMERIC DEFAULT 0,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== PROFILES ====================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name TEXT,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'staff',
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== USER ROLES ====================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ==================== ROOM TYPES ====================

CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  max_adults INTEGER DEFAULT 2,
  max_children INTEGER DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== ROOMS ====================

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  room_number TEXT NOT NULL,
  floor TEXT,
  status public.room_status DEFAULT 'vacant',
  housekeeping_status public.housekeeping_status DEFAULT 'clean',
  is_smoking BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== GUESTS ====================

CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  id_type TEXT,
  id_number TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  is_vip BOOLEAN DEFAULT false,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  corporate_account_id UUID,
  preferences JSONB DEFAULT '{}',
  total_stays INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== RESERVATIONS ====================

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  confirmation_number TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  status public.reservation_status DEFAULT 'confirmed',
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  special_requests TEXT,
  source TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== RESERVATION ROOMS ====================

CREATE TABLE public.reservation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  rate_per_night NUMERIC NOT NULL DEFAULT 0,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== FOLIOS ====================

CREATE TABLE public.folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  folio_number TEXT NOT NULL,
  status public.folio_status DEFAULT 'open',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  service_charge NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== FOLIO ITEMS ====================

CREATE TABLE public.folio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_type public.folio_item_type NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  service_date DATE,
  is_posted BOOLEAN DEFAULT true,
  voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== PAYMENTS ====================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method public.payment_method NOT NULL,
  reference_number TEXT,
  notes TEXT,
  corporate_account_id UUID,
  voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== CORPORATE ACCOUNTS ====================

CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  discount_percentage NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== GUEST CORPORATE ACCOUNTS ====================

CREATE TABLE public.guest_corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== HOUSEKEEPING TASKS ====================

CREATE TABLE public.housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  status public.task_status DEFAULT 'pending',
  notes TEXT,
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== MAINTENANCE TICKETS ====================

CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open',
  category TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  reported_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== GUEST NOTES ====================

CREATE TABLE public.guest_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== ADMIN APPLICATIONS ====================

CREATE TABLE public.admin_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name TEXT NOT NULL,
  contact_name TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  property_count INTEGER DEFAULT 1,
  room_count INTEGER DEFAULT 0,
  current_software TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== ENABLE RLS ====================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_applications ENABLE ROW LEVEL SECURITY;

-- ==================== RLS POLICIES ====================

-- Tenants: Users can view their tenant
CREATE POLICY "Users can view their tenant" ON public.tenants FOR SELECT USING (
  id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Properties: Users can view properties in their tenant
CREATE POLICY "Users can view tenant properties" ON public.properties FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view tenant profiles" ON public.profiles FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- User roles: Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Room types: Tenant members can view
CREATE POLICY "Tenant members can view room types" ON public.room_types FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage room types" ON public.room_types FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Rooms: Tenant members can view and manage
CREATE POLICY "Tenant members can view rooms" ON public.rooms FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage rooms" ON public.rooms FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Guests: Tenant members can view and manage
CREATE POLICY "Tenant members can view guests" ON public.guests FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage guests" ON public.guests FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Reservations: Tenant members can view and manage
CREATE POLICY "Tenant members can view reservations" ON public.reservations FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage reservations" ON public.reservations FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Reservation rooms: Based on parent reservation
CREATE POLICY "View reservation rooms" ON public.reservation_rooms FOR SELECT USING (
  reservation_id IN (
    SELECT id FROM public.reservations WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Manage reservation rooms" ON public.reservation_rooms FOR ALL USING (
  reservation_id IN (
    SELECT id FROM public.reservations WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Folios: Tenant members can view and manage
CREATE POLICY "Tenant members can view folios" ON public.folios FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage folios" ON public.folios FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Folio items: Based on parent folio
CREATE POLICY "View folio items" ON public.folio_items FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Manage folio items" ON public.folio_items FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Payments: Based on parent folio
CREATE POLICY "View payments" ON public.payments FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Manage payments" ON public.payments FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Corporate accounts: Tenant members can view and manage
CREATE POLICY "Tenant members can view corporate accounts" ON public.corporate_accounts FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage corporate accounts" ON public.corporate_accounts FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Guest corporate accounts: Based on guest
CREATE POLICY "View guest corporate accounts" ON public.guest_corporate_accounts FOR SELECT USING (
  guest_id IN (
    SELECT id FROM public.guests WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "Manage guest corporate accounts" ON public.guest_corporate_accounts FOR ALL USING (
  guest_id IN (
    SELECT id FROM public.guests WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Housekeeping tasks: Tenant members can view and manage
CREATE POLICY "Tenant members can view housekeeping tasks" ON public.housekeeping_tasks FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage housekeeping tasks" ON public.housekeeping_tasks FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Maintenance tickets: Tenant members can view and manage
CREATE POLICY "Tenant members can view maintenance tickets" ON public.maintenance_tickets FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage maintenance tickets" ON public.maintenance_tickets FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Guest notes: Tenant members can view and manage
CREATE POLICY "Tenant members can view guest notes" ON public.guest_notes FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant members can manage guest notes" ON public.guest_notes FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Admin applications: Public insert, restricted view
CREATE POLICY "Anyone can submit applications" ON public.admin_applications FOR INSERT WITH CHECK (true);

-- ==================== HELPER FUNCTIONS ====================

CREATE OR REPLACE FUNCTION public.generate_folio_number(property_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  folio_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.folios
  WHERE folio_number LIKE property_code || '-%';
  
  folio_num := property_code || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN folio_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_confirmation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;