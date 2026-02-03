import { AlertCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MaintenanceStatsBarProps {
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  highPriorityCount: number;
  isLoading?: boolean;
}

export function MaintenanceStatsBar({
  openCount,
  inProgressCount,
  resolvedCount,
  highPriorityCount,
  isLoading,
}: MaintenanceStatsBarProps) {
  const stats = [
    {
      label: "Open Tickets",
      value: openCount,
      icon: AlertCircle,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "High Priority",
      value: highPriorityCount,
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
      iconBg: "bg-white/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className={cn(
            "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
            `bg-gradient-to-br ${stat.gradient}`
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
          
          <CardContent className="relative z-10 flex items-center gap-4 p-5">
            <div className={cn("rounded-xl p-3", stat.iconBg)}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
