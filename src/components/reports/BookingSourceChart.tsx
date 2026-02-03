import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BookingSourceData } from "@/hooks/useReports";

interface BookingSourceChartProps {
  data: BookingSourceData[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(30 80% 55%)",
];

export function BookingSourceChart({ data, isLoading }: BookingSourceChartProps) {
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No booking source data available for the selected period
      </div>
    );
  }

  const totalBookings = data.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="source"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                `${value} bookings (${((value / totalBookings) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Bookings</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">% of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data
            .sort((a, b) => b.count - a.count)
            .map((source, index) => (
              <TableRow key={source.source}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {source.source}
                  </div>
                </TableCell>
                <TableCell className="text-right">{source.count}</TableCell>
                <TableCell className="text-right">৳{source.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {((source.count / totalBookings) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{totalBookings}</TableCell>
            <TableCell className="text-right">৳{totalRevenue.toLocaleString()}</TableCell>
            <TableCell className="text-right">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
