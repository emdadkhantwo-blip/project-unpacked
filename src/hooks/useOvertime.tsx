import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";

export interface OvertimeEntry {
  id: string;
  tenant_id: string;
  profile_id: string;
  date: string;
  hours: number;
  rate_multiplier: number;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  payroll_entry_id: string | null;
  // Joined
  staff_name: string;
  staff_avatar: string | null;
  approver_name: string | null;
  hourly_rate: number;
  total_pay: number;
}

export function useOvertime() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch overtime entries
  const {
    data: entries = [],
    isLoading,
  } = useQuery({
    queryKey: ["overtime-entries", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("hr_overtime_entries")
        .select(`
          *,
          profile:profiles!hr_overtime_entries_profile_id_fkey(full_name, avatar_url),
          approver:profiles!hr_overtime_entries_approved_by_fkey(full_name)
        `)
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false });

      if (error) throw error;

      // Get staff salaries for hourly rate calculation
      const profileIds = [...new Set((data || []).map((e) => e.profile_id))];
      const { data: staffProfiles } = await supabase
        .from("hr_staff_profiles")
        .select("profile_id, salary_amount")
        .in("profile_id", profileIds);

      const salaryMap = new Map(
        (staffProfiles || []).map((sp) => [sp.profile_id, sp.salary_amount || 0])
      );

      return (data || []).map((entry) => {
        const monthlySalary = salaryMap.get(entry.profile_id) || 0;
        const hourlyRate = monthlySalary / (30 * 8); // Simplified: 30 days * 8 hours
        const totalPay = hourlyRate * entry.hours * (entry.rate_multiplier || 1);

        return {
          id: entry.id,
          tenant_id: entry.tenant_id,
          profile_id: entry.profile_id,
          date: entry.date,
          hours: entry.hours,
          rate_multiplier: entry.rate_multiplier || 1,
          status: entry.status as "pending" | "approved" | "rejected",
          approved_by: entry.approved_by,
          approved_at: entry.approved_at,
          payroll_entry_id: entry.payroll_entry_id,
          staff_name: (entry.profile as any)?.full_name || "Unknown",
          staff_avatar: (entry.profile as any)?.avatar_url || null,
          approver_name: (entry.approver as any)?.full_name || null,
          hourly_rate: hourlyRate,
          total_pay: totalPay,
        };
      });
    },
    enabled: !!tenantId,
  });

  // Stats calculation
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const stats = {
    pending: entries.filter((e) => e.status === "pending").length,
    approvedHours: entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.hours, 0),
    totalCost: entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.total_pay, 0),
    thisMonthHours: entries
      .filter((e) => {
        const date = parseISO(e.date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, e) => sum + e.hours, 0),
  };

  // Fetch staff for dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Add overtime entry
  const addEntry = useMutation({
    mutationFn: async (data: {
      profile_id: string;
      date: string;
      hours: number;
      rate_multiplier: number;
    }) => {
      if (!tenantId) throw new Error("No tenant");

      const { error } = await supabase.from("hr_overtime_entries").insert({
        tenant_id: tenantId,
        profile_id: data.profile_id,
        date: data.date,
        hours: data.hours,
        rate_multiplier: data.rate_multiplier,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries"] });
      toast({ title: "Overtime entry added" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Approve overtime
  const approveEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hr_overtime_entries")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries"] });
      toast({ title: "Overtime approved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reject overtime
  const rejectEntry = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hr_overtime_entries")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-entries"] });
      toast({ title: "Overtime rejected" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    entries,
    stats,
    staffList,
    isLoading,
    addEntry,
    approveEntry,
    rejectEntry,
  };
}
