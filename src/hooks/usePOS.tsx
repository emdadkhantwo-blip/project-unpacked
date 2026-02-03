import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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

export function usePOSOutlets() {
  const { currentProperty } = useTenant();

  return useQuery({
    queryKey: ["pos-outlets", currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from("pos_outlets")
        .select("*")
        .eq("property_id", currentProperty.id)
        .order("name");

      if (error) throw error;
      return data as POSOutlet[];
    },
    enabled: !!currentProperty?.id,
  });
}

export function useCreatePOSOutlet() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();

  return useMutation({
    mutationFn: async (outlet: { name: string; code: string; type: string }) => {
      const { data, error } = await supabase
        .from("pos_outlets")
        .insert({
          tenant_id: tenant?.id!,
          property_id: currentProperty?.id!,
          ...outlet,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-outlets"] });
      toast.success("Outlet created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create outlet: ${error.message}`);
    },
  });
}

export function useUpdatePOSOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; is_active?: boolean; type?: string; settings?: Json } }) => {
      const { data, error } = await supabase
        .from("pos_outlets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pos-outlets"] });
      // Only show toast if it's not a silent settings update
      if (!variables.updates.settings) {
        toast.success("Outlet updated successfully");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update outlet: ${error.message}`);
    },
  });
}

// ============= CATEGORIES =============

export function usePOSCategories(outletId?: string) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["pos-categories", outletId],
    queryFn: async () => {
      if (!outletId) return [];
      
      const { data, error } = await supabase
        .from("pos_categories")
        .select("*")
        .eq("outlet_id", outletId)
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as POSCategory[];
    },
    enabled: !!outletId && !!tenant?.id,
  });
}

export function useCreatePOSCategory() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (category: { outlet_id: string; name: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("pos_categories")
        .insert({
          tenant_id: tenant?.id!,
          ...category,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
}

export function useDeletePOSCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("pos_categories")
        .update({ is_active: false })
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
}

export function useUpdatePOSCategoryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      // Update each category's sort_order
      const updates = categories.map(cat => 
        supabase
          .from("pos_categories")
          .update({ sort_order: cat.sort_order })
          .eq("id", cat.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-categories"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder categories: ${error.message}`);
    },
  });
}

export function useDeletePOSItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("pos_items")
        .update({ is_active: false })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-items"] });
      toast.success("Item deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

// ============= ITEMS =============

export function usePOSItems(outletId?: string) {
  return useQuery({
    queryKey: ["pos-items", outletId],
    queryFn: async () => {
      if (!outletId) return [];
      
      const { data, error } = await supabase
        .from("pos_items")
        .select("*, category:pos_categories(*)")
        .eq("outlet_id", outletId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as POSItem[];
    },
    enabled: !!outletId,
  });
}

export function useCreatePOSItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (item: {
      outlet_id: string;
      category_id?: string;
      name: string;
      code: string;
      description?: string;
      price: number;
      cost?: number;
      prep_time_minutes?: number;
    }) => {
      const { data, error } = await supabase
        .from("pos_items")
        .insert({
          tenant_id: tenant?.id!,
          ...item,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-items"] });
      toast.success("Menu item created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create menu item: ${error.message}`);
    },
  });
}

export function useUpdatePOSItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<POSItem> }) => {
      const { data, error } = await supabase
        .from("pos_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-items"] });
      toast.success("Menu item updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update menu item: ${error.message}`);
    },
  });
}

// ============= ORDERS =============

