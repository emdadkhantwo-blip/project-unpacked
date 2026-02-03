import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";

export interface CorporateAccount {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  discount_percentage: number;
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  linked_guests_count?: number;
  // Aliases for backward compatibility with components
  company_name: string;
  account_code: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: string | null;
}

// Transform DB row to CorporateAccount with aliases
function transformCorporateAccount(row: any): CorporateAccount {
  return {
    ...row,
    discount_percentage: Number(row.discount_percentage) || 0,
    credit_limit: Number(row.credit_limit) || 0,
    current_balance: Number(row.current_balance) || 0,
    payment_terms: Number(row.payment_terms) || 30,
    is_active: row.is_active ?? true,
    // Aliases
    company_name: row.name,
    account_code: row.code,
    contact_name: row.contact_person,
    contact_email: row.email,
    contact_phone: row.phone,
    billing_address: row.address,
  };
}

export interface CorporateAccountFormData {
  // Accept both DB names and component names
  name?: string;
  code?: string;
  company_name?: string;
  account_code?: string;
  contact_person?: string;
  contact_name?: string;
  email?: string;
  contact_email?: string;
  phone?: string;
  contact_phone?: string;
  address?: string;
  billing_address?: string;
  discount_percentage?: number;
  credit_limit?: number;
  payment_terms?: string | number;
  notes?: string;
  is_active?: boolean;
}

export function useCorporateAccounts() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-accounts", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("name", { ascending: true });

      if (error) throw error;

      // Get linked guest counts from the join table
      const { data: guestCounts } = await supabase
        .from("guest_corporate_accounts")
        .select("corporate_account_id");

      const countMap = new Map<string, number>();
      guestCounts?.forEach((g) => {
        if (g.corporate_account_id) {
          const count = countMap.get(g.corporate_account_id) || 0;
          countMap.set(g.corporate_account_id, count + 1);
        }
      });

      return (data || []).map((account) => transformCorporateAccount({
        ...account,
        linked_guests_count: countMap.get(account.id) || 0,
      }));
    },
    enabled: !!tenant,
  });
}

export function useCorporateAccount(accountId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-account", accountId],
    queryFn: async () => {
      if (!accountId || !tenant) return null;

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .eq("id", accountId)
        .eq("tenant_id", tenant.id)
        .single();

      if (error) throw error;
      return transformCorporateAccount(data);
    },
    enabled: !!accountId && !!tenant,
  });
}

export function useCorporateAccountGuests(accountId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-account-guests", accountId],
    queryFn: async () => {
      if (!accountId || !tenant) return [];

      // Fetch guest IDs from the join table
      const { data: links, error: linksError } = await supabase
        .from("guest_corporate_accounts")
        .select("guest_id")
        .eq("corporate_account_id", accountId);

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const guestIds = links.map((l) => l.guest_id);

      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .in("id", guestIds)
        .eq("tenant_id", tenant.id)
        .order("last_name", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!accountId && !!tenant,
  });
}

// Fetch all corporate accounts linked to a specific guest
export function useGuestCorporateAccounts(guestId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["guest-corporate-accounts", guestId],
    queryFn: async () => {
      if (!guestId || !tenant) return [];

      // Fetch corporate account IDs from the join table
      const { data: links, error: linksError } = await supabase
        .from("guest_corporate_accounts")
        .select("corporate_account_id")
        .eq("guest_id", guestId);

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const accountIds = links.map((l) => l.corporate_account_id);

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .in("id", accountIds)
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []).map((account) => transformCorporateAccount(account));
    },
    enabled: !!guestId && !!tenant,
  });
}

