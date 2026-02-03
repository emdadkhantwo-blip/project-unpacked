import { useState } from "react";
import { useAuth } from "./useAuth";
import { startOfDay, isToday, parseISO } from "date-fns";

export interface HRActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
}

// Map action strings to categories
const ACTION_CATEGORY_MAP: Record<string, string> = {
  login: "login",
  logout: "login",
  signin: "login",
  signout: "login",
  clock_in: "attendance",
  clock_out: "attendance",
  break_start: "attendance",
  break_end: "attendance",
  role_change: "role_change",
  role_assigned: "role_change",
  role_removed: "role_change",
  payroll_generated: "payroll",
  payroll_finalized: "payroll",
  leave_request: "leave",
  leave_approved: "leave",
  leave_rejected: "leave",
  document_uploaded: "document",
  document_deleted: "document",
};

// Mock data since audit_logs table doesn't exist yet
const MOCK_LOGS: HRActivityLog[] = [
  {
    id: "1",
    user_id: "user-1",
    action: "login",
    entity_type: "session",
    entity_id: null,
    old_values: null,
    new_values: null,
    ip_address: "192.168.1.1",
    user_agent: "Chrome",
    created_at: new Date().toISOString(),
    user_name: "John Doe",
    user_avatar: null,
  },
  {
    id: "2",
    user_id: "user-2",
    action: "clock_in",
    entity_type: "attendance",
    entity_id: null,
    old_values: null,
    new_values: { time: "09:00" },
    ip_address: "192.168.1.2",
    user_agent: "Firefox",
    created_at: new Date().toISOString(),
    user_name: "Jane Smith",
    user_avatar: null,
  },
];

export function useHRActivityLogs(categoryFilter: string = "all") {
  const { tenantId } = useAuth();
  const [logs] = useState<HRActivityLog[]>(MOCK_LOGS);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Get category for an action
  const getCategory = (action: string): string => {
    const lowerAction = action.toLowerCase();
    for (const [key, category] of Object.entries(ACTION_CATEGORY_MAP)) {
      if (lowerAction.includes(key)) return category;
    }
    return "other";
  };

  // Filtered logs
  const filteredLogs =
    categoryFilter === "all"
      ? logs
      : logs.filter((log) => getCategory(log.action) === categoryFilter);

  // Stats
  const stats = {
    total: logs.length,
    today: logs.filter((log) => {
      try {
        return isToday(parseISO(log.created_at));
      } catch {
        return false;
      }
    }).length,
    roleChanges: logs.filter((log) => getCategory(log.action) === "role_change").length,
    loginsToday: logs.filter((log) => {
      try {
        return getCategory(log.action) === "login" && isToday(parseISO(log.created_at));
      } catch {
        return false;
      }
    }).length,
  };

  return {
    logs: filteredLogs,
    allLogs: logs,
    stats,
    isLoading,
    error,
    getCategory,
  };
}
