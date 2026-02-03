import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { startOfMonth, endOfMonth } from "date-fns";

export interface CorporatePayment {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  voided: boolean;
  folio_id: string;
  folio_number: string;
  guest_name: string;
  reservation_id: string | null;
  confirmation_number: string | null;
}

export interface CorporateStatementData {
  account: {
    id: string;
    company_name: string;
    account_code: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    billing_address: string | null;
    current_balance: number;
    credit_limit: number;
    payment_terms: string;
  };
  payments: CorporatePayment[];
  totals: {
    total_billed: number;
    total_voided: number;
    net_amount: number;
  };
}

export function useCorporateStatements(
  accountId: string | null,
  startDate: Date | null,
  endDate: Date | null
) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-statements", accountId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<CorporateStatementData | null> => {
      if (!tenant || !accountId) return null;

      // Fetch account details - use DB column names
      const { data: accountData, error: accountError } = await supabase
        .from("corporate_accounts")
        .select("id, name, code, contact_person, email, phone, address, current_balance, credit_limit, payment_terms")
        .eq("id", accountId)
        .eq("tenant_id", tenant.id)
        .single();

      if (accountError) throw accountError;

      // Map DB fields to expected interface fields
      const account = {
        id: accountData.id,
        company_name: accountData.name,
        account_code: accountData.code,
        contact_name: accountData.contact_person,
        contact_email: accountData.email,
        contact_phone: accountData.phone,
        billing_address: accountData.address,
        current_balance: Number(accountData.current_balance) || 0,
        credit_limit: Number(accountData.credit_limit) || 0,
        payment_terms: String(accountData.payment_terms || 30),
      };

      // Build date filter
      const dateStart = startDate || startOfMonth(new Date());
      const dateEnd = endDate || endOfMonth(new Date());

      // Fetch payments for this corporate account
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_method,
          reference_number,
          notes,
          created_at,
          voided,
          folio_id,
          folio:folios(
            folio_number,
            guest:guests(first_name, last_name),
            reservation_id,
            reservation:reservations(confirmation_number)
          )
        `)
        .eq("corporate_account_id", accountId)
        .eq("tenant_id", tenant.id)
        .gte("created_at", dateStart.toISOString())
        .lte("created_at", dateEnd.toISOString())
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Transform payments data
      const transformedPayments: CorporatePayment[] = (payments || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        reference_number: p.reference_number,
        notes: p.notes,
        created_at: p.created_at,
        voided: p.voided,
        folio_id: p.folio_id,
        folio_number: p.folio?.folio_number || "-",
        guest_name: p.folio?.guest 
          ? `${p.folio.guest.first_name} ${p.folio.guest.last_name}` 
          : "Unknown",
        reservation_id: p.folio?.reservation_id || null,
        confirmation_number: p.folio?.reservation?.confirmation_number || null,
      }));

      // Calculate totals
      const total_billed = transformedPayments
        .filter(p => !p.voided)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const total_voided = transformedPayments
        .filter(p => p.voided)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        account,
        payments: transformedPayments,
        totals: {
          total_billed,
          total_voided,
          net_amount: total_billed,
        },
      };
    },
    enabled: !!tenant && !!accountId,
  });
}

export function useCorporateAccountsForSelect() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-accounts-select", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      // Use DB column names
      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("id, name, code, current_balance")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      
      // Map to expected interface
      return (data || []).map(d => ({
        id: d.id,
        company_name: d.name,
        account_code: d.code,
        current_balance: Number(d.current_balance) || 0,
      }));
    },
    enabled: !!tenant,
  });
}
