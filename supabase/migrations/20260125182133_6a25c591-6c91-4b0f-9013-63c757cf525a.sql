-- =========================================================
-- PHASE 1: MULTI-TENANT HOTEL MANAGEMENT SYSTEM CORE
-- =========================================================

-- 1. Create custom types/enums
-- =========================================================

-- App roles for the entire system
CREATE TYPE public.app_role AS ENUM (
  'superadmin',
  'owner',
  'manager',
  'front_desk',
  'accountant',
  'housekeeping',
  'maintenance',
  'kitchen',
  'waiter',
  'night_auditor'
);

-- Subscription plans
CREATE TYPE public.subscription_plan AS ENUM (
  'starter',
  'growth',
  'pro'
);

-- Tenant status
CREATE TYPE public.tenant_status AS ENUM (
  'active',
  'suspended',
  'pending'
);

-- Property status
CREATE TYPE public.property_status AS ENUM (
  'active',
  'inactive',
  'maintenance'
);

-- Room status
CREATE TYPE public.room_status AS ENUM (
  'vacant',
  'occupied',
  'dirty',
  'maintenance',
  'out_of_order'
);

-- Reservation status
CREATE TYPE public.reservation_status AS ENUM (
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'no_show'
);

-- Payment method
CREATE TYPE public.payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'other'
);

-- Folio item type
CREATE TYPE public.folio_item_type AS ENUM (
  'room_charge',
  'food_beverage',
  'laundry',
  'minibar',
  'spa',
  'parking',
  'telephone',
  'internet',
  'miscellaneous',
  'tax',
  'service_charge',
  'discount',
  'deposit'
);

-- Booking source
CREATE TYPE public.booking_source AS ENUM (
  'direct',
  'phone',
  'walk_in',
  'website',
  'ota_booking',
  'ota_expedia',
  'ota_agoda',
  'corporate',
  'travel_agent',
  'other'
);

-- =========================================================
-- 2. Core Platform Tables
-- =========================================================

-- TENANTS: The top-level organization (hotel company)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PLANS: Subscription plan definitions (mock)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type subscription_plan NOT NULL UNIQUE,
  max_properties INTEGER NOT NULL DEFAULT 1,
  max_staff INTEGER NOT NULL DEFAULT 10,
  max_rooms INTEGER NOT NULL DEFAULT 50,
  features JSONB NOT NULL DEFAULT '{}',
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUBSCRIPTIONS: Tenant's active plan (mock - no real payments)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- PROPERTIES: Individual hotels/locations within a tenant
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status property_status NOT NULL DEFAULT 'active',
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  service_charge_rate DECIMAL(5,2) DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- PROFILES: Links Supabase Auth users to tenants
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name TEXT,
  username TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index for username within tenant (allows same username across tenants)
CREATE UNIQUE INDEX idx_profiles_tenant_username ON public.profiles(tenant_id, username) WHERE tenant_id IS NOT NULL;
-- Allow superadmin (null tenant) usernames to be unique globally
CREATE UNIQUE INDEX idx_profiles_superadmin_username ON public.profiles(username) WHERE tenant_id IS NULL;

-- USER_ROLES: Role assignments (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- PROPERTY_ACCESS: Which properties a user can access
CREATE TABLE public.property_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- FEATURE_FLAGS: Enable/disable features per tenant
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, feature_name)
);

-- AUDIT_LOGS: Track critical actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 3. PMS Core Tables
-- =========================================================

-- ROOM_TYPES: Categories of rooms
CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, code)
);

-- ROOMS: Individual rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  room_number TEXT NOT NULL,
  floor TEXT,
  status room_status NOT NULL DEFAULT 'vacant',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, room_number)
);

-- GUESTS: Guest profiles
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_type TEXT,
  id_number TEXT,
  nationality TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  country TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason TEXT,
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  corporate_account_id UUID,
  total_stays INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RESERVATIONS: Bookings
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  confirmation_number TEXT NOT NULL,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  status reservation_status NOT NULL DEFAULT 'confirmed',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  source booking_source NOT NULL DEFAULT 'direct',
  source_reference TEXT,
  special_requests TEXT,
  internal_notes TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, confirmation_number)
);

-- RESERVATION_ROOMS: Links reservations to rooms
CREATE TABLE public.reservation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  rate_per_night DECIMAL(10,2) NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FOLIOS: Guest bills
CREATE TABLE public.folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
  folio_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, folio_number)
);

-- FOLIO_ITEMS: Line items on folios
CREATE TABLE public.folio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  item_type folio_item_type NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id UUID,
  reference_type TEXT,
  is_posted BOOLEAN NOT NULL DEFAULT true,
  posted_by UUID REFERENCES auth.users(id),
  voided BOOLEAN NOT NULL DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAYMENTS: Payment records
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  folio_id UUID NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number TEXT,
  notes TEXT,
  received_by UUID REFERENCES auth.users(id),
  voided BOOLEAN NOT NULL DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REFUNDS: Refund records
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HOUSEKEEPING_TASKS: Cleaning assignments
CREATE TABLE public.housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  task_type TEXT NOT NULL DEFAULT 'cleaning',
  priority INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MAINTENANCE_TICKETS: Repair requests
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 4. Security Definer Functions
-- =========================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'superadmin')
$$;

-- Get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id
$$;

-- Check if user has access to a property
CREATE OR REPLACE FUNCTION public.has_property_access(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_access
    WHERE user_id = _user_id
      AND property_id = _property_id
  )
  OR public.is_superadmin(_user_id)
  OR public.has_role(_user_id, 'owner')
$$;

-- Get current user's tenant_id (convenience function)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_tenant_id(auth.uid())
$$;

-- =========================================================
-- 5. RLS Policies
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- TENANTS policies
CREATE POLICY "Superadmins can do everything with tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.current_tenant_id());

