import { TrendingUp, Wallet, Bed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetrics } from "@/hooks/useReports";

interface MetricsCardsProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Occupancy Rate",
      value: `${metrics?.occupancyRate || 0}%`,
      subLabel: "Average for period",
      icon: Bed,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "ADR",
      value: `৳${metrics?.adr || 0}`,
      subLabel: "Average Daily Rate",
      icon: Wallet,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "RevPAR",
      value: `৳${metrics?.revPar || 0}`,
      subLabel: "Revenue per Available Room",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Total Revenue",
      value: `৳${(metrics?.totalRevenue || 0).toLocaleString()}`,
      subLabel: `Room: ৳${(metrics?.roomRevenue || 0).toLocaleString()} • Services: ৳${(metrics?.serviceRevenue || 0).toLocaleString()}`,
      icon: Wallet,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.subLabel}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
