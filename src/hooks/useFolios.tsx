import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { 
  Folio, 
  FolioItem, 
  Payment, 
  FolioItemType, 
  PaymentMethod, 
  FolioStats 
} from "@/types/folios";

// Re-export types for use in components
export type { Folio, FolioItem, Payment, FolioItemType, PaymentMethod, FolioStats };

export function useFolios(status?: "open" | "closed") {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folios", currentPropertyId, status],
    queryFn: async (): Promise<Folio[]> => {
      if (!currentPropertyId) return [];

      let query = supabase
        .from("folios")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, corporate_account_id),
          reservation:reservations(id, confirmation_number, check_in_date, check_out_date, status),
          folio_items(*),
          payments(*)
        `)
        .eq("property_id", currentPropertyId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((folio: any) => ({
        ...folio,
        guest: folio.guest as Folio["guest"],
        reservation: folio.reservation as Folio["reservation"],
        folio_items: (folio.folio_items || []) as FolioItem[],
        payments: (folio.payments || []) as Payment[],
      }));
    },
    enabled: !!currentPropertyId,
  });
}

export function useFolioById(folioId: string | null) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folio", folioId],
    queryFn: async (): Promise<Folio | null> => {
      if (!folioId || !currentPropertyId) return null;

      const { data, error } = await supabase
        .from("folios")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, corporate_account_id),
          reservation:reservations(id, confirmation_number, check_in_date, check_out_date, status),
          folio_items(*),
          payments(*)
        `)
        .eq("id", folioId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        guest: data.guest as Folio["guest"],
        reservation: data.reservation as Folio["reservation"],
        folio_items: (data.folio_items || []) as FolioItem[],
        payments: (data.payments || []) as Payment[],
      } as Folio;
    },
    enabled: !!folioId && !!currentPropertyId,
  });
}

