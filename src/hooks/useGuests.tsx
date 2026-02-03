import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Guest = Tables<"guests"> & {
  has_corporate_accounts?: boolean;
};

export type GuestInsert = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  id_type?: string;
  id_number?: string;
  nationality?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  is_vip?: boolean;
};

export type GuestUpdate = Partial<GuestInsert> & {
  id: string;
  is_vip?: boolean;
  is_blacklisted?: boolean;
  blacklist_reason?: string | null;
  corporate_account_id?: string | null;
};

export function useGuests(searchQuery?: string) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["guests", tenantId, searchQuery],
    queryFn: async (): Promise<Guest[]> => {
      if (!tenantId) return [];

      let query = supabase
        .from("guests")
        .select("*, guest_corporate_accounts(id)")
        .eq("tenant_id", tenantId)
        .order("last_name", { ascending: true });

      if (searchQuery && searchQuery.length > 0) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      // Map to include has_corporate_accounts flag
      return (data || []).map((guest: any) => ({
        ...guest,
        has_corporate_accounts: (guest.guest_corporate_accounts?.length || 0) > 0 || !!guest.corporate_account_id,
        guest_corporate_accounts: undefined, // Remove the nested array from the response
      }));
    },
    enabled: !!tenantId,
  });
}

export function useGuestStats() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["guest-stats", tenantId],
    queryFn: async () => {
      if (!tenantId) return { total: 0, vip: 0, blacklisted: 0, totalRevenue: 0 };

      const { data, error } = await supabase
        .from("guests")
        .select("id, is_vip, is_blacklisted, total_revenue")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const guests = data || [];
      return {
        total: guests.length,
        vip: guests.filter((g) => g.is_vip).length,
        blacklisted: guests.filter((g) => g.is_blacklisted).length,
        totalRevenue: guests.reduce((sum, g) => sum + (g.total_revenue || 0), 0),
      };
    },
    enabled: !!tenantId,
  });
}

export function useGuestReservations(guestId?: string) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["guest-reservations", tenantId, guestId],
    queryFn: async () => {
      if (!tenantId || !guestId) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("guest_id", guestId)
        .order("check_in_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!guestId,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (guest: GuestInsert): Promise<Guest> => {
      if (!tenantId) throw new Error("No tenant selected");

      const { data, error } = await supabase
        .from("guests")
        .insert({
          ...guest,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["guest-stats", tenantId] });
      toast.success("Guest created successfully");
    },
    onError: (error) => {
      console.error("Error creating guest:", error);
      toast.error("Failed to create guest");
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (guest: GuestUpdate): Promise<Guest> => {
      if (!tenantId) throw new Error("No tenant selected");

      const { id, ...updateData } = guest;

      const { data, error } = await supabase
        .from("guests")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["guest-stats", tenantId] });
      toast.success("Guest updated successfully");
    },
    onError: (error) => {
      console.error("Error updating guest:", error);
      toast.error("Failed to update guest");
    },
  });
}
