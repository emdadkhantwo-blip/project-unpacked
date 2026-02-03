import { useQuery } from "@tanstack/react-query";

// Mock implementation - audit_logs table doesn't exist yet
export interface AuditLog {
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

interface UseAuditLogsOptions {
  tenantId?: string;
  limit?: number;
  offset?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  return useQuery({
    queryKey: ["audit-logs", options.tenantId, options.limit, options.offset],
    queryFn: async (): Promise<AuditLog[]> => {
      // Return empty array - audit_logs table not implemented yet
      return [];
    },
  });
}

export function useAuditLogCount(tenantId?: string) {
  return useQuery({
    queryKey: ["audit-logs-count", tenantId],
    queryFn: async (): Promise<number> => {
      return 0;
    },
  });
}
