import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NightAudit } from '@/hooks/useNightAudit';
import { formatCurrency } from '@/lib/currency';

interface NightAuditTrendChartsProps {
  audits: NightAudit[];
}

export function NightAuditTrendCharts({ audits }: NightAuditTrendChartsProps) {
  // Get last 7 completed audits in chronological order
  const chartData = audits
    .filter(a => a.status === 'completed')
    .slice(0, 7)
    .reverse()
    .map(audit => ({
      date: format(parseISO(audit.business_date), 'MMM d'),
      occupancy: Number(audit.occupancy_rate.toFixed(1)),
      roomRevenue: audit.total_room_revenue,
      fbRevenue: audit.total_fb_revenue,
      totalRevenue: audit.total_room_revenue + audit.total_fb_revenue + audit.total_other_revenue,
      adr: audit.adr,
      revpar: audit.revpar,
    }));

  // Calculate week-over-week changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const latestAudit = chartData[chartData.length - 1];
  const previousAudit = chartData[chartData.length - 2];

  const occupancyChange = previousAudit ? calculateChange(latestAudit?.occupancy || 0, previousAudit.occupancy) : 0;
  const revenueChange = previousAudit ? calculateChange(latestAudit?.totalRevenue || 0, previousAudit.totalRevenue) : 0;

  const getTrendIcon = (change: number) => {
    if (Math.abs(change) < 0.5) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (change: number) => {
    if (Math.abs(change) < 0.5) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Trends</CardTitle>
          <CardDescription>At least 2 completed audits required for trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Not enough data for trend analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Occupancy Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Occupancy Trend</CardTitle>
              <CardDescription>7-day occupancy rate</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(occupancyChange)}
              <span className={`text-sm font-medium ${getTrendColor(occupancyChange)}`}>
                {occupancyChange >= 0 ? '+' : ''}{occupancyChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Occupancy']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <CardDescription>7-day revenue breakdown</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(revenueChange)}
              <span className={`text-sm font-medium ${getTrendColor(revenueChange)}`}>
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === 'roomRevenue' ? 'Room' : 'F&B']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="roomRevenue" name="Room" fill="hsl(var(--primary))" stackId="revenue" />
              <Bar dataKey="fbRevenue" name="F&B" fill="hsl(var(--chart-2))" stackId="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* KPI Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">KPI Comparison</CardTitle>
          <CardDescription>ADR and RevPAR over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis tickFormatter={(v) => `৳${v.toFixed(0)}`} className="text-xs" />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="adr"
                name="ADR"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
              <Line
                type="monotone"
                dataKey="revpar"
                name="RevPAR"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
