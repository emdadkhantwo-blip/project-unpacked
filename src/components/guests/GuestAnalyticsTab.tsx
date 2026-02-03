import { format, parseISO } from "date-fns";
import {
  TrendingUp,
  Calendar,
  Clock,
  Home,
  Globe,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { GuestAnalytics } from "@/hooks/useGuestAnalytics";

interface GuestAnalyticsTabProps {
  analytics: GuestAnalytics | null | undefined;
  isLoading: boolean;
}

export function GuestAnalyticsTab({ analytics, isLoading }: GuestAnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Weekly/Regular":
        return "bg-success/10 text-success border-success/30";
      case "Monthly":
        return "bg-primary/10 text-primary border-primary/30";
      case "Quarterly":
        return "bg-warning/10 text-warning border-warning/30";
      case "Annual":
        return "bg-muted text-muted-foreground";
      case "One-time":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatSource = (source: string | null) => {
    if (!source) return "N/A";
    return source
      .replace(/_/g, " ")
      .replace(/ota /g, "OTA: ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Spend/Stay</p>
                <p className="text-lg font-bold">৳{analytics.averageSpendPerStay.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-success/10">
                <Clock className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Stay Length</p>
                <p className="text-lg font-bold">{analytics.averageLengthOfStay.toFixed(1)} nights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-warning/10">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Nights</p>
                <p className="text-lg font-bold">{analytics.totalNights}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancel Rate</p>
                <p className="text-lg font-bold">{analytics.cancellationRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stay Frequency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Guest Loyalty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stay Frequency</span>
            <Badge variant="outline" className={getFrequencyColor(analytics.stayFrequency)}>
              {analytics.stayFrequency}
            </Badge>
          </div>
          {analytics.firstStay && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">First Stay</span>
              <span>{format(parseISO(analytics.firstStay), "MMM d, yyyy")}</span>
            </div>
          )}
          {analytics.lastStay && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Stay</span>
              <span>{format(parseISO(analytics.lastStay), "MMM d, yyyy")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Booking Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Preferred Room Type</span>
            </div>
            <span className="font-medium">{analytics.mostBookedRoomType || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Booking Channel</span>
            </div>
            <span className="font-medium">{formatSource(analytics.preferredBookingSource)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart (simplified bar representation) */}
      {analytics.revenueByMonth.some((m) => m.revenue > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {analytics.revenueByMonth.map((month, idx) => {
                const maxRevenue = Math.max(...analytics.revenueByMonth.map((m) => m.revenue));
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors relative group"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${month.month}: ৳${month.revenue.toLocaleString()}`}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded px-1 py-0.5 text-[10px] whitespace-nowrap z-10">
                      ৳{month.revenue.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>{analytics.revenueByMonth[0]?.month}</span>
              <span>{analytics.revenueByMonth[11]?.month}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stays by Year */}
      {analytics.staysByYear.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stays by Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.staysByYear.map((yearData) => {
              const maxCount = Math.max(...analytics.staysByYear.map((y) => y.count));
              const percentage = (yearData.count / maxCount) * 100;
              return (
                <div key={yearData.year} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{yearData.year}</span>
                    <span className="font-medium">{yearData.count} stays</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
