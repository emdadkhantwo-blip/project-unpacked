import { ShieldAlert, ShieldOff, Users, Globe, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSecurityStats } from "@/hooks/useSecurityAuditLogs";
import { cn } from "@/lib/utils";

export function SecurityStatsBar() {
  const { data: stats, isLoading } = useSecurityStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Incidents",
      value: stats?.total || 0,
      icon: ShieldAlert,
      gradient: "from-vibrant-purple to-vibrant-indigo",
      iconBg: "bg-vibrant-purple/20",
      iconColor: "text-vibrant-purple",
    },
    {
      label: "Last 24 Hours",
      value: stats?.last24Hours || 0,
      icon: Clock,
      gradient: "from-vibrant-blue to-vibrant-cyan",
      iconBg: "bg-vibrant-blue/20",
      iconColor: "text-vibrant-blue",
    },
    {
      label: "Critical",
      value: stats?.criticalCount || 0,
      icon: ShieldOff,
      gradient: "from-vibrant-rose to-vibrant-pink",
      iconBg: "bg-vibrant-rose/20",
      iconColor: "text-vibrant-rose",
    },
    {
      label: "High Severity",
      value: stats?.highCount || 0,
      icon: AlertTriangle,
      gradient: "from-vibrant-amber to-vibrant-orange",
      iconBg: "bg-vibrant-amber/20",
      iconColor: "text-vibrant-amber",
    },
    {
      label: "Unique Users",
      value: stats?.uniqueUsers || 0,
      icon: Users,
      gradient: "from-vibrant-green to-vibrant-emerald",
      iconBg: "bg-vibrant-green/20",
      iconColor: "text-vibrant-green",
    },
    {
      label: "Unique IPs",
      value: stats?.uniqueIPs || 0,
      icon: Globe,
      gradient: "from-vibrant-cyan to-vibrant-blue",
      iconBg: "bg-vibrant-cyan/20",
      iconColor: "text-vibrant-cyan",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, i) => (
        <Card
          key={i}
          className={cn(
            "overflow-hidden border-l-4 transition-all hover:shadow-lg hover:-translate-y-0.5",
            `border-l-${stat.iconColor.replace("text-", "")}`
          )}
          style={{
            borderLeftColor: `hsl(var(--${stat.iconColor.replace("text-vibrant-", "")}))`,
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  stat.iconBg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <span
                className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  stat.gradient
                )}
              >
                {stat.value}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
