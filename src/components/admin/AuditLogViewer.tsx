import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, User, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs, type AuditLog } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";

interface AuditLogViewerProps {
  tenantId?: string;
}

export function AuditLogViewer({ tenantId }: AuditLogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: logs = [], isLoading } = useAuditLogs({ tenantId, limit, offset });

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create") || actionLower.includes("insert")) {
      return <Badge className="bg-success text-success-foreground">Create</Badge>;
    }
    if (actionLower.includes("update")) {
      return <Badge variant="secondary">Update</Badge>;
    }
    if (actionLower.includes("delete")) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (actionLower.includes("login") || actionLower.includes("auth")) {
      return <Badge variant="outline">Auth</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const formatEntityType = (type: string | null) => {
    if (!type) return "System";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <Skeleton className="h-6 w-16" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.map((log) => {
          const isExpanded = expandedLogs.has(log.id);
          const hasDetails = log.old_values || log.new_values;

          return (
            <div
              key={log.id}
              className={cn(
                "border rounded-lg p-3 transition-colors",
                hasDetails && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => hasDetails && toggleExpand(log.id)}
            >
              <div className="flex items-start gap-3">
                {hasDetails ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )
                ) : (
                  <div className="w-4" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="text-sm font-medium">
                      {formatEntityType(log.entity_type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </div>
                    {log.user_id && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">
                          {log.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && hasDetails && (
                    <div className="mt-3 space-y-2 text-xs">
                      {log.old_values && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">
                            Previous Values:
                          </p>
                          <pre className="bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">
                            New Values:
                          </p>
                          <pre className="bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        <div className="flex justify-between items-center pt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {offset + 1} - {offset + logs.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={logs.length < limit}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
