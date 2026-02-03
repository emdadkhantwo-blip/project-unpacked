import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface OutstandingFolio {
  id: string;
  folio_number: string;
  balance: number;
  guest_name: string;
  guest_id: string;
  reservation_id: string | null;
  confirmation_number: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
}

export function useOutstandingFoliosForCorporate(accountId: string | null) {
  const { tenant, currentProperty } = useTenant();

  return useQuery({
    queryKey: ["outstanding-corporate-folios", accountId, currentProperty?.id],
    queryFn: async (): Promise<OutstandingFolio[]> => {
      if (!tenant || !accountId || !currentProperty) return [];

      // Get all guests linked to this corporate account
      const { data: guests, error: guestsError } = await supabase
        .from("guests")
        .select("id, first_name, last_name")
        .eq("corporate_account_id", accountId)
        .eq("tenant_id", tenant.id);

      if (guestsError) throw guestsError;
      if (!guests || guests.length === 0) return [];

      const guestIds = guests.map((g) => g.id);
      const guestMap = new Map(guests.map((g) => [g.id, `${g.first_name} ${g.last_name}`]));

      // Get open folios with outstanding balance for these guests
      const { data: folios, error: foliosError } = await supabase
        .from("folios")
        .select(`
          id,
          folio_number,
          balance,
          guest_id,
          reservation_id,
          reservation:reservations(
            confirmation_number,
            check_in_date,
            check_out_date
          )
        `)
        .eq("property_id", currentProperty.id)
        .eq("status", "open")
        .gt("balance", 0)
        .in("guest_id", guestIds)
        .order("created_at", { ascending: false });

      if (foliosError) throw foliosError;

      return (folios || []).map((f: any) => ({
        id: f.id,
        folio_number: f.folio_number,
        balance: Number(f.balance),
        guest_name: guestMap.get(f.guest_id) || "Unknown",
        guest_id: f.guest_id,
        reservation_id: f.reservation_id,
        confirmation_number: f.reservation?.confirmation_number || null,
        check_in_date: f.reservation?.check_in_date || null,
        check_out_date: f.reservation?.check_out_date || null,
      }));
    },
    enabled: !!tenant && !!accountId && !!currentProperty,
  });
}

export function useBulkCorporatePayment() {
  const queryClient = useQueryClient();
  const { tenant, currentProperty } = useTenant();

  return useMutation({
    mutationFn: async ({
      corporateAccountId,
      folioPayments,
      paymentMethod,
      referenceNumber,
      notes,
    }: {
      corporateAccountId: string;
      folioPayments: { folioId: string; amount: number }[];
      paymentMethod: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "other";
      referenceNumber?: string;
      notes?: string;
    }) => {
      if (!tenant) throw new Error("No tenant");

      const totalPayment = folioPayments.reduce((sum, p) => sum + p.amount, 0);

      // Process each folio payment
      for (const { folioId, amount } of folioPayments) {
        // Insert payment record
        const { error: paymentError } = await supabase.from("payments").insert({
          folio_id: folioId,
          tenant_id: tenant.id,
          amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          notes: notes ? `Bulk corporate payment: ${notes}` : "Bulk corporate payment",
          corporate_account_id: corporateAccountId,
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
      }

      // Update corporate account balance (reduce since payment was received)
      const { data: account, error: accountFetchError } = await supabase
        .from("corporate_accounts")
        .select("current_balance")
        .eq("id", corporateAccountId)
        .single();

      if (accountFetchError) throw accountFetchError;

      const newCorporateBalance = Number(account.current_balance) - totalPayment;

      const { error: accountUpdateError } = await supabase
        .from("corporate_accounts")
        .update({
          current_balance: newCorporateBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", corporateAccountId);

      if (accountUpdateError) throw accountUpdateError;

      return { totalPayment, folioCount: folioPayments.length, newBalance: newCorporateBalance };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["folios"] });
      queryClient.invalidateQueries({ queryKey: ["folio-stats"] });
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["corporate-statements"] });
      queryClient.invalidateQueries({ queryKey: ["outstanding-corporate-folios"] });
      toast.success(
        `Payment of ৳${result.totalPayment.toLocaleString()} applied to ${result.folioCount} folio(s)`
      );
    },
    onError: (error) => {
      console.error("Bulk payment error:", error);
      toast.error("Failed to process bulk payment");
    },
  });
}
