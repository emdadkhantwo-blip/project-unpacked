
-- HR Management Module Schema
-- Phase 1: All 15 tables with RLS policies

-- Enums for HR module
CREATE TYPE public.hr_employment_type AS ENUM ('full_time', 'part_time', 'contract');
CREATE TYPE public.hr_leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.hr_payroll_status AS ENUM ('draft', 'finalized');
CREATE TYPE public.hr_overtime_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.hr_performance_note_type AS ENUM ('feedback', 'warning', 'reward', 'kpi');
CREATE TYPE public.hr_shift_assignment_status AS ENUM ('scheduled', 'completed', 'absent');

-- 1. HR Departments
CREATE TABLE public.hr_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view departments" ON public.hr_departments
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage departments" ON public.hr_departments
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_departments" ON public.hr_departments
  FOR ALL USING (is_superadmin(auth.uid()));

-- 2. HR Staff Profiles (extended employee info)
CREATE TABLE public.hr_staff_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  employment_type hr_employment_type NOT NULL DEFAULT 'full_time',
  join_date DATE,
  salary_amount NUMERIC DEFAULT 0,
  salary_currency TEXT DEFAULT 'BDT',
  bank_account TEXT,
  bank_name TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, staff_id),
  UNIQUE(tenant_id, profile_id)
);

ALTER TABLE public.hr_staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view hr_staff_profiles" ON public.hr_staff_profiles
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage hr_staff_profiles" ON public.hr_staff_profiles
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_staff_profiles" ON public.hr_staff_profiles
  FOR ALL USING (is_superadmin(auth.uid()));

-- 3. HR Permissions
CREATE TABLE public.hr_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions" ON public.hr_permissions
  FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage permissions" ON public.hr_permissions
  FOR ALL USING (is_superadmin(auth.uid()));

-- 4. HR Role Permissions (custom role-permission mapping)
CREATE TABLE public.hr_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.hr_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, role, permission_id)
);

ALTER TABLE public.hr_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view role permissions" ON public.hr_role_permissions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners can manage role permissions" ON public.hr_role_permissions
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Superadmins full access to hr_role_permissions" ON public.hr_role_permissions
  FOR ALL USING (is_superadmin(auth.uid()));

-- 5. HR Attendance
CREATE TABLE public.hr_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT false,
  is_early_departure BOOLEAN DEFAULT false,
  worked_hours NUMERIC DEFAULT 0,
  ip_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, profile_id, date)
);

ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance" ON public.hr_attendance
  FOR SELECT USING (profile_id = auth.uid() OR tenant_id = current_tenant_id());

CREATE POLICY "Users can clock in/out for themselves" ON public.hr_attendance
  FOR INSERT WITH CHECK (profile_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "Users can update their own attendance" ON public.hr_attendance
  FOR UPDATE USING (profile_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage all attendance" ON public.hr_attendance
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_attendance" ON public.hr_attendance
  FOR ALL USING (is_superadmin(auth.uid()));

-- 6. HR Shifts (templates)
CREATE TABLE public.hr_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view shifts" ON public.hr_shifts
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage shifts" ON public.hr_shifts
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_shifts" ON public.hr_shifts
  FOR ALL USING (is_superadmin(auth.uid()));

-- 7. HR Shift Assignments
CREATE TABLE public.hr_shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.hr_shifts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status hr_shift_assignment_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, profile_id, date)
);

ALTER TABLE public.hr_shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shift assignments" ON public.hr_shift_assignments
  FOR SELECT USING (profile_id = auth.uid() OR tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage shift assignments" ON public.hr_shift_assignments
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_shift_assignments" ON public.hr_shift_assignments
  FOR ALL USING (is_superadmin(auth.uid()));

-- 8. HR Leave Types
CREATE TABLE public.hr_leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  days_per_year INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.hr_leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view leave types" ON public.hr_leave_types
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage leave types" ON public.hr_leave_types
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_leave_types" ON public.hr_leave_types
  FOR ALL USING (is_superadmin(auth.uid()));

-- 9. HR Leave Balances
CREATE TABLE public.hr_leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC DEFAULT 0,
  used_days NUMERIC DEFAULT 0,
  remaining_days NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, profile_id, leave_type_id, year)
);

ALTER TABLE public.hr_leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leave balances" ON public.hr_leave_balances
  FOR SELECT USING (profile_id = auth.uid() OR tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage leave balances" ON public.hr_leave_balances
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_leave_balances" ON public.hr_leave_balances
  FOR ALL USING (is_superadmin(auth.uid()));

-- 10. HR Leave Requests
CREATE TABLE public.hr_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  status hr_leave_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leave requests" ON public.hr_leave_requests
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own leave requests" ON public.hr_leave_requests
  FOR INSERT WITH CHECK (profile_id = auth.uid() AND tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers can manage all leave requests" ON public.hr_leave_requests
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_leave_requests" ON public.hr_leave_requests
  FOR ALL USING (is_superadmin(auth.uid()));

-- 11. HR Payroll Periods
CREATE TABLE public.hr_payroll_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status hr_payroll_status DEFAULT 'draft',
  finalized_by UUID REFERENCES public.profiles(id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, property_id, year, month)
);

ALTER TABLE public.hr_payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view payroll periods" ON public.hr_payroll_periods
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "Owners/managers/accountants can manage payroll periods" ON public.hr_payroll_periods
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'))
  );

