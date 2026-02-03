import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSecurityStats } from "@/hooks/useSecurityAuditLogs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Activity } from "lucide-react";

const COLORS = [
  "hsl(var(--vibrant-purple))",
  "hsl(var(--vibrant-rose))",
  "hsl(var(--vibrant-amber))",
  "hsl(var(--vibrant-blue))",
  "hsl(var(--vibrant-green))",
  "hsl(var(--vibrant-cyan))",
];

export function SecurityActionChart() {
  const { data: stats, isLoading } = useSecurityStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-vibrant-purple" />
            Violations by Action Type
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const actionCounts = stats?.actionCounts || {};
  const chartData = Object.entries(actionCounts).map(([name, value]) => ({
    name: name
      .replace(/_/g, " ")
      .replace(/cross tenant/i, "Cross-Tenant")
      .replace(/rls bypass/i, "RLS Bypass"),
    value,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-vibrant-purple" />
            Violations by Action Type
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <Activity className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-vibrant-purple" />
          Violations by Action Type
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
