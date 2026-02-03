import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownToLine, ArrowUpFromLine, Users, BedDouble } from "lucide-react";

interface CalendarStatsBarProps {
  stats: {
    arrivals: number;
    departures: number;
    inHouse: number;
    available: number;
  } | null;
  isLoading?: boolean;
}

export function CalendarStatsBar({ stats, isLoading }: CalendarStatsBarProps) {
  const items = [
    {
      label: "Today's Arrivals",
      value: stats?.arrivals ?? 0,
      icon: ArrowDownToLine,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Today's Departures",
      value: stats?.departures ?? 0,
      icon: ArrowUpFromLine,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "In-House Guests",
      value: stats?.inHouse ?? 0,
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Available Rooms",
      value: stats?.available ?? 0,
      icon: BedDouble,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
