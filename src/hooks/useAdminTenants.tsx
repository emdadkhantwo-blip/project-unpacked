import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string | null;
  timezone: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
  // Computed stats
  properties_count: number;
  staff_count: number;
  rooms_count: number;
}

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  feature_name: string;
  is_enabled: boolean;
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: async () => {
      // Fetch all tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch property counts per tenant
      const { data: propertyCounts } = await supabase
        .from("properties")
        .select("tenant_id");

      // Fetch staff counts per tenant
      const { data: staffCounts } = await supabase
        .from("profiles")
        .select("tenant_id");

      // Fetch room counts per tenant
      const { data: roomCounts } = await supabase
        .from("rooms")
        .select("tenant_id");

      // Count properties per tenant
      const propertyCountMap = new Map<string, number>();
      propertyCounts?.forEach((p) => {
        const count = propertyCountMap.get(p.tenant_id) || 0;
        propertyCountMap.set(p.tenant_id, count + 1);
      });

      // Count staff per tenant
      const staffCountMap = new Map<string, number>();
      staffCounts?.forEach((s) => {
        if (s.tenant_id) {
          const count = staffCountMap.get(s.tenant_id) || 0;
          staffCountMap.set(s.tenant_id, count + 1);
        }
      });

      // Count rooms per tenant
      const roomCountMap = new Map<string, number>();
      roomCounts?.forEach((r) => {
        const count = roomCountMap.get(r.tenant_id) || 0;
        roomCountMap.set(r.tenant_id, count + 1);
      });

      // Combine data
      const tenantsWithStats: TenantWithStats[] = (tenants || []).map((tenant) => ({
        ...tenant,
        properties_count: propertyCountMap.get(tenant.id) || 0,
        staff_count: staffCountMap.get(tenant.id) || 0,
        rooms_count: roomCountMap.get(tenant.id) || 0,
      }));

      return tenantsWithStats;
    },
  });
}

export function useTenantFeatureFlags(tenantId: string | undefined) {
  // Feature flags table not yet available - return empty array
  return useQuery({
    queryKey: ["admin", "feature-flags", tenantId],
    queryFn: async (): Promise<FeatureFlag[]> => {
      // TODO: Feature flags table not yet available
      return [];
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      tenantId,
      _status,
    }: {
      tenantId: string;
      _status: "active" | "suspended" | "pending";
    }) => {
      // Status field not available on tenants table yet
      // Just invalidate cache for now
      console.log('Update tenant status:', tenantId, _status);
    },
    onSuccess: (_, { _status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast({
        title: "Status Updated",
        description: `Tenant status update noted (database field coming soon).`,
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

export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      tenantId,
      featureName,
      isEnabled,
    }: {
      tenantId: string;
      featureName: string;
      isEnabled: boolean;
    }) => {
      // Feature flags table not yet available
      console.log('Toggle feature flag:', tenantId, featureName, isEnabled);
    },
    onSuccess: (_, { featureName, isEnabled }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
      toast({
        title: "Feature Updated",
        description: `${featureName} has been ${isEnabled ? "enabled" : "disabled"} (locally only).`,
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

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      // Delete related data in order (respecting foreign key constraints)
      
      // 1. Delete folio items, payments, folios
      await supabase.from("folio_items").delete().eq("tenant_id", tenantId);
      await supabase.from("payments").delete().eq("tenant_id", tenantId);
      await supabase.from("folios").delete().eq("tenant_id", tenantId);
      
      // 2. Delete reservation rooms, reservations
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", tenantId);
      
      if (reservations && reservations.length > 0) {
        const reservationIds = reservations.map((r) => r.id);
        await supabase.from("reservation_rooms").delete().in("reservation_id", reservationIds);
      }
      await supabase.from("reservations").delete().eq("tenant_id", tenantId);
      
      // 3. Delete guest notes, guests
      await supabase.from("guest_notes").delete().eq("tenant_id", tenantId);
      await supabase.from("guests").delete().eq("tenant_id", tenantId);
      
      // 4. Delete corporate accounts
      await supabase.from("corporate_accounts").delete().eq("tenant_id", tenantId);
      
      // 5. Delete housekeeping tasks, maintenance tickets
      await supabase.from("housekeeping_tasks").delete().eq("tenant_id", tenantId);
      await supabase.from("maintenance_tickets").delete().eq("tenant_id", tenantId);
      
      // 6. Delete rooms, room types
      await supabase.from("rooms").delete().eq("tenant_id", tenantId);
      await supabase.from("room_types").delete().eq("tenant_id", tenantId);
      
      // 7. Delete properties
      await supabase.from("properties").delete().eq("tenant_id", tenantId);
      
      // 8. Delete user roles for tenant users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", tenantId);
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map((p) => p.id);
        await supabase.from("user_roles").delete().in("user_id", userIds);
      }
      
      // Note: Can't delete tenants due to RLS restrictions
      // The actual tenant record deletion would need to be done via admin function
      toast({
        title: "Deletion in Progress",
        description: "Related data has been deleted. Full tenant deletion requires admin privileges.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast({
        title: "Tenant Data Deleted",
        description: "The tenant's associated data has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error Deleting Tenant",
        description: error.message,
      });
    },
  });
}