export function useFolioByReservationId(reservationId: string | null) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folio-by-reservation", reservationId],
    queryFn: async (): Promise<Folio | null> => {
      if (!reservationId || !currentPropertyId) return null;

      const { data, error } = await supabase
        .from("folios")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, corporate_account_id),
          reservation:reservations(id, confirmation_number, check_in_date, check_out_date, status),
          folio_items(*),
          payments(*)
        `)
        .eq("reservation_id", reservationId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        guest: data.guest as Folio["guest"],
        reservation: data.reservation as Folio["reservation"],
        folio_items: (data.folio_items || []) as FolioItem[],
        payments: (data.payments || []) as Payment[],
      } as Folio;
    },
    enabled: !!reservationId && !!currentPropertyId,
  });
}

export function useFolioStats() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["folio-stats", currentPropertyId],
    queryFn: async (): Promise<FolioStats> => {
      if (!currentPropertyId) {
        return { total_open: 0, total_closed: 0, total_balance: 0, today_revenue: 0 };
      }

      const today = new Date().toISOString().split("T")[0];

      // Get all folios
      const { data: folios, error: folioError } = await supabase
        .from("folios")
        .select("status, balance")
        .eq("property_id", currentPropertyId);

      if (folioError) throw folioError;

      // Get today's payments
      const { data: payments, error: paymentError } = await supabase
        .from("payments")
        .select("amount, created_at, folio:folios!inner(property_id)")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (paymentError) throw paymentError;

      const todayPayments = payments?.filter(
        (p: any) => p.folio?.property_id === currentPropertyId
      ) || [];

      const stats: FolioStats = {
        total_open: folios?.filter((f: any) => f.status === "open").length || 0,
        total_closed: folios?.filter((f: any) => f.status === "closed").length || 0,
        total_balance: folios?.filter((f: any) => f.status === "open")
          .reduce((sum: number, f: any) => sum + Number(f.balance || 0), 0) || 0,
        today_revenue: todayPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
      };

      return stats;
    },
    enabled: !!currentPropertyId,
  });
}

export function useAddFolioCharge() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioId,
      itemType,
      description,
      quantity,
      unitPrice,
      serviceDate,
    }: {
      folioId: string;
      itemType: FolioItemType;
      description: string;
      quantity: number;
      unitPrice: number;
      serviceDate?: string;
    }) => {
      const totalPrice = quantity * unitPrice;
      const taxAmount = totalPrice * (currentProperty?.tax_rate || 0) / 100;

      // Insert folio item
      const { error: itemError } = await supabase.from("folio_items").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        item_type: itemType,
        description,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        tax_amount: taxAmount,
        service_date: serviceDate || new Date().toISOString().split("T")[0],
        is_posted: true,
      });

      if (itemError) throw itemError;

      // Update folio totals
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const serviceChargeRate = currentProperty?.service_charge_rate || 0;
      
      // Calculate incremental service charge for this item only
      const serviceChargeForItem = totalPrice * (serviceChargeRate / 100);
      
      const newSubtotal = Number(folio.subtotal) + totalPrice;
      const newTaxAmount = Number(folio.tax_amount) + taxAmount;
      const newServiceCharge = Number(folio.service_charge) + serviceChargeForItem;
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Charge added successfully");
    },
    onError: (error) => {
      console.error("Add charge error:", error);
      toast.error("Failed to add charge");
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      corporateAccountId,
    }: {
      folioId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
      corporateAccountId?: string;
    }) => {
      // Insert payment
      const { error: paymentError } = await supabase.from("payments").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        corporate_account_id: corporateAccountId || null,
      });

      if (paymentError) throw paymentError;

      // Update folio balance
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("paid_amount, total_amount")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = Number(folio.paid_amount) + amount;
      const newBalance = Number(folio.total_amount) - newPaidAmount;

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          paid_amount: newPaidAmount,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;

      // If corporate payment, update corporate account balance
      if (corporateAccountId) {
        const { data: account, error: accountFetchError } = await supabase
          .from("corporate_accounts")
          .select("current_balance")
          .eq("id", corporateAccountId)
          .single();

        if (accountFetchError) throw accountFetchError;

        const newCorporateBalance = Number(account.current_balance) + amount;

        const { error: accountUpdateError } = await supabase
          .from("corporate_accounts")
          .update({ 
            current_balance: newCorporateBalance, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", corporateAccountId);

        if (accountUpdateError) throw accountUpdateError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      if (variables.corporateAccountId) {
        queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["corporate-account", variables.corporateAccountId] });
      }
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      console.error("Record payment error:", error);
      toast.error("Failed to record payment");
    },
  });
}

export function useCloseFolio() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (folioId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("folios")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (error) throw error;
    },
    onSuccess: (_, folioId) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Folio closed successfully");
    },
    onError: (error) => {
      console.error("Close folio error:", error);
      toast.error("Failed to close folio");
    },
  });
}

export function useVoidFolioItem() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      itemId,
      folioId,
      reason,
    }: {
      itemId: string;
      folioId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get the item to void
      const { data: item, error: fetchError } = await supabase
        .from("folio_items")
        .select("total_price, tax_amount")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      // Void the item
      const { error: voidError } = await supabase
        .from("folio_items")
        .update({
          voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user?.id || null,
          void_reason: reason,
        })
        .eq("id", itemId);

      if (voidError) throw voidError;

      // Update folio totals
      const { data: folio, error: folioFetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", folioId)
        .single();

      if (folioFetchError) throw folioFetchError;

      const serviceChargeRate = currentProperty?.service_charge_rate || 0;
      
      // Calculate the service charge that was applied to the voided item
      const serviceChargeForItem = Number(item.total_price) * (serviceChargeRate / 100);
      
      const newSubtotal = Number(folio.subtotal) - Number(item.total_price);
      const newTaxAmount = Number(folio.tax_amount) - Number(item.tax_amount);
      const newServiceCharge = Number(folio.service_charge) - serviceChargeForItem;
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Item voided successfully");
    },
    onError: (error) => {
      console.error("Void item error:", error);
      toast.error("Failed to void item");
    },
  });
}

export function useVoidPayment() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      paymentId,
      folioId,
      reason,
    }: {
      paymentId: string;
      folioId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get the payment to void
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select("amount")
        .eq("id", paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Void the payment
      const { error: voidError } = await supabase
        .from("payments")
        .update({
          voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user?.id || null,
          void_reason: reason,
        })
        .eq("id", paymentId);

      if (voidError) throw voidError;

      // Update folio balance
      const { data: folio, error: folioFetchError } = await supabase
        .from("folios")
        .select("paid_amount, total_amount")
        .eq("id", folioId)
        .single();

      if (folioFetchError) throw folioFetchError;

      const newPaidAmount = Number(folio.paid_amount) - Number(payment.amount);
      const newBalance = Number(folio.total_amount) - newPaidAmount;

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          paid_amount: newPaidAmount,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Payment voided successfully");
    },
    onError: (error) => {
      console.error("Void payment error:", error);
      toast.error("Failed to void payment");
    },
  });
}

export function useReopenFolio() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (folioId: string) => {
      const { error } = await supabase
        .from("folios")
        .update({
          status: "open",
          closed_at: null,
          closed_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (error) throw error;
    },
    onSuccess: (_, folioId) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Folio reopened successfully");
    },
    onError: (error) => {
      console.error("Reopen folio error:", error);
      toast.error("Failed to reopen folio");
    },
  });
}

export function useTransferCharge() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      itemId,
      sourceFolioId,
      targetFolioId,
    }: {
      itemId: string;
      sourceFolioId: string;
      targetFolioId: string;
    }) => {
      // Get the item to transfer
      const { data: item, error: fetchError } = await supabase
        .from("folio_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      // Update item to target folio
      const { error: updateItemError } = await supabase
        .from("folio_items")
        .update({ folio_id: targetFolioId })
        .eq("id", itemId);

      if (updateItemError) throw updateItemError;

      // Update source folio totals (decrease)
      const { data: sourceFolio, error: sourceError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", sourceFolioId)
        .single();

      if (sourceError) throw sourceError;

      const serviceChargeRate = currentProperty?.service_charge_rate || 0;
      const serviceChargeForItem = Number(item.total_price) * (serviceChargeRate / 100);

      const sourceNewSubtotal = Number(sourceFolio.subtotal) - Number(item.total_price);
      const sourceNewTax = Number(sourceFolio.tax_amount) - Number(item.tax_amount);
      const sourceNewServiceCharge = Number(sourceFolio.service_charge) - serviceChargeForItem;
      const sourceNewTotal = sourceNewSubtotal + sourceNewTax + sourceNewServiceCharge;
      const sourceNewBalance = sourceNewTotal - Number(sourceFolio.paid_amount);

      await supabase
        .from("folios")
        .update({
          subtotal: sourceNewSubtotal,
          tax_amount: sourceNewTax,
          service_charge: sourceNewServiceCharge,
          total_amount: sourceNewTotal,
          balance: sourceNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceFolioId);

      // Update target folio totals (increase)
      const { data: targetFolio, error: targetError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", targetFolioId)
        .single();

      if (targetError) throw targetError;

      const targetNewSubtotal = Number(targetFolio.subtotal) + Number(item.total_price);
      const targetNewTax = Number(targetFolio.tax_amount) + Number(item.tax_amount);
      const targetNewServiceCharge = Number(targetFolio.service_charge) + serviceChargeForItem;
      const targetNewTotal = targetNewSubtotal + targetNewTax + targetNewServiceCharge;
      const targetNewBalance = targetNewTotal - Number(targetFolio.paid_amount);

      await supabase
        .from("folios")
        .update({
          subtotal: targetNewSubtotal,
          tax_amount: targetNewTax,
          service_charge: targetNewServiceCharge,
          total_amount: targetNewTotal,
          balance: targetNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetFolioId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.sourceFolioId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.targetFolioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Charge transferred successfully");
    },
    onError: (error) => {
      console.error("Transfer charge error:", error);
      toast.error("Failed to transfer charge");
    },
  });
}

export function useSplitFolio() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      sourceFolioId,
      itemIds,
      guestId,
      propertyId,
      reservationId,
    }: {
      sourceFolioId: string;
      itemIds: string[];
      guestId: string;
      propertyId: string;
      reservationId: string | null;
    }) => {
      if (!tenant?.id || !currentProperty) throw new Error("Missing tenant or property");

      // Generate new folio number
      const { data: folioNumber, error: genError } = await supabase.rpc(
        "generate_folio_number",
        { property_code: currentProperty.code }
      );

      if (genError) throw genError;

      // Get items to transfer
      const { data: items, error: itemsError } = await supabase
        .from("folio_items")
        .select("*")
        .in("id", itemIds);

      if (itemsError) throw itemsError;

      // Calculate new folio totals
      const serviceChargeRate = currentProperty.service_charge_rate || 0;
      const subtotal = items.reduce((sum: number, i: any) => sum + Number(i.total_price), 0);
      const taxAmount = items.reduce((sum: number, i: any) => sum + Number(i.tax_amount), 0);
      const serviceCharge = subtotal * (serviceChargeRate / 100);
      const totalAmount = subtotal + taxAmount + serviceCharge;

      // Create new folio
      const { data: newFolio, error: createError } = await supabase
        .from("folios")
        .insert({
          tenant_id: tenant.id,
          property_id: propertyId,
          guest_id: guestId,
          reservation_id: reservationId,
          folio_number: folioNumber,
          subtotal,
          tax_amount: taxAmount,
          service_charge: serviceCharge,
          total_amount: totalAmount,
          balance: totalAmount,
          paid_amount: 0,
          status: "open",
        })
        .select()
        .single();

      if (createError) throw createError;

      // Move items to new folio
      await supabase
        .from("folio_items")
        .update({ folio_id: newFolio.id })
        .in("id", itemIds);

      // Update source folio totals
      const { data: sourceFolio, error: sourceError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", sourceFolioId)
        .single();

      if (sourceError) throw sourceError;

      const sourceNewSubtotal = Number(sourceFolio.subtotal) - subtotal;
      const sourceNewTax = Number(sourceFolio.tax_amount) - taxAmount;
      const sourceNewServiceCharge = Number(sourceFolio.service_charge) - serviceCharge;
      const sourceNewTotal = sourceNewSubtotal + sourceNewTax + sourceNewServiceCharge;
      const sourceNewBalance = sourceNewTotal - Number(sourceFolio.paid_amount);

      await supabase
        .from("folios")
        .update({
          subtotal: sourceNewSubtotal,
          tax_amount: sourceNewTax,
          service_charge: sourceNewServiceCharge,
          total_amount: sourceNewTotal,
          balance: sourceNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceFolioId);

      return newFolio;
    },
    onSuccess: (newFolio, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.sourceFolioId] });
      queryClient.invalidateQueries({ queryKey: ["folio", newFolio.id] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success(`New folio ${newFolio.folio_number} created`);
    },
    onError: (error) => {
      console.error("Split folio error:", error);
      toast.error("Failed to split folio");
    },
  });
}

export function useAddFolioAdjustment() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioId,
      amount,
      reason,
      isDiscount,
    }: {
      folioId: string;
      amount: number;
      reason: string;
      isDiscount: boolean;
    }) => {
      // Insert adjustment as a folio item
      const { error: itemError } = await supabase.from("folio_items").insert({
        folio_id: folioId,
        tenant_id: tenant?.id!,
        item_type: isDiscount ? "discount" : "miscellaneous",
        description: reason,
        quantity: 1,
        unit_price: amount,
        total_price: amount,
        tax_amount: 0,
        service_date: new Date().toISOString().split("T")[0],
        is_posted: true,
      });

      if (itemError) throw itemError;

      // Update folio totals
      const { data: folio, error: fetchError } = await supabase
        .from("folios")
        .select("subtotal, tax_amount, service_charge, total_amount, paid_amount")
        .eq("id", folioId)
        .single();

      if (fetchError) throw fetchError;

      const newSubtotal = Number(folio.subtotal) + amount;
      const newTotal = newSubtotal + Number(folio.tax_amount) + Number(folio.service_charge);
      const newBalance = newTotal - Number(folio.paid_amount);

      const { error: updateError } = await supabase
        .from("folios")
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", folioId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio", variables.folioId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Adjustment added successfully");
    },
    onError: (error) => {
      console.error("Add adjustment error:", error);
      toast.error("Failed to add adjustment");
    },
  });
}

export function useBulkPayment() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      folioIds,
      totalAmount,
      paymentMethod,
      referenceNumber,
      notes,
    }: {
      folioIds: string[];
      totalAmount: number;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      notes?: string;
    }) => {
      // Get all folios with balances
      const { data: folios, error: fetchError } = await supabase
        .from("folios")
        .select("id, balance, paid_amount, total_amount")
        .in("id", folioIds)
        .gt("balance", 0);

      if (fetchError) throw fetchError;
      if (!folios?.length) throw new Error("No folios with balance found");

      let remainingAmount = totalAmount;

      // Distribute payment across folios
      for (const folio of folios) {
        if (remainingAmount <= 0) break;

        const balance = Number(folio.balance);
        const paymentForFolio = Math.min(remainingAmount, balance);

        // Insert payment
        await supabase.from("payments").insert({
          folio_id: folio.id,
          tenant_id: tenant?.id!,
          amount: paymentForFolio,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          notes: notes ? `${notes} (Bulk payment)` : "Bulk payment",
        });

        // Update folio balance
        const newPaidAmount = Number(folio.paid_amount) + paymentForFolio;
        const newBalance = Number(folio.total_amount) - newPaidAmount;

        await supabase
          .from("folios")
          .update({
            paid_amount: newPaidAmount,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", folio.id);

        remainingAmount -= paymentForFolio;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folios", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats", currentPropertyId] });
      toast.success("Bulk payment recorded successfully");
    },
    onError: (error) => {
      console.error("Bulk payment error:", error);
      toast.error("Failed to record bulk payment");
    },
  });
}
