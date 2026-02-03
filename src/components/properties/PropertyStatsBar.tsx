import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CheckCircle, XCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyStatsBarProps {
  stats: {
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    maintenanceProperties: number;
  };
  isLoading?: boolean;
}

export function PropertyStatsBar({ stats, isLoading }: PropertyStatsBarProps) {
  const statItems = [
    {
      label: "Total Properties",
      value: stats.totalProperties,
      icon: Building2,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Active",
      value: stats.activeProperties,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Inactive",
      value: stats.inactiveProperties,
      icon: XCircle,
      gradient: "from-slate-500 to-slate-700",
      iconBg: "bg-white/20",
    },
    {
      label: "Maintenance",
      value: stats.maintenanceProperties,
      icon: Wrench,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
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
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-white/80 font-medium">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
