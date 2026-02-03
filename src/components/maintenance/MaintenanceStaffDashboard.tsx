import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceStaffDashboardProps {
  assignedCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedTodayCount: number;
  highPriorityCount: number;
  isLoading?: boolean;
}

export function MaintenanceStaffDashboard({
  assignedCount,
  openCount,
  inProgressCount,
  resolvedTodayCount,
  highPriorityCount,
  isLoading,
}: MaintenanceStaffDashboardProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">My Workload</h3>
              <p className="text-sm text-muted-foreground">Your maintenance ticket overview</p>
            </div>
          </div>
          {assignedCount > 0 && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
              {assignedCount} Active {assignedCount === 1 ? 'Ticket' : 'Tickets'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-background/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{assignedCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </div>

          <div className="bg-background/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{openCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Not Started</p>
          </div>

          <div className="bg-background/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{inProgressCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>

          <div className="bg-background/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{resolvedTodayCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Resolved Today</p>
          </div>

          <div className="bg-background/60 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{highPriorityCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </div>
        </div>

        {assignedCount === 0 && (
          <div className="mt-4 text-center py-4 bg-background/40 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🎉 You have no tickets assigned. Great job staying on top of things!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
