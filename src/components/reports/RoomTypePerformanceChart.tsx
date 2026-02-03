import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RoomTypePerformance } from "@/hooks/useReports";

interface RoomTypePerformanceChartProps {
  data: RoomTypePerformance[];
  isLoading: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function RoomTypePerformanceChart({ data, isLoading }: RoomTypePerformanceChartProps) {
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No room type data available for the selected period
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `৳${value.toLocaleString()}`}
              className="text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`৳${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Type</TableHead>
            <TableHead className="text-right">Room Nights</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">ADR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((rt) => (
            <TableRow key={rt.code}>
              <TableCell className="font-medium">{rt.name}</TableCell>
              <TableCell className="text-right">{rt.nights}</TableCell>
              <TableCell className="text-right">৳{rt.revenue.toLocaleString()}</TableCell>
              <TableCell className="text-right">৳{rt.adr}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
