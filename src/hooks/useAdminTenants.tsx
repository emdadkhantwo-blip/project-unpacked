import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "pending";
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  // Computed stats
  properties_count: number;
  staff_count: number;
  rooms_count: number;
  plan_name: string | null;
  plan_type: string | null;
}

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  feature_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
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

      // Fetch subscriptions with plans
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select(`
          tenant_id,
          plans (
            name,
            plan_type
          )
        `);

      // Fetch property counts per tenant
      const { data: propertyCounts } = await supabase
        .from("properties")
        .select("tenant_id");

      // Fetch staff counts per tenant
      const { data: staffCounts } = await supabase
        .from("profiles")
        .select("tenant_id");

      // Fetch room counts per tenant via properties
      const { data: roomCounts } = await supabase
        .from("rooms")
        .select("tenant_id");

      // Map subscriptions to tenants
      const subscriptionMap = new Map(
        subscriptions?.map((s) => [
          s.tenant_id,
          {
            plan_name: (s.plans as { name: string; plan_type: string } | null)?.name,
            plan_type: (s.plans as { name: string; plan_type: string } | null)?.plan_type,
          },
        ])
      );

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
        plan_name: subscriptionMap.get(tenant.id)?.plan_name || null,
        plan_type: subscriptionMap.get(tenant.id)?.plan_type || null,
      }));

      return tenantsWithStats;
    },
  });
}

export function useTenantFeatureFlags(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "feature-flags", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return data as FeatureFlag[];
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
      status,
    }: {
      tenantId: string;
      status: "active" | "suspended" | "pending";
    }) => {
      const { error } = await supabase
        .from("tenants")
        .update({ status })
        .eq("id", tenantId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast({
        title: "Status Updated",
        description: `Tenant has been ${status === "suspended" ? "suspended" : "reactivated"}.`,
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
      // Check if flag exists
      const { data: existing } = await supabase
        .from("feature_flags")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("feature_name", featureName)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("feature_flags")
          .update({ is_enabled: isEnabled })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("feature_flags").insert({
          tenant_id: tenantId,
          feature_name: featureName,
          is_enabled: isEnabled,
        });

        if (error) throw error;
      }
    },
    onSuccess: (_, { featureName, isEnabled }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
      toast({
        title: "Feature Updated",
        description: `${featureName} has been ${isEnabled ? "enabled" : "disabled"}.`,
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
      // 1. Delete subscriptions
      await supabase.from("subscriptions").delete().eq("tenant_id", tenantId);
      
      // 2. Delete feature flags
      await supabase.from("feature_flags").delete().eq("tenant_id", tenantId);
      
      // 3. Delete audit logs
      await supabase.from("audit_logs").delete().eq("tenant_id", tenantId);
      
      // 4. Delete chat messages
      await supabase.from("chat_messages").delete().eq("tenant_id", tenantId);
      
      // 5. Delete POS order items, orders, items, categories, outlets
      await supabase.from("pos_order_items").delete().eq("tenant_id", tenantId);
      await supabase.from("pos_orders").delete().eq("tenant_id", tenantId);
      await supabase.from("pos_items").delete().eq("tenant_id", tenantId);
      await supabase.from("pos_categories").delete().eq("tenant_id", tenantId);
      await supabase.from("pos_outlets").delete().eq("tenant_id", tenantId);
      
      // 6. Delete folio items, payments, refunds, folios
      await supabase.from("folio_items").delete().eq("tenant_id", tenantId);
      await supabase.from("refunds").delete().eq("tenant_id", tenantId);
      await supabase.from("payments").delete().eq("tenant_id", tenantId);
      await supabase.from("folios").delete().eq("tenant_id", tenantId);
      
      // 7. Delete night audits
      await supabase.from("night_audits").delete().eq("tenant_id", tenantId);
      
      // 8. Delete reservation rooms, reservations
      await supabase.from("reservation_rooms").delete().eq("tenant_id", tenantId);
      await supabase.from("reservations").delete().eq("tenant_id", tenantId);
      
      // 9. Delete guest notes, guests
      await supabase.from("guest_notes").delete().eq("tenant_id", tenantId);
      await supabase.from("guests").delete().eq("tenant_id", tenantId);
      
      // 10. Delete corporate accounts
      await supabase.from("corporate_accounts").delete().eq("tenant_id", tenantId);
      
      // 11. Delete housekeeping tasks, maintenance tickets
      await supabase.from("housekeeping_tasks").delete().eq("tenant_id", tenantId);
      await supabase.from("maintenance_tickets").delete().eq("tenant_id", tenantId);
      
      // 12. Delete rooms, room types
      await supabase.from("rooms").delete().eq("tenant_id", tenantId);
      await supabase.from("room_types").delete().eq("tenant_id", tenantId);
      
      // 13. Delete property access (need to get property IDs first)
      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("tenant_id", tenantId);
      
      if (properties && properties.length > 0) {
        const propertyIds = properties.map((p) => p.id);
        await supabase.from("property_access").delete().in("property_id", propertyIds);
      }
      
      // 14. Delete properties
      await supabase.from("properties").delete().eq("tenant_id", tenantId);
      
      // 15. Delete user roles and profiles for tenant users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", tenantId);
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map((p) => p.id);
        await supabase.from("user_roles").delete().in("user_id", userIds);
      }
      
      // 16. Delete profiles
      await supabase.from("profiles").delete().eq("tenant_id", tenantId);
      
      // 17. Finally, delete the tenant
      const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast({
        title: "Tenant Deleted",
        description: "The tenant and all associated data have been permanently deleted.",
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
