import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SecurityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseSecurityAuditLogsOptions {
  limit?: number;
  offset?: number;
  actionFilter?: string;
  severityFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useSecurityAuditLogs(options: UseSecurityAuditLogsOptions = {}) {
  const { limit = 50, offset = 0, actionFilter, severityFilter, dateFrom, dateTo } = options;

  return useQuery({
    queryKey: ["security-audit-logs", limit, offset, actionFilter, severityFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "security_violation")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (actionFilter && actionFilter !== "all") {
        query = query.ilike("action", `%${actionFilter}%`);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by severity in the new_values JSONB if specified
      let filteredData = data as SecurityLog[];
      if (severityFilter && severityFilter !== "all") {
        filteredData = filteredData.filter(log => {
          const newValues = log.new_values as Record<string, unknown> | null;
          return newValues?.severity === severityFilter;
        });
      }

      return filteredData;
    },
  });
}

export function useSecurityLogCount() {
  return useQuery({
    queryKey: ["security-logs-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "security_violation");

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useSecurityStats() {
  return useQuery({
    queryKey: ["security-stats"],
    queryFn: async () => {
      // Get all security violation logs
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "security_violation")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const securityLogs = logs as SecurityLog[];

      // Calculate stats
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last24HoursCount = securityLogs.filter(
        log => new Date(log.created_at) >= last24Hours
      ).length;

      const last7DaysCount = securityLogs.filter(
        log => new Date(log.created_at) >= last7Days
      ).length;

      const last30DaysCount = securityLogs.filter(
        log => new Date(log.created_at) >= last30Days
      ).length;

      // Count by severity
      const criticalCount = securityLogs.filter(log => {
        const newValues = log.new_values as Record<string, unknown> | null;
        return newValues?.severity === "critical";
      }).length;

      const highCount = securityLogs.filter(log => {
        const newValues = log.new_values as Record<string, unknown> | null;
        return newValues?.severity === "high";
      }).length;

      // Count by action type
      const actionCounts: Record<string, number> = {};
      securityLogs.forEach(log => {
        const action = log.action;
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      // Get unique user IDs involved
      const uniqueUsers = new Set(securityLogs.map(log => log.user_id).filter(Boolean));

      // Get unique IP addresses
      const uniqueIPs = new Set(securityLogs.map(log => log.ip_address).filter(Boolean));

      return {
        total: securityLogs.length,
        last24Hours: last24HoursCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        criticalCount,
        highCount,
        actionCounts,
        uniqueUsers: uniqueUsers.size,
        uniqueIPs: uniqueIPs.size,
        recentLogs: securityLogs.slice(0, 10),
      };
    },
  });
}
