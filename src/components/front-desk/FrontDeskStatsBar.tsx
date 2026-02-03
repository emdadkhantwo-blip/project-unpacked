import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, LogOut, Hotel, BedDouble, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrontDeskStatsBarProps {
  arrivalsCount: number;
  departuresCount: number;
  inHouseCount: number;
  vacantRoomsCount: number;
  dirtyRoomsCount: number;
  isLoading?: boolean;
}

export function FrontDeskStatsBar({
  arrivalsCount,
  departuresCount,
  inHouseCount,
  vacantRoomsCount,
  dirtyRoomsCount,
  isLoading,
}: FrontDeskStatsBarProps) {
  const statItems = [
    {
      label: "Arrivals Today",
      value: arrivalsCount,
      icon: LogIn,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Departures Today",
      value: departuresCount,
      icon: LogOut,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
    {
      label: "In House",
      value: inHouseCount,
      icon: Hotel,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Vacant Rooms",
      value: vacantRoomsCount,
      icon: BedDouble,
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Dirty Rooms",
      value: dirtyRoomsCount,
      icon: AlertCircle,
      gradient: "from-rose-500 to-red-600",
      iconBg: "bg-white/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
