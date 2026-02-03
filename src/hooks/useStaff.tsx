import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/types/database";

export interface StaffMember {
  id: string;
  full_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  roles: AppRole[];
  property_access: string[];
  // HR profile data (optional - table doesn't exist yet)
  staff_id?: string;
  department_id?: string;
  department_name?: string;
  join_date?: string;
  employment_type?: string;
  salary_amount?: number;
  salary_currency?: string;
  notes?: string;
}

export function useStaff() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["staff", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get all profiles for this tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map((p) => p.id);

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Note: property_access and hr_staff_profiles tables don't exist yet
      // Combine data without those tables
      const staffMembers: StaffMember[] = profiles.map((profile) => {
        return {
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          email: null, // Not in profiles table
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active ?? true,
          last_login_at: null, // Not in profiles table
          created_at: profile.created_at,
          roles: roles
            ?.filter((r) => r.user_id === profile.id)
            .map((r) => r.role as AppRole) || [],
          property_access: profile.property_id ? [profile.property_id] : [],
        };
      });

      return staffMembers;
    },
    enabled: !!tenant?.id,
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: {
        full_name?: string;
        phone?: string;
        is_active?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Staff Updated",
        description: "Staff member has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHRProfileMutation = useMutation({
    mutationFn: async (_data: {
      userId: string;
      updates: {
        staff_id?: string;
        department_id?: string | null;
        join_date?: string;
        employment_type?: "full_time" | "part_time" | "contract";
        salary_amount?: number;
        salary_currency?: string;
        notes?: string;
      };
    }) => {
      // HR staff profiles table doesn't exist yet
      toast({
        title: "Info",
        description: "HR module not yet configured",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({
      userId,
      roles,
    }: {
      userId: string;
      roles: AppRole[];
    }) => {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const roleInserts = roles.map((role) => ({ 
          user_id: userId, 
          role: role as "owner" | "manager" | "front_desk" | "housekeeping" | "maintenance" | "kitchen" | "waiter" | "pos"
        }));
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Roles Updated",
        description: "Staff roles have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePropertyAccessMutation = useMutation({
    mutationFn: async ({
      userId,
      propertyIds,
    }: {
      userId: string;
      propertyIds: string[];
    }) => {
      // Update primary property in profile (property_access table doesn't exist)
      if (propertyIds.length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ property_id: propertyIds[0] })
          .eq("id", userId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Property Access Updated",
        description: "Staff property access has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: isActive ? "Staff Activated" : "Staff Deactivated",
        description: `Staff member has been ${isActive ? "activated" : "deactivated"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-staff", {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Staff Deleted",
        description: data?.message || "Staff member has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    staff: staffQuery.data || [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    refetch: staffQuery.refetch,
    updateStaff: updateStaffMutation.mutate,
    updateHRProfile: updateHRProfileMutation.mutate,
    updateRoles: updateRolesMutation.mutate,
    updatePropertyAccess: updatePropertyAccessMutation.mutate,
    toggleActiveStatus: toggleActiveStatusMutation.mutate,
    deleteStaff: deleteStaffMutation.mutate,
    isUpdating:
      updateStaffMutation.isPending ||
      updateRolesMutation.isPending ||
      updatePropertyAccessMutation.isPending ||
      toggleActiveStatusMutation.isPending ||
      updateHRProfileMutation.isPending,
    isDeleting: deleteStaffMutation.isPending,
  };
}

export function useStaffStats() {
  const { staff } = useStaff();

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.is_active).length;
  const inactiveStaff = staff.filter((s) => !s.is_active).length;

  // Count by role
  const roleBreakdown = staff.reduce((acc, s) => {
    s.roles.forEach((role) => {
      acc[role] = (acc[role] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Count by employment type
  const employmentBreakdown = staff.reduce((acc, s) => {
    const type = s.employment_type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalStaff,
    activeStaff,
    inactiveStaff,
    roleBreakdown,
    employmentBreakdown,
  };
}
