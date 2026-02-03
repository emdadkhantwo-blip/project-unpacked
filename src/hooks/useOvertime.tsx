import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

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
  staff_name: string;
  staff_avatar: string | null;
  approver_name: string | null;
  hourly_rate: number;
  total_pay: number;
}

// Mock implementation since hr_overtime_entries table doesn't exist
export function useOvertime() {
  const { user, tenantId } = useAuth();
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [isLoading] = useState(false);

  const stats = {
    pending: entries.filter((e) => e.status === "pending").length,
    approvedHours: entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.hours, 0),
    totalCost: entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.total_pay, 0),
    thisMonthHours: 0,
  };

  const staffList: { id: string; full_name: string | null; avatar_url: string | null }[] = [];

  const addEntry = {
    mutate: async (data: {
      profile_id: string;
      date: string;
      hours: number;
      rate_multiplier: number;
    }) => {
      const newEntry: OvertimeEntry = {
        id: Date.now().toString(),
        tenant_id: tenantId || "",
        profile_id: data.profile_id,
        date: data.date,
        hours: data.hours,
        rate_multiplier: data.rate_multiplier,
        status: "pending",
        approved_by: null,
        approved_at: null,
        payroll_entry_id: null,
        staff_name: "Staff Member",
        staff_avatar: null,
        approver_name: null,
        hourly_rate: 10,
        total_pay: data.hours * 10 * data.rate_multiplier,
      };
      setEntries((prev) => [newEntry, ...prev]);
      toast({ title: "Overtime entry added (mock)" });
    },
    isPending: false,
  };

  const approveEntry = {
    mutate: async (entryId: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, status: "approved" as const, approved_at: new Date().toISOString() }
            : e
        )
      );
      toast({ title: "Overtime approved (mock)" });
    },
    isPending: false,
  };

  const rejectEntry = {
    mutate: async (entryId: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, status: "rejected" as const, approved_at: new Date().toISOString() }
            : e
        )
      );
      toast({ title: "Overtime rejected (mock)" });
    },
    isPending: false,
  };

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
