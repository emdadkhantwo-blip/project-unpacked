import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

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

// Mock data since HR leave tables don't exist yet
const MOCK_LEAVE_TYPES: LeaveType[] = [
  { id: "1", code: "AL", name: "Annual Leave", days_per_year: 20, is_paid: true, is_active: true, color: "#22c55e" },
  { id: "2", code: "SL", name: "Sick Leave", days_per_year: 10, is_paid: true, is_active: true, color: "#eab308" },
  { id: "3", code: "UL", name: "Unpaid Leave", days_per_year: null, is_paid: false, is_active: true, color: "#94a3b8" },
];

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
const MOCK_BALANCES: LeaveBalance[] = [];

export function useLeaveManagement() {
  const { user, tenantId } = useAuth();
  const [leaveTypes] = useState<LeaveType[]>(MOCK_LEAVE_TYPES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
  const [myBalances] = useState<LeaveBalance[]>(MOCK_BALANCES);
  const [isLoading] = useState(false);

  const stats = {
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
    onLeaveToday: 0,
  };

  const submitRequest = {
    mutate: async (data: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
    }) => {
      const leaveType = leaveTypes.find((lt) => lt.id === data.leave_type_id);
      const newRequest: LeaveRequest = {
        id: Date.now().toString(),
        profile_id: user?.id || "",
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        reason: data.reason || null,
        status: "pending",
        notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        staff_name: "Current User",
        staff_avatar: null,
        leave_type_name: leaveType?.name || "Unknown",
        leave_type_color: leaveType?.color || null,
        reviewer_name: null,
      };
      setLeaveRequests((prev) => [newRequest, ...prev]);
      toast({ title: "Leave request submitted (mock)", description: "Your request is pending approval." });
    },
    isPending: false,
  };

  const approveRequest = {
    mutate: async (requestId: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "approved" as const, reviewed_at: new Date().toISOString() }
            : r
        )
      );
      toast({ title: "Leave approved (mock)" });
    },
    isPending: false,
  };

  const rejectRequest = {
    mutate: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "rejected" as const, notes: notes || null, reviewed_at: new Date().toISOString() }
            : r
        )
      );
      toast({ title: "Leave rejected (mock)" });
    },
    isPending: false,
  };

  const createLeaveType = {
    mutate: async (data: {
      name: string;
      code: string;
      days_per_year: number;
      is_paid: boolean;
      color: string;
    }) => {
      toast({ title: "Leave type created (mock)", description: "hr_leave_types table not yet available." });
    },
    isPending: false,
  };

  return {
    leaveTypes,
    leaveRequests,
    myBalances,
    stats,
    isLoading,
    submitRequest,
    approveRequest,
    rejectRequest,
    createLeaveType,
  };
}
