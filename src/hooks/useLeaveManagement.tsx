import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { startOfDay, isWithinInterval, parseISO } from "date-fns";

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  days_per_year: number | null;
  is_paid: boolean | null;
  is_active: boolean | null;
  color: string | null;
}

export interface LeaveRequest {
  id: string;
  profile_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined data
  staff_name: string;
  staff_avatar: string | null;
  leave_type_name: string;
  leave_type_color: string | null;
  reviewer_name: string | null;
}

export interface LeaveBalance {
  id: string;
  profile_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  leave_type_name: string;
}

export function useLeaveManagement() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leave types
  const {
    data: leaveTypes = [],
    isLoading: leaveTypesLoading,
  } = useQuery({
    queryKey: ["leave-types", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("hr_leave_types")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as LeaveType[];
    },
    enabled: !!tenantId,
  });

  // Fetch leave requests
  const {
    data: leaveRequests = [],
    isLoading: requestsLoading,
  } = useQuery({
    queryKey: ["leave-requests", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("hr_leave_requests")
        .select(`
          *,
          profile:profiles!hr_leave_requests_profile_id_fkey(full_name, avatar_url),
          leave_type:hr_leave_types!hr_leave_requests_leave_type_id_fkey(name, color),
          reviewer:profiles!hr_leave_requests_reviewed_by_fkey(full_name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((req) => ({
        id: req.id,
        profile_id: req.profile_id,
        leave_type_id: req.leave_type_id,
        start_date: req.start_date,
        end_date: req.end_date,
        days: req.days,
        reason: req.reason,
        status: req.status as "pending" | "approved" | "rejected",
        notes: req.notes,
        reviewed_by: req.reviewed_by,
        reviewed_at: req.reviewed_at,
        created_at: req.created_at,
        staff_name: (req.profile as any)?.full_name || "Unknown",
        staff_avatar: (req.profile as any)?.avatar_url || null,
        leave_type_name: (req.leave_type as any)?.name || "Unknown",
        leave_type_color: (req.leave_type as any)?.color || null,
        reviewer_name: (req.reviewer as any)?.full_name || null,
      }));
    },
    enabled: !!tenantId,
  });

  // Fetch leave balances for current user
  const {
    data: myBalances = [],
    isLoading: balancesLoading,
  } = useQuery({
    queryKey: ["my-leave-balances", tenantId, user?.id],
    queryFn: async () => {
      if (!tenantId || !user?.id) return [];

      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from("hr_leave_balances")
        .select(`
          *,
          leave_type:hr_leave_types!hr_leave_balances_leave_type_id_fkey(name)
        `)
        .eq("tenant_id", tenantId)
        .eq("profile_id", user.id)
        .eq("year", currentYear);

      if (error) throw error;

      return (data || []).map((bal) => ({
        id: bal.id,
        profile_id: bal.profile_id,
        leave_type_id: bal.leave_type_id,
        year: bal.year,
        total_days: bal.total_days || 0,
        used_days: bal.used_days || 0,
        remaining_days: bal.remaining_days || 0,
        leave_type_name: (bal.leave_type as any)?.name || "Unknown",
      }));
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Stats calculation
  const today = startOfDay(new Date());
  const stats = {
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
    onLeaveToday: leaveRequests.filter((r) => {
      if (r.status !== "approved") return false;
      try {
        const start = parseISO(r.start_date);
        const end = parseISO(r.end_date);
        return isWithinInterval(today, { start, end });
      } catch {
        return false;
      }
    }).length,
  };

  // Submit leave request
  const submitRequest = useMutation({
    mutationFn: async (data: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
    }) => {
      if (!tenantId || !user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("hr_leave_requests").insert({
        tenant_id: tenantId,
        profile_id: user.id,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        reason: data.reason,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Leave request submitted", description: "Your request is pending approval." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Approve leave request
  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hr_leave_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Leave approved" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reject leave request
  const rejectRequest = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hr_leave_requests")
        .update({
          status: "rejected",
          notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Leave rejected" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create leave type
  const createLeaveType = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      days_per_year: number;
      is_paid: boolean;
      color: string;
    }) => {
      if (!tenantId) throw new Error("No tenant");

      const { error } = await supabase.from("hr_leave_types").insert({
        tenant_id: tenantId,
        name: data.name,
        code: data.code,
        days_per_year: data.days_per_year,
        is_paid: data.is_paid,
        color: data.color,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast({ title: "Leave type created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    leaveTypes,
    leaveRequests,
    myBalances,
    stats,
    isLoading: leaveTypesLoading || requestsLoading || balancesLoading,
    submitRequest,
    approveRequest,
    rejectRequest,
    createLeaveType,
  };
}
