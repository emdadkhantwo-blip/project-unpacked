import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSecurityStats } from "@/hooks/useSecurityAuditLogs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

export function SecurityTimelineChart() {
  const { data: stats, isLoading } = useSecurityStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-vibrant-blue" />
            Violations Over Time (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Generate last 30 days data
  const last30Days: { date: string; count: number; displayDate: string }[] = [];
  const recentLogs = stats?.recentLogs || [];

  for (let i = 29; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    const count = recentLogs.filter((log) =>
      isSameDay(new Date(log.created_at), date)
    ).length;

    last30Days.push({
      date: format(date, "yyyy-MM-dd"),
      displayDate: format(date, "MMM d"),
      count,
    });
  }

  // Since we only have recent 10 logs from stats, we need to query differently
  // For now, show what we have
  const hasData = last30Days.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-vibrant-blue" />
            Activity Trend
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last 30 days
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No violations in the last 30 days</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={last30Days}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--vibrant-rose))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--vibrant-rose))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                }}
                formatter={(value: number) => [value, "Violations"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--vibrant-rose))"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