export function useCreateCorporateAccount() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CorporateAccountFormData) => {
      if (!tenant) throw new Error("No tenant");

      // Map component names to DB names
      const insertData = {
        tenant_id: tenant.id,
        name: data.name || data.company_name || "",
        code: data.code || data.account_code || "",
        contact_person: data.contact_person || data.contact_name,
        email: data.email || data.contact_email,
        phone: data.phone || data.contact_phone,
        address: data.address || data.billing_address,
        discount_percentage: data.discount_percentage,
        credit_limit: data.credit_limit,
        payment_terms: typeof data.payment_terms === 'string' ? parseInt(data.payment_terms) || 30 : data.payment_terms,
        notes: data.notes,
        is_active: data.is_active,
      };

      const { data: account, error } = await supabase
        .from("corporate_accounts")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return transformCorporateAccount(account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      toast({
        title: "Account Created",
        description: "Corporate account has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useUpdateCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      accountId,
      data,
    }: {
      accountId: string;
      data: Partial<CorporateAccountFormData>;
    }) => {
      // Map component names to DB names
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined || data.company_name !== undefined) {
        updateData.name = data.name || data.company_name;
      }
      if (data.code !== undefined || data.account_code !== undefined) {
        updateData.code = data.code || data.account_code;
      }
      if (data.contact_person !== undefined || data.contact_name !== undefined) {
        updateData.contact_person = data.contact_person || data.contact_name;
      }
      if (data.email !== undefined || data.contact_email !== undefined) {
        updateData.email = data.email || data.contact_email;
      }
      if (data.phone !== undefined || data.contact_phone !== undefined) {
        updateData.phone = data.phone || data.contact_phone;
      }
      if (data.address !== undefined || data.billing_address !== undefined) {
        updateData.address = data.address || data.billing_address;
      }
      if (data.discount_percentage !== undefined) {
        updateData.discount_percentage = data.discount_percentage;
      }
      if (data.credit_limit !== undefined) {
        updateData.credit_limit = data.credit_limit;
      }
      if (data.payment_terms !== undefined) {
        updateData.payment_terms = typeof data.payment_terms === 'string' 
          ? parseInt(data.payment_terms) || 30 
          : data.payment_terms;
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }

      const { error } = await supabase
        .from("corporate_accounts")
        .update(updateData)
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      toast({
        title: "Account Updated",
        description: "Corporate account has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useDeleteCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountId: string) => {
      // 1. Clear corporate_account_id from payments referencing this account
      const { error: paymentsError } = await supabase
        .from("payments")
        .update({ corporate_account_id: null })
        .eq("corporate_account_id", accountId);

      if (paymentsError) throw paymentsError;

      // 2. Delete links from the guest_corporate_accounts join table
      const { error: joinTableError } = await supabase
        .from("guest_corporate_accounts")
        .delete()
        .eq("corporate_account_id", accountId);

      if (joinTableError) throw joinTableError;

      // 3. Clean up old-style links from guests table
      const { error: unlinkError } = await supabase
        .from("guests")
        .update({ corporate_account_id: null })
        .eq("corporate_account_id", accountId);

      if (unlinkError) throw unlinkError;

      // 4. Finally delete the corporate account
      const { error } = await supabase
        .from("corporate_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest-corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Account Deleted",
        description: "Corporate account has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

// Link guest to corporate account using the join table
export function useLinkGuestToCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      guestId,
      accountId,
    }: {
      guestId: string;
      accountId: string | null;
    }) => {
      if (accountId === null) {
        // Unlink: remove from join table
        const { error } = await supabase
          .from("guest_corporate_accounts")
          .delete()
          .eq("guest_id", guestId);

        if (error) throw error;
      } else {
        // Link: insert into join table
        const { error } = await supabase
          .from("guest_corporate_accounts")
          .insert({
            guest_id: guestId,
            corporate_account_id: accountId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["corporate-account-guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest-corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({
        title: "Guest Updated",
        description: "Guest corporate account link has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

// Unlink a specific guest from a specific corporate account
export function useUnlinkGuestFromCorporateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      guestId,
      accountId,
    }: {
      guestId: string;
      accountId: string;
    }) => {
      const { error } = await supabase
        .from("guest_corporate_accounts")
        .delete()
        .eq("guest_id", guestId)
        .eq("corporate_account_id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["corporate-account-guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest-corporate-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({
        title: "Guest Unlinked",
        description: "Guest has been unlinked from the corporate account.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useUpdateCorporateBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      amount,
    }: {
      accountId: string;
      amount: number;
    }) => {
      // Get current balance
      const { data: account, error: fetchError } = await supabase
        .from("corporate_accounts")
        .select("current_balance")
        .eq("id", accountId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Number(account.current_balance) + amount;

      const { error } = await supabase
        .from("corporate_accounts")
        .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", accountId);

      if (error) throw error;
      
      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-accounts"] });
    },
  });
}

export function useCorporateAccountById(accountId: string | null) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["corporate-account", accountId],
    queryFn: async () => {
      if (!accountId || !tenant) return null;

      const { data, error } = await supabase
        .from("corporate_accounts")
        .select("*")
        .eq("id", accountId)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (error) throw error;
      return data ? transformCorporateAccount(data) : null;
    },
    enabled: !!accountId && !!tenant,
  });
}