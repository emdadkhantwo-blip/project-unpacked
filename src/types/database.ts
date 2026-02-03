// Custom database types for the Hotel PMS
// These supplement the auto-generated Supabase types

export type AppRole = 
  | 'superadmin'
  | 'owner'
  | 'manager'
  | 'front_desk'
  | 'accountant'
  | 'housekeeping'
  | 'maintenance'
  | 'kitchen'
  | 'waiter'
  | 'night_auditor';

export type SubscriptionPlan = 'starter' | 'growth' | 'pro';

export type TenantStatus = 'active' | 'suspended' | 'pending';

export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export type RoomStatus = 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order';

export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';

export type FolioItemType = 
  | 'room_charge'
  | 'food_beverage'
  | 'laundry'
  | 'minibar'
  | 'spa'
  | 'parking'
  | 'telephone'
  | 'internet'
  | 'miscellaneous'
  | 'tax'
  | 'service_charge'
  | 'discount'
  | 'deposit';

export type BookingSource = 
  | 'direct'
  | 'phone'
  | 'walk_in'
  | 'website'
  | 'ota_booking'
  | 'ota_expedia'
  | 'ota_agoda'
  | 'corporate'
  | 'travel_agent'
  | 'other';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  superadmin: ['*'],
  owner: [
    'manage_staff',
    'manage_properties',
    'manage_rooms',
    'manage_reservations',
    'manage_guests',
    'manage_folios',
    'process_payments',
    'issue_refunds',
    'approve_refunds',
    'view_reports',
    'manage_settings',
    'manage_pos',
    'manage_kitchen',
  ],
  manager: [
    'manage_rooms',
    'manage_reservations',
    'manage_guests',
    'manage_folios',
    'process_payments',
    'request_refunds',
    'view_reports',
    'manage_housekeeping',
    'manage_maintenance',
    'manage_pos',
    'manage_kitchen',
  ],
  front_desk: [
    'view_rooms',
    'manage_reservations',
    'manage_guests',
    'manage_folios',
    'process_payments',
    'view_limited_reports',
    'update_room_status',
    'create_housekeeping_tasks',
    'create_maintenance_tickets',
  ],
  accountant: [
    'view_folios',
    'manage_folios',
    'process_payments',
    'view_reports',
    'view_reservations',
  ],
  housekeeping: [
    'view_rooms',
    'update_room_status',
    'view_housekeeping_tasks',
    'update_housekeeping_tasks',
  ],
  maintenance: [
    'view_rooms',
    'update_room_status',
    'view_maintenance_tickets',
    'update_maintenance_tickets',
  ],
  kitchen: [
    'view_orders',
    'update_order_status',
    'manage_menu',
  ],
  waiter: [
    'create_orders',
    'view_orders',
    'update_order_status',
    'process_pos_payments',
  ],
  night_auditor: [
    'view_folios',
    'post_room_charges',
    'run_night_audit',
    'view_reports',
  ],
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  front_desk: 'Front Desk',
  accountant: 'Accountant',
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  kitchen: 'Kitchen Staff',
  waiter: 'Waiter/Server',
  night_auditor: 'Night Auditor',
};

// Room status display config
export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; color: string }> = {
  vacant: { label: 'Vacant', color: 'bg-room-vacant text-white' },
  occupied: { label: 'Occupied', color: 'bg-room-occupied text-white' },
  dirty: { label: 'Dirty', color: 'bg-room-dirty text-white' },
  maintenance: { label: 'Maintenance', color: 'bg-room-maintenance text-white' },
  out_of_order: { label: 'Out of Order', color: 'bg-room-out-of-order text-white' },
};

// Reservation status display config
export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  confirmed: { label: 'Confirmed', variant: 'default' },
  checked_in: { label: 'Checked In', variant: 'success' },
  checked_out: { label: 'Checked Out', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'warning' },
};

// Plan features
export const PLAN_FEATURES: Record<SubscriptionPlan, { name: string; maxProperties: number; maxStaff: number; maxRooms: number; features: string[] }> = {
  starter: {
    name: 'Starter',
    maxProperties: 1,
    maxStaff: 10,
    maxRooms: 50,
    features: ['Basic PMS', 'Reservations', 'Billing', 'Housekeeping'],
  },
  growth: {
    name: 'Growth',
    maxProperties: 3,
    maxStaff: 30,
    maxRooms: 150,
    features: ['Everything in Starter', 'CRM', 'Guest Profiles', 'Advanced Reports'],
  },
  pro: {
    name: 'Pro',
    maxProperties: 999,
    maxStaff: 999,
    maxRooms: 9999,
    features: ['Everything in Growth', 'POS/Kitchen', 'Multi-Property', 'Priority Support'],
  },
};