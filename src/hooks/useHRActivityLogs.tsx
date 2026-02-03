import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfDay, parseISO, isToday } from "date-fns";

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
  // Joined
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

export function useHRActivityLogs(categoryFilter: string = "all") {
  const { tenantId } = useAuth();

  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hr-activity-logs", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Fetch audit logs for this tenant
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((data || []).map((log) => log.user_id).filter(Boolean))];

      // Fetch user profiles
      let profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds as string[]);

        profileMap = new Map(
          (profiles || []).map((p) => [p.id, { full_name: p.full_name || "", avatar_url: p.avatar_url }])
        );
      }

      return (data || []).map((log) => {
        const profile = log.user_id ? profileMap.get(log.user_id) : null;
        return {
          id: log.id,
          user_id: log.user_id,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          old_values: log.old_values as Record<string, unknown> | null,
          new_values: log.new_values as Record<string, unknown> | null,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at,
          user_name: profile?.full_name || null,
          user_avatar: profile?.avatar_url || null,
        };
      });
    },
    enabled: !!tenantId,
  });

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
  const today = startOfDay(new Date());
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
