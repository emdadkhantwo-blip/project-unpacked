import { useState } from "react";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

// Types
export type POSOrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled" | "posted";

export interface POSOutlet {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  code: string;
  type: string;
  is_active: boolean;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

export interface POSCategory {
  id: string;
  tenant_id: string;
  outlet_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface POSItem {
  id: string;
  tenant_id: string;
  outlet_id: string;
  category_id: string | null;
  name: string;
  code: string;
  description: string | null;
  price: number;
  cost: number;
  is_available: boolean;
  is_active: boolean;
  image_url: string | null;
  prep_time_minutes: number;
  created_at: string;
  updated_at: string;
  category?: POSCategory;
}

export interface POSOrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  status: string;
  prepared_at: string | null;
  served_at: string | null;
  created_at: string;
}

export interface POSOrder {
  id: string;
  tenant_id: string;
  outlet_id: string;
  order_number: string;
  guest_id: string | null;
  folio_id: string | null;
  room_id: string | null;
  table_number: string | null;
  covers: number;
  status: POSOrderStatus;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  posted_at: string | null;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
  outlet?: POSOutlet;
  items?: POSOrderItem[];
  guest?: { first_name: string; last_name: string };
  room?: { room_number: string };
}

// ============= OUTLETS =============
// Note: POS tables don't exist yet - returning mock data

export function usePOSOutlets() {
  return {
    data: [] as POSOutlet[],
    isLoading: false,
    error: null,
  };
}

export function useCreatePOSOutlet() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useUpdatePOSOutlet() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

// ============= CATEGORIES =============

export function usePOSCategories(_outletId?: string) {
  return {
    data: [] as POSCategory[],
    isLoading: false,
    error: null,
  };
}

export function useCreatePOSCategory() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useDeletePOSCategory() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function useUpdatePOSCategoryOrder() {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  };
}

export function useDeletePOSItem() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

// ============= ITEMS =============

export function usePOSItems(_outletId?: string) {
  return {
    data: [] as POSItem[],
    isLoading: false,
    error: null,
  };
}

export function useCreatePOSItem() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useUpdatePOSItem() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

// ============= ORDERS =============

export function usePOSOrders(_outletId?: string, _status?: POSOrderStatus | POSOrderStatus[]) {
  return {
    data: [] as POSOrder[],
    isLoading: false,
    error: null,
  };
}

export function useKitchenOrders(_outletId?: string) {
  return {
    data: [] as POSOrder[],
    isLoading: false,
    error: null,
  };
}

export function useCreatePOSOrder() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useUpdatePOSOrderStatus() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function useUpdatePOSOrderItemStatus() {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  };
}

export function usePostOrderToFolio() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function useWaiterOrders(_outletId?: string) {
  return {
    data: [] as POSOrder[],
    isLoading: false,
    error: null,
  };
}

export function usePOSSplitBill() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function usePOSTransferItems() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

// Additional missing exports

export function useActiveFolios() {
  return {
    data: [] as { id: string; folio_number: string; guest_name: string }[],
    isLoading: false,
    error: null,
  };
}

export function useCancelPOSOrder() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function useCloseTable() {
  return {
    mutate: () => {
      toast.info("POS module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("POS module not yet configured");
    },
    isPending: false,
  };
}

export function useWaiterStats(_outletId?: string) {
  return {
    data: {
      pending: 0,
      preparing: 0,
      ready: 0,
      servedToday: 0,
    },
    isLoading: false,
    error: null,
  };
}
