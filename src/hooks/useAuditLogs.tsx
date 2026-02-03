import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { tenantId, limit = 50, offset = 0 } = options;

  return useQuery({
    queryKey: ["audit-logs", tenantId, limit, offset],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

export function useAuditLogCount(tenantId?: string) {
  return useQuery({
    queryKey: ["audit-logs-count", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true });

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
  });
}
