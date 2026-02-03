import { Users, Star, Ban, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GuestStatsBarProps {
  totalGuests: number;
  vipGuests: number;
  blacklistedGuests: number;
  totalRevenue: number;
  isLoading?: boolean;
}

export function GuestStatsBar({
  totalGuests,
  vipGuests,
  blacklistedGuests,
  totalRevenue,
  isLoading,
}: GuestStatsBarProps) {
  const stats = [
    {
      label: "Total Guests",
      value: totalGuests,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "VIP Guests",
      value: vipGuests,
      icon: Star,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Blacklisted",
      value: blacklistedGuests,
      icon: Ban,
      gradient: "from-rose-500 to-red-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Total Revenue",
      value: `৳${totalRevenue.toLocaleString()}`,
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
      isRevenue: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
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
          
          <CardContent className="relative z-10 flex items-center gap-3 p-4">
            <div className={cn("rounded-xl p-2.5", stat.iconBg)}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/80 font-medium">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
