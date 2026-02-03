import { Receipt, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FolioStats } from "@/hooks/useFolios";

interface FolioStatsBarProps {
  stats: FolioStats | undefined;
  isLoading: boolean;
}

export function FolioStatsBar({ stats, isLoading }: FolioStatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Open Folios",
      value: stats?.total_open || 0,
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Closed Folios",
      value: stats?.total_closed || 0,
      icon: CreditCard,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Outstanding Balance",
      value: `৳${(stats?.total_balance || 0).toLocaleString()}`,
      icon: Wallet,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Today's Revenue",
      value: `৳${(stats?.today_revenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-white/20",
    },
  ];

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
          
          <CardContent className="relative z-10 flex items-center gap-4 p-5">
            <div className={cn("rounded-xl p-3", item.iconBg)}>
              <item.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">{item.label}</p>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