export function usePOSOrders(outletId?: string, status?: POSOrderStatus | POSOrderStatus[]) {
  return useQuery({
    queryKey: ["pos-orders", outletId, status],
    queryFn: async () => {
      if (!outletId) return [];
      
      let query = supabase
        .from("pos_orders")
        .select(`
          *,
          outlet:pos_outlets(*),
          guest:guests(first_name, last_name),
          room:rooms(room_number),
          items:pos_order_items(*)
        `)
        .eq("outlet_id", outletId)
        .order("created_at", { ascending: false });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in("status", status);
        } else {
          query = query.eq("status", status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as POSOrder[];
    },
    enabled: !!outletId,
    refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
  });
}

export function useKitchenOrders(outletId?: string) {
  return useQuery({
    queryKey: ["kitchen-orders", outletId],
    queryFn: async () => {
      if (!outletId) return [];
      
      const { data, error } = await supabase
        .from("pos_orders")
        .select(`
          *,
          outlet:pos_outlets(*),
          items:pos_order_items(*)
        `)
        .eq("outlet_id", outletId)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as POSOrder[];
    },
    enabled: !!outletId,
    refetchInterval: 5000, // More frequent updates for kitchen
  });
}

export function useCreatePOSOrder() {
  const queryClient = useQueryClient();
  const { tenant, currentProperty } = useTenant();

  return useMutation({
    mutationFn: async (order: {
      outlet_id: string;
      outlet_code: string;
      guest_id?: string;
      folio_id?: string;
      room_id?: string;
      table_number?: string;
      covers?: number;
      notes?: string;
      items: Array<{
        item_id: string;
        item_name: string;
        quantity: number;
        unit_price: number;
        notes?: string;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate order number
      const orderNumber = `${order.outlet_code}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Calculate totals
      const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const taxRate = currentProperty?.tax_rate || 0;
      const serviceChargeRate = currentProperty?.service_charge_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const serviceCharge = subtotal * (serviceChargeRate / 100);
      const totalAmount = subtotal + taxAmount + serviceCharge;

      // Create order
      const { data: posOrder, error: orderError } = await supabase
        .from("pos_orders")
        .insert({
          tenant_id: tenant?.id!,
          outlet_id: order.outlet_id,
          order_number: orderNumber,
          guest_id: order.guest_id || null,
          folio_id: order.folio_id || null,
          room_id: order.room_id || null,
          table_number: order.table_number || null,
          covers: order.covers || 1,
          notes: order.notes || null,
          subtotal,
          tax_amount: taxAmount,
          service_charge: serviceCharge,
          total_amount: totalAmount,
          created_by: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = order.items.map((item) => ({
        tenant_id: tenant?.id!,
        order_id: posOrder.id,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        notes: item.notes || null,
        status: "pending",
      }));

      const { error: itemsError } = await supabase
        .from("pos_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return posOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Order created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdatePOSOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: POSOrderStatus }) => {
      const { data, error } = await supabase
        .from("pos_orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Also update all order items status
      if (status === "preparing" || status === "ready" || status === "served") {
        await supabase
          .from("pos_order_items")
          .update({ 
            status,
            ...(status === "ready" ? { prepared_at: new Date().toISOString() } : {}),
            ...(status === "served" ? { served_at: new Date().toISOString() } : {}),
          })
          .eq("order_id", orderId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
}

export function usePostOrderToFolio() {
  const queryClient = useQueryClient();
  const { tenant, currentProperty } = useTenant();

  return useMutation({
    mutationFn: async ({ orderId, folioId }: { orderId: string; folioId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get the order
      const { data: order, error: orderError } = await supabase
        .from("pos_orders")
        .select("*, outlet:pos_outlets(name)")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Create folio item
      const description = `${order.outlet?.name || 'POS'} - Order #${order.order_number}`;
      
      const { error: folioItemError } = await supabase.from("folio_items").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        item_type: "food_beverage",
        description,
        quantity: 1,
        unit_price: order.subtotal,
        total_price: order.subtotal,
        tax_amount: order.tax_amount,
        service_date: new Date().toISOString().split("T")[0],
        reference_id: orderId,
        reference_type: "pos_order",
        is_posted: true,
        posted_by: user?.id,
      });

      if (folioItemError) throw folioItemError;

      // Update folio totals
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, total_amount, paid_amount, service_charge")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const newSubtotal = Number(folio.subtotal) + order.subtotal;
      const newTaxAmount = Number(folio.tax_amount) + order.tax_amount;
      const serviceChargeRate = currentProperty?.service_charge_rate || 0;
      const newServiceCharge = newSubtotal * (serviceChargeRate / 100);
      const newTotal = newSubtotal + newTaxAmount + newServiceCharge;
      const newBalance = newTotal - Number(folio.paid_amount);

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          subtotal: newSubtotal,
          tax_amount: newTaxAmount,
          service_charge: newServiceCharge,
          total_amount: newTotal,
          balance: newBalance,
        })
        .eq("id", folioId);

      if (updateError) throw updateError;

      // Update order status to posted
      const { error: orderUpdateError } = await supabase
        .from("pos_orders")
        .update({
          status: "posted",
          folio_id: folioId,
          posted_at: new Date().toISOString(),
          posted_by: user?.id,
        })
        .eq("id", orderId);

      if (orderUpdateError) throw orderUpdateError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      queryClient.invalidateQueries({ queryKey: ["folios"] });
      toast.success("Order posted to folio successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to post order: ${error.message}`);
    },
  });
}

