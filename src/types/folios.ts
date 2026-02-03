// Local type definitions for folios functionality
// These types are used when database tables are not yet created

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

export type FolioStatus = "open" | "closed";

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
