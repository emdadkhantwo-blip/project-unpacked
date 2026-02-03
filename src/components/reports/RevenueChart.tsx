import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueData } from "@/hooks/useReports";

interface RevenueChartProps {
  data: RevenueData[];
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No revenue data available for the selected period
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `৳${value}`}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`৳${value.toLocaleString()}`, undefined]}
          />
          <Legend />
          <Bar
            dataKey="roomCharges"
            name="Room Charges"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="services"
            name="Services"
            fill="hsl(var(--chart-2))"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