export function useCancelPOSOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from("pos_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Order cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
}

// ============= WAITER-SPECIFIC HOOKS =============

export function useWaiterOrders(outletId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["waiter-orders", outletId, user?.id],
    queryFn: async () => {
      if (!outletId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("pos_orders")
        .select(`
          *,
          outlet:pos_outlets(*),
          guest:guests(first_name, last_name),
          room:rooms(room_number),
          items:pos_order_items(*)
        `)
        .eq("outlet_id", outletId)
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as POSOrder[];
    },
    enabled: !!outletId && !!user?.id,
    refetchInterval: 5000, // Frequent updates to see ready orders
  });
}

export function useWaiterStats(outletId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["waiter-stats", outletId, user?.id],
    queryFn: async () => {
      if (!outletId || !user?.id) return null;
      
      // Get active orders
      const { data: orders, error } = await supabase
        .from("pos_orders")
        .select("status, created_at")
        .eq("outlet_id", outletId)
        .in("status", ["pending", "preparing", "ready"]);

      if (error) throw error;

      // Get today's served orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: servedOrders, error: servedError } = await supabase
        .from("pos_orders")
        .select("id")
        .eq("outlet_id", outletId)
        .eq("status", "served")
        .gte("updated_at", today.toISOString());

      if (servedError) throw servedError;

      return {
        pending: orders?.filter(o => o.status === "pending").length || 0,
        preparing: orders?.filter(o => o.status === "preparing").length || 0,
        ready: orders?.filter(o => o.status === "ready").length || 0,
        servedToday: servedOrders?.length || 0,
      };
    },
    enabled: !!outletId && !!user?.id,
    refetchInterval: 5000,
  });
}

// Get active folios for posting
export function useActiveFolios() {
  const { currentProperty } = useTenant();

  return useQuery({
    queryKey: ["active-folios", currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from("folios")
        .select(`
          *,
          guest:guests(first_name, last_name),
          reservation:reservations(confirmation_number)
        `)
        .eq("property_id", currentProperty.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentProperty?.id,
  });
}

// ============= CLOSE TABLE =============

export function useCloseTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      tableNumber,
      outletId,
    }: {
      tableNumber: string;
      outletId: string;
    }) => {
      // Update all active orders for this table to "posted"
      const { error } = await supabase
        .from("pos_orders")
        .update({
          status: "posted" as POSOrderStatus,
          posted_at: new Date().toISOString(),
          posted_by: user?.id,
        })
        .eq("table_number", tableNumber)
        .eq("outlet_id", outletId)
        .not("status", "in", '("posted","cancelled")');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Table closed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to close table: ${error.message}`);
    },
  });
}
