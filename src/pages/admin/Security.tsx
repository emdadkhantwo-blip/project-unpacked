import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityStatsBar } from "@/components/admin/SecurityStatsBar";
import { SecurityLogTable } from "@/components/admin/SecurityLogTable";
import { SecurityActionChart } from "@/components/admin/SecurityActionChart";
import { SecurityTimelineChart } from "@/components/admin/SecurityTimelineChart";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminSecurity() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["security-audit-logs"] });
    await queryClient.invalidateQueries({ queryKey: ["security-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["security-logs-count"] });
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-vibrant-rose to-vibrant-pink text-white shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Security Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor cross-tenant access attempts and security violations
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <SecurityStatsBar />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecurityActionChart />
        <SecurityTimelineChart />
      </div>

      {/* Security Log Table */}
      <SecurityLogTable />
    </div>
  );
}
