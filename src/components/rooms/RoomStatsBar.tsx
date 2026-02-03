import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RoomStatsBarProps {
  stats: {
    total: number;
    vacant: number;
    occupied: number;
    dirty: number;
    maintenance: number;
    out_of_order: number;
  } | null;
  isLoading?: boolean;
}

export function RoomStatsBar({ stats, isLoading }: RoomStatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-4 shadow-sm border animate-pulse">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            <div className="h-7 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const occupancyRate = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100) 
    : 0;

  const statItems = [
    { 
      label: "Total Rooms", 
      value: stats.total, 
      gradient: "bg-gradient-to-br from-slate-500 to-slate-700",
      iconBg: "bg-slate-500/10",
      textColor: "text-slate-600"
    },
    { 
      label: "Vacant", 
      value: stats.vacant, 
      gradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      iconBg: "bg-vibrant-green-light",
      textColor: "text-vibrant-green"
    },
    { 
      label: "Occupied", 
      value: stats.occupied, 
      gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
      iconBg: "bg-vibrant-blue-light",
      textColor: "text-vibrant-blue"
    },
    { 
      label: "Dirty", 
      value: stats.dirty, 
      gradient: "bg-gradient-to-br from-amber-400 to-amber-600",
      iconBg: "bg-vibrant-amber-light",
      textColor: "text-vibrant-amber"
    },
    { 
      label: "Maintenance", 
      value: stats.maintenance, 
      gradient: "bg-gradient-to-br from-purple-400 to-purple-600",
      iconBg: "bg-vibrant-purple-light",
      textColor: "text-vibrant-purple"
    },
    { 
      label: "Out of Order", 
      value: stats.out_of_order, 
      gradient: "bg-gradient-to-br from-rose-400 to-rose-600",
      iconBg: "bg-vibrant-rose-light",
      textColor: "text-vibrant-rose"
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
      {statItems.map((item) => (
        <div 
          key={item.label} 
          className="group relative overflow-hidden rounded-xl bg-card p-4 shadow-sm border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          {/* Decorative gradient circle */}
          <div className={cn(
            "absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 transition-transform group-hover:scale-110",
            item.gradient
          )} />
          
          <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
          <p className={cn("text-2xl font-bold tabular-nums", item.textColor)}>
            {item.value}
          </p>
        </div>
      ))}
      
      {/* Occupancy Rate - Special card */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-vibrant-blue to-vibrant-purple p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-white/5" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-white/80">Occupancy</p>
            {occupancyRate >= 70 ? (
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            ) : (
              <TrendingDown className="h-4 w-4 text-amber-300" />
            )}
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {occupancyRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
