import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CalendarX, Hotel, Users, XCircle, Calendar, TrendingUp } from "lucide-react";
import type { ReservationStats } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";

interface ReservationStatsBarProps {
  stats: ReservationStats | null;
  isLoading?: boolean;
}

export function ReservationStatsBar({ stats, isLoading }: ReservationStatsBarProps) {
  const statItems = [
    {
      label: "Arrivals Today",
      value: stats?.arrivals_today ?? 0,
      icon: CalendarCheck,
      gradient: "from-blue-400 to-blue-600",
      iconBg: "bg-vibrant-blue-light",
      iconColor: "text-vibrant-blue",
    },
    {
      label: "Departures Today",
      value: stats?.departures_today ?? 0,
      icon: CalendarX,
      gradient: "from-amber-400 to-amber-600",
      iconBg: "bg-vibrant-amber-light",
      iconColor: "text-vibrant-amber",
    },
    {
      label: "In House",
      value: stats?.in_house ?? 0,
      icon: Hotel,
      gradient: "from-emerald-400 to-emerald-600",
      iconBg: "bg-vibrant-green-light",
      iconColor: "text-vibrant-green",
    },
    {
      label: "Confirmed",
      value: stats?.confirmed ?? 0,
      icon: Calendar,
      gradient: "from-indigo-400 to-indigo-600",
      iconBg: "bg-vibrant-indigo-light",
      iconColor: "text-vibrant-indigo",
    },
    {
      label: "Cancelled",
      value: stats?.cancelled ?? 0,
      icon: XCircle,
      gradient: "from-rose-400 to-rose-600",
      iconBg: "bg-vibrant-rose-light",
      iconColor: "text-vibrant-rose",
    },
    {
      label: "Total",
      value: stats?.total ?? 0,
      icon: Users,
      gradient: "from-purple-400 to-purple-600",
      iconBg: "bg-vibrant-purple-light",
      iconColor: "text-vibrant-purple",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border shadow-sm overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item, index) => (
        <Card 
          key={item.label} 
          className="group relative border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          {/* Decorative gradient background */}
          <div className={cn(
            "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 transition-transform group-hover:scale-125",
            item.gradient
          )} />
          
          <CardContent className="relative flex items-center gap-3 p-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              item.iconBg
            )}>
              <item.icon className={cn("h-6 w-6", item.iconColor)} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className={cn("text-xl font-bold tabular-nums", item.iconColor)}>
                {item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