-- PLANS policies (readable by all authenticated)
CREATE POLICY "Anyone can view plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only superadmins can manage plans"
  ON public.plans FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- SUBSCRIPTIONS policies
CREATE POLICY "Superadmins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view their tenant subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- PROPERTIES policies
CREATE POLICY "Superadmins can manage all properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view their tenant properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Owners and managers can manage tenant properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'))
  );

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Superadmins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Owners can view tenant profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Owners can manage tenant profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.has_role(auth.uid(), 'owner')
    AND id != auth.uid()
  );

-- USER_ROLES policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- PROPERTY_ACCESS policies
CREATE POLICY "Users can view their own property access"
  ON public.property_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all property access"
  ON public.property_access FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Owners can manage tenant property access"
  ON public.property_access FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    AND EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = property_id 
      AND p.tenant_id = public.current_tenant_id()
    )
  );

-- FEATURE_FLAGS policies
CREATE POLICY "Superadmins can manage feature flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view their tenant feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- AUDIT_LOGS policies
CREATE POLICY "Superadmins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Owners can view tenant audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tenant-scoped table policies (ROOM_TYPES, ROOMS, GUESTS, etc.)
-- These follow the pattern: superadmin full access, tenant users see only their data

-- ROOM_TYPES
CREATE POLICY "Superadmins full access to room_types"
  ON public.room_types FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view room_types"
  ON public.room_types FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Owners/managers can manage room_types"
  ON public.room_types FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'))
  );

-- ROOMS
CREATE POLICY "Superadmins full access to rooms"
  ON public.rooms FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view rooms"
  ON public.rooms FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can update room status"
  ON public.rooms FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Owners/managers can manage rooms"
  ON public.rooms FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'))
  );

-- GUESTS
CREATE POLICY "Superadmins full access to guests"
  ON public.guests FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view guests"
  ON public.guests FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage guests"
  ON public.guests FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
    )
  );

-- RESERVATIONS
CREATE POLICY "Superadmins full access to reservations"
  ON public.reservations FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage reservations"
  ON public.reservations FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
    )
  );

-- RESERVATION_ROOMS
CREATE POLICY "Superadmins full access to reservation_rooms"
  ON public.reservation_rooms FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view reservation_rooms"
  ON public.reservation_rooms FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage reservation_rooms"
  ON public.reservation_rooms FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
    )
  );

-- FOLIOS
CREATE POLICY "Superadmins full access to folios"
  ON public.folios FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view folios"
  ON public.folios FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage folios"
  ON public.folios FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'accountant')
    )
  );

-- FOLIO_ITEMS
CREATE POLICY "Superadmins full access to folio_items"
  ON public.folio_items FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view folio_items"
  ON public.folio_items FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage folio_items"
  ON public.folio_items FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'accountant')
    )
  );

-- PAYMENTS
CREATE POLICY "Superadmins full access to payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'accountant')
    )
  );

-- REFUNDS
CREATE POLICY "Superadmins full access to refunds"
  ON public.refunds FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view refunds"
  ON public.refunds FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can create refunds"
  ON public.refunds FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'accountant')
    )
  );

CREATE POLICY "Only owners/managers can approve refunds"
  ON public.refunds FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'manager'))
  );

-- HOUSEKEEPING_TASKS
CREATE POLICY "Superadmins full access to housekeeping_tasks"
  ON public.housekeeping_tasks FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view housekeeping_tasks"
  ON public.housekeeping_tasks FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage housekeeping_tasks"
  ON public.housekeeping_tasks FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'housekeeping')
    )
  );

-- MAINTENANCE_TICKETS
CREATE POLICY "Superadmins full access to maintenance_tickets"
  ON public.maintenance_tickets FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant users can view maintenance_tickets"
  ON public.maintenance_tickets FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Authorized staff can manage maintenance_tickets"
  ON public.maintenance_tickets FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'front_desk')
      OR public.has_role(auth.uid(), 'maintenance')
    )
  );

-- =========================================================
-- 6. Triggers
-- =========================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservation_rooms_updated_at BEFORE UPDATE ON public.reservation_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_folios_updated_at BEFORE UPDATE ON public.folios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON public.housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_tickets_updated_at BEFORE UPDATE ON public.maintenance_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. Seed Data: Plans
-- =========================================================

INSERT INTO public.plans (name, plan_type, max_properties, max_staff, max_rooms, features, price_monthly) VALUES
('Starter', 'starter', 1, 10, 50, '{"pms": true, "crm": false, "pos": false, "advanced_reports": false}', 49.00),
('Growth', 'growth', 3, 30, 150, '{"pms": true, "crm": true, "pos": false, "advanced_reports": false}', 99.00),
('Pro', 'pro', 999, 999, 9999, '{"pms": true, "crm": true, "pos": true, "advanced_reports": true}', 199.00);

-- =========================================================
-- 8. Helper function to create profile on signup
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 9. Generate confirmation number function
-- =========================================================

CREATE OR REPLACE FUNCTION public.generate_confirmation_number(property_code TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYMMDD');
  seq_num := floor(random() * 9000 + 1000)::INTEGER;
  RETURN UPPER(property_code) || '-' || today_str || '-' || seq_num::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 10. Generate folio number function
-- =========================================================

CREATE OR REPLACE FUNCTION public.generate_folio_number(property_code TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_num INTEGER;
  today_str TEXT;
BEGIN
  today_str := to_char(CURRENT_DATE, 'YYMMDD');
  seq_num := floor(random() * 9000 + 1000)::INTEGER;
  RETURN 'F-' || UPPER(property_code) || '-' || today_str || '-' || seq_num::TEXT;
END;
$$ LANGUAGE plpgsql;