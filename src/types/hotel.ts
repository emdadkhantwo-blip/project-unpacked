// Comprehensive local type definitions for the hotel management system
// These types are used when database tables are not yet created

// ==================== ENUMS ====================

export type ReservationStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type RoomStatus = "available" | "occupied" | "maintenance" | "cleaning" | "out_of_order";
export type HousekeepingStatus = "clean" | "dirty" | "inspected" | "out_of_service";
export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed";
export type FolioStatus = "open" | "closed";
export type FolioItemType = 
  | "room_charge"
  | "food_beverage"
  | "laundry"
  | "minibar"
  | "spa"
  | "parking"
  | "telephone"
  | "internet"
  | "miscellaneous"
  | "adjustment"
  | "discount"
  | "tax"
  | "service_charge";
export type PaymentMethod = 
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "mobile_payment"
  | "corporate_billing"
  | "other";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type POSOrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

// ==================== BASE ENTITIES ====================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  star_rating: number | null;
  check_in_time: string;
  check_out_time: string;
  tax_rate: number;
  service_charge_rate: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  tenant_id: string | null;
  property_id: string | null;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  role: string;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ROOM MANAGEMENT ====================

export interface RoomType {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  code: string;
  description: string | null;
  base_rate: number;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  tenant_id: string;
  property_id: string;
  room_type_id: string;
  room_number: string;
  floor: string | null;
  status: RoomStatus;
  housekeeping_status: HousekeepingStatus;
  is_smoking: boolean;
  is_accessible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  room_type?: RoomType;
}

// ==================== GUEST MANAGEMENT ====================

export interface Guest {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  id_type: string | null;
  id_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  is_vip: boolean;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  corporate_account_id: string | null;
  preferences: Record<string, any> | null;
  total_stays: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  has_corporate_accounts?: boolean;
}

export interface GuestNote {
  id: string;
  guest_id: string;
  tenant_id: string;
  note: string;
  note_type: string;
  created_by: string | null;
  created_at: string;
}

// ==================== RESERVATIONS ====================

export interface ReservationRoom {
  id: string;
  reservation_id: string;
  room_id: string | null;
  room_type_id: string;
  rate_per_night: number;
  adults: number;
  children: number;
  room?: Room;
  room_type?: RoomType;
}

export interface ReservationGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  corporate_account_id: string | null;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  property_id: string;
  guest_id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: ReservationStatus;
  adults: number;
  children: number;
  total_amount: number;
  notes: string | null;
  special_requests: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  guest: ReservationGuest | null;
  reservation_rooms: ReservationRoom[];
}

// ==================== FOLIOS & BILLING ====================

export interface FolioItem {
  id: string;
  folio_id: string;
  tenant_id: string;
  item_type: FolioItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_amount: number;
  service_date: string;
  is_posted: boolean;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  folio_id: string;
  tenant_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  corporate_account_id: string | null;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolioGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  corporate_account_id: string | null;
}

export interface FolioReservation {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
}

export interface Folio {
  id: string;
  folio_number: string;
  tenant_id: string;
  property_id: string;
  guest_id: string | null;
  reservation_id: string | null;
  status: FolioStatus;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  guest: FolioGuest | null;
  reservation: FolioReservation | null;
  folio_items: FolioItem[];
  payments: Payment[];
}

export interface FolioStats {
  total_open: number;
  total_closed: number;
  total_balance: number;
  today_revenue: number;
}

// ==================== CORPORATE ACCOUNTS ====================

export interface CorporateAccount {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  discount_percentage: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== HOUSEKEEPING ====================

export interface HousekeepingTask {
  id: string;
  tenant_id: string;
  property_id: string;
  room_id: string;
  assigned_to: string | null;
  task_type: string;
  priority: string;
  status: TaskStatus;
  notes: string | null;
  scheduled_date: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  assigned_profile?: Profile;
}

// ==================== MAINTENANCE ====================

export interface MaintenanceTicket {
  id: string;
  tenant_id: string;
  property_id: string;
  room_id: string | null;
  title: string;
  description: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  category: string | null;
  assigned_to: string | null;
  reported_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  room?: { room_number: string; floor: string | null } | null;
  assigned_profile?: { full_name: string | null; username: string } | null;
}

// ==================== POS ====================

export interface POSOutlet {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  code: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSCategory {
  id: string;
  outlet_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface POSMenuItem {
  id: string;
  category_id: string;
  outlet_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface POSOrder {
  id: string;
  tenant_id: string;
  outlet_id: string;
  table_number: string | null;
  room_id: string | null;
  guest_id: string | null;
  folio_id: string | null;
  status: POSOrderStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface POSOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  status: string;
  created_at: string;
}

// ==================== HR ====================

export interface Staff {
  id: string;
  tenant_id: string;
  property_id: string;
  user_id: string | null;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string;
  hire_date: string;
  salary: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

// ==================== REFERENCES ====================

export interface Reference {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  commission_rate: number;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== NIGHT AUDIT ====================

export interface NightAuditLog {
  id: string;
  tenant_id: string;
  property_id: string;
  audit_date: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  completed_by: string | null;
  total_revenue: number;
  room_revenue: number;
  fnb_revenue: number;
  other_revenue: number;
  occupancy_rate: number;
  rooms_sold: number;
  average_daily_rate: number;
  notes: string | null;
  created_at: string;
}

// ==================== RATE MANAGEMENT ====================

export interface RatePeriod {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  start_date: string;
  end_date: string;
  rate_multiplier: number;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  description: string | null;
  price: number;
  includes_breakfast: boolean;
  includes_parking: boolean;
  includes_wifi: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== TAX CONFIGURATION ====================

export interface TaxConfiguration {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  rate: number;
  applies_to: string;
  is_active: boolean;
  created_at: string;
}

// ==================== ADMIN ====================

export interface Application {
  id: string;
  hotel_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  property_count: number;
  room_count: number;
  current_software: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