CREATE POLICY "Superadmins full access to hr_payroll_periods" ON public.hr_payroll_periods
  FOR ALL USING (is_superadmin(auth.uid()));

-- 12. HR Payroll Entries
CREATE TABLE public.hr_payroll_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.hr_payroll_periods(id) ON DELETE CASCADE,
  basic_salary NUMERIC DEFAULT 0,
  allowances JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  overtime_pay NUMERIC DEFAULT 0,
  gross_pay NUMERIC DEFAULT 0,
  net_pay NUMERIC DEFAULT 0,
  attendance_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, profile_id, period_id)
);

ALTER TABLE public.hr_payroll_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payroll entries" ON public.hr_payroll_entries
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owners/managers/accountants can manage payroll entries" ON public.hr_payroll_entries
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'))
  );

CREATE POLICY "Superadmins full access to hr_payroll_entries" ON public.hr_payroll_entries
  FOR ALL USING (is_superadmin(auth.uid()));

-- 13. HR Overtime Entries
CREATE TABLE public.hr_overtime_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  rate_multiplier NUMERIC DEFAULT 1.5,
  status hr_overtime_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  payroll_entry_id UUID REFERENCES public.hr_payroll_entries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_overtime_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own overtime entries" ON public.hr_overtime_entries
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owners/managers can manage overtime entries" ON public.hr_overtime_entries
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_overtime_entries" ON public.hr_overtime_entries
  FOR ALL USING (is_superadmin(auth.uid()));

-- 14. HR Performance Notes
CREATE TABLE public.hr_performance_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  note_type hr_performance_note_type NOT NULL DEFAULT 'feedback',
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_performance_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance notes" ON public.hr_performance_notes
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owners/managers can manage performance notes" ON public.hr_performance_notes
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_performance_notes" ON public.hr_performance_notes
  FOR ALL USING (is_superadmin(auth.uid()));

-- 15. HR Documents
CREATE TABLE public.hr_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  uploaded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" ON public.hr_documents
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owners/managers can manage all documents" ON public.hr_documents
  FOR ALL USING (
    tenant_id = current_tenant_id() AND 
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Superadmins full access to hr_documents" ON public.hr_documents
  FOR ALL USING (is_superadmin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_hr_departments_updated_at
  BEFORE UPDATE ON public.hr_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_staff_profiles_updated_at
  BEFORE UPDATE ON public.hr_staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create hr-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hr-documents bucket
CREATE POLICY "Owners/managers can upload hr documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hr-documents' AND 
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
      )
    )
  );

CREATE POLICY "Owners/managers can view hr documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' AND 
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
      )
    )
  );

CREATE POLICY "Owners/managers can delete hr documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hr-documents' AND 
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
      )
    )
  );

-- Seed default permissions
INSERT INTO public.hr_permissions (code, name, description, category) VALUES
  ('create_reservation', 'Create Reservation', 'Can create new reservations', 'Reservations'),
  ('edit_reservation', 'Edit Reservation', 'Can modify existing reservations', 'Reservations'),
  ('cancel_reservation', 'Cancel Reservation', 'Can cancel reservations', 'Reservations'),
  ('check_in_guest', 'Check-in Guest', 'Can check-in guests', 'Front Desk'),
  ('check_out_guest', 'Check-out Guest', 'Can check-out guests', 'Front Desk'),
  ('refund_payment', 'Refund Payment', 'Can process payment refunds', 'Payments'),
  ('void_payment', 'Void Payment', 'Can void payments', 'Payments'),
  ('add_charge', 'Add Charge', 'Can add charges to folios', 'Payments'),
  ('void_order', 'Void Order', 'Can void POS orders', 'POS'),
  ('edit_prices', 'Edit Prices', 'Can modify room rates and prices', 'Settings'),
  ('view_reports', 'View Reports', 'Can access reports and analytics', 'Reports'),
  ('export_reports', 'Export Reports', 'Can export reports to PDF/Excel', 'Reports'),
  ('manage_staff', 'Manage Staff', 'Can add, edit, remove staff members', 'HR'),
  ('manage_roles', 'Manage Roles', 'Can assign roles to staff', 'HR'),
  ('approve_leave', 'Approve Leave', 'Can approve leave requests', 'HR'),
  ('manage_payroll', 'Manage Payroll', 'Can access and edit payroll', 'HR'),
  ('run_night_audit', 'Run Night Audit', 'Can execute night audit process', 'Operations'),
  ('manage_housekeeping', 'Manage Housekeeping', 'Can assign housekeeping tasks', 'Operations'),
  ('manage_maintenance', 'Manage Maintenance', 'Can create maintenance tickets', 'Operations'),
  ('access_pos', 'Access POS', 'Can access Point of Sale system', 'POS')
ON CONFLICT (code) DO NOTHING;

-- Seed default leave types (will be created per tenant when needed)
