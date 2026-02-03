import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffStatsBarProps {
  stats: {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    roleBreakdown: Record<string, number>;
  };
  isLoading?: boolean;
}

export function StaffStatsBar({ stats, isLoading }: StaffStatsBarProps) {
  const topRoles = Object.entries(stats.roleBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const statItems = [
    {
      label: "Total Staff",
      value: stats.totalStaff,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Active",
      value: stats.activeStaff,
      icon: UserCheck,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Inactive",
      value: stats.inactiveStaff,
      icon: UserX,
      gradient: "from-rose-500 to-red-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Top Roles",
      value: topRoles.length > 0
        ? topRoles.map(([role, count]) => `${role}: ${count}`).join(", ")
        : "No roles",
      icon: Shield,
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-white/20",
      isText: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statItems.map((item) => (
        <Card 
          key={item.label}
          className={cn(
            "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
            `bg-gradient-to-br ${item.gradient}`
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
          
          <CardContent className="relative z-10 flex items-center gap-3 p-4">
            <div className={cn("rounded-xl p-2.5", item.iconBg)}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              {item.isText ? (
                <p className="text-sm font-medium text-white truncate">{item.value}</p>
              ) : (
                <p className="text-2xl font-bold text-white">{item.value}</p>
              )}
              <p className="text-xs text-white/80 font-medium">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
