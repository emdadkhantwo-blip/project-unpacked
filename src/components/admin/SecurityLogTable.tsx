import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Globe,
  Monitor,
  AlertTriangle,
  ShieldOff,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSecurityAuditLogs,
  type SecurityLog,
} from "@/hooks/useSecurityAuditLogs";
import { cn } from "@/lib/utils";

export function SecurityLogTable() {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useSecurityAuditLogs({
    limit,
    offset,
    actionFilter: actionFilter === "all" ? undefined : actionFilter,
    severityFilter: severityFilter === "all" ? undefined : severityFilter,
  });

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getSeverityBadge = (log: SecurityLog) => {
    const newValues = log.new_values as Record<string, unknown> | null;
    const severity = (newValues?.severity as string) || "medium";

    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-vibrant-rose/20 text-vibrant-rose border-vibrant-rose/30">
            <ShieldOff className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-vibrant-amber/20 text-vibrant-amber border-vibrant-amber/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-vibrant-blue/20 text-vibrant-blue border-vibrant-blue/30">
            Medium
          </Badge>
        );
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("cross_tenant")) {
      return (
        <Badge className="bg-vibrant-purple/20 text-vibrant-purple border-vibrant-purple/30">
          Cross-Tenant Access
        </Badge>
      );
    }
    if (action.includes("rls_bypass")) {
      return (
        <Badge className="bg-vibrant-rose/20 text-vibrant-rose border-vibrant-rose/30">
          RLS Bypass Attempt
        </Badge>
      );
    }
    if (action.includes("auth")) {
      return (
        <Badge className="bg-vibrant-amber/20 text-vibrant-amber border-vibrant-amber/30">
          Auth Violation
        </Badge>
      );
    }
    return <Badge variant="outline">{action.replace(/_/g, " ")}</Badge>;
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown";
    // Extract browser info
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return userAgent.slice(0, 30) + "...";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-vibrant-rose" />
            Security Violations Log
          </CardTitle>
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-vibrant-rose" />
            Security Violations Log
          </CardTitle>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="cross_tenant">Cross-Tenant</SelectItem>
                  <SelectItem value="rls_bypass">RLS Bypass</SelectItem>
                  <SelectItem value="auth">Auth Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No Security Violations
            </h3>
            <p className="text-sm text-muted-foreground">
              No cross-tenant access attempts or security violations have been recorded.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const newValues = log.new_values as Record<string, unknown> | null;

            return (
              <div
                key={log.id}
                className={cn(
                  "border rounded-lg p-4 transition-all cursor-pointer hover:bg-muted/30",
                  isExpanded && "bg-muted/20"
                )}
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex items-start gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground" />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getSeverityBadge(log)}
                      {getActionBadge(log.action)}
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a")}
                      </div>
                      {log.user_id && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-mono text-xs">
                            {log.user_id.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {log.ip_address}
                        </div>
                      )}
                      {log.user_agent && (
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {formatUserAgent(log.user_agent)}
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* User's Tenant Info */}
                        {log.old_values && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="font-medium text-sm mb-2 text-muted-foreground">
                              User's Tenant Info
                            </p>
                            <pre className="text-xs overflow-x-auto text-foreground">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Attempted Access Details */}
                        {newValues && (
                          <div className="bg-vibrant-rose/5 rounded-lg p-3 border border-vibrant-rose/20">
                            <p className="font-medium text-sm mb-2 text-vibrant-rose">
                              Attempted Access Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {newValues.attempted_tenant_id && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Attempted Tenant:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {String(newValues.attempted_tenant_id).slice(0, 8)}...
                                  </span>
                                </div>
                              )}
                              {newValues.attempted_property_id && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Attempted Property:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {String(newValues.attempted_property_id).slice(0, 8)}...
                                  </span>
                                </div>
                              )}
                              {newValues.severity && (
                                <div>
                                  <span className="text-muted-foreground">Severity:</span>{" "}
                                  <span className="capitalize font-medium">
                                    {String(newValues.severity)}
                                  </span>
                                </div>
                              )}
                              {newValues.timestamp && (
                                <div>
                                  <span className="text-muted-foreground">Timestamp:</span>{" "}
                                  {format(
                                    new Date(String(newValues.timestamp)),
                                    "PPpp"
                                  )}
                                </div>
                              )}
                            </div>
                            {newValues.details && (
                              <div className="mt-2">
                                <p className="text-muted-foreground text-xs mb-1">
                                  Additional Details:
                                </p>
                                <pre className="text-xs overflow-x-auto bg-background/50 p-2 rounded">
                                  {JSON.stringify(newValues.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={(e) => {
                e.stopPropagation();
                setOffset(Math.max(0, offset - limit));
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setOffset(offset + limit);
              }}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
