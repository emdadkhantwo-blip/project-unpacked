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

// Note: audit_logs table doesn't exist yet - returning mock data

export function useSecurityAuditLogs(_options: UseSecurityAuditLogsOptions = {}) {
  return {
    data: [] as SecurityLog[],
    isLoading: false,
    error: null,
  };
}

export function useSecurityLogCount() {
  return {
    data: 0,
    isLoading: false,
    error: null,
  };
}

export function useSecurityStats() {
  return {
    data: {
      total: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      criticalCount: 0,
      highCount: 0,
      actionCounts: {} as Record<string, number>,
      uniqueUsers: 0,
      uniqueIPs: 0,
      recentLogs: [] as SecurityLog[],
    },
    isLoading: false,
    error: null,
  };
}
