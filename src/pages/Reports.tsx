import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Download, TrendingUp, Wallet, Bed, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardMetrics, useOccupancyReport, useRevenueReport, useRoomTypePerformance, useBookingSourceReport } from "@/hooks/useReports";
import { OccupancyChart } from "@/components/reports/OccupancyChart";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { RoomTypePerformanceChart } from "@/components/reports/RoomTypePerformanceChart";
import { BookingSourceChart } from "@/components/reports/BookingSourceChart";
import { MetricsCards } from "@/components/reports/MetricsCards";
import { cn } from "@/lib/utils";

type DatePreset = "7d" | "14d" | "30d" | "mtd" | "custom";

export default function Reports() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handlePresetChange = (value: DatePreset) => {
    setPreset(value);
    const today = new Date();
    
    switch (value) {
      case "7d":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "14d":
        setDateRange({ from: subDays(today, 14), to: today });
        break;
      case "30d":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "mtd":
        setDateRange({ from: startOfMonth(today), to: today });
        break;
    }
  };

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(dateRange);
  const { data: occupancyData, isLoading: occupancyLoading } = useOccupancyReport(dateRange);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport(dateRange);
  const { data: roomTypeData, isLoading: roomTypeLoading } = useRoomTypePerformance(dateRange);
  const { data: sourceData, isLoading: sourceLoading } = useBookingSourceReport(dateRange);

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Performance Reports</h2>
          <p className="text-sm text-muted-foreground">
            Analyze your property's performance metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="mtd">Month to date</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {preset === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <MetricsCards metrics={metrics} isLoading={metricsLoading} />

      {/* Charts */}
      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occupancy" className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Occupancy
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="room-types" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Room Types
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Booking Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Trend</CardTitle>
              <CardDescription>Daily occupancy rate over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <OccupancyChart data={occupancyData || []} isLoading={occupancyLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Daily revenue from room charges and services</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData || []} isLoading={revenueLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="room-types">
          <Card>
            <CardHeader>
              <CardTitle>Room Type Performance</CardTitle>
              <CardDescription>Revenue and average daily rate by room type</CardDescription>
            </CardHeader>
            <CardContent>
              <RoomTypePerformanceChart data={roomTypeData || []} isLoading={roomTypeLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Booking Sources</CardTitle>
              <CardDescription>Reservations and revenue by booking channel</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingSourceChart data={sourceData || []} isLoading={sourceLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
