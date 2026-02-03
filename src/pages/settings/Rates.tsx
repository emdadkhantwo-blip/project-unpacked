import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, DollarSign, Package, TrendingUp } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { useRatePeriods } from '@/hooks/useRatePeriods';
import { usePackages } from '@/hooks/usePackages';
import { useDailyRates } from '@/hooks/useDailyRates';
import { useRoomTypes } from '@/hooks/useRoomTypes';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import RatePeriodsList from '@/components/rates/RatePeriodsList';
import CreateRatePeriodDialog from '@/components/rates/CreateRatePeriodDialog';
import PackagesList from '@/components/rates/PackagesList';
import CreatePackageDialog from '@/components/rates/CreatePackageDialog';
import DailyRateCalendar from '@/components/rates/DailyRateCalendar';
import { formatCurrency } from '@/lib/currency';

export default function RatesPage() {
  const { currentProperty } = useTenant();
  const { ratePeriods, isLoading: ratesLoading } = useRatePeriods();
  const { packages, isLoading: packagesLoading } = usePackages();
  const roomTypesQuery = useRoomTypes();
  const roomTypes = roomTypesQuery.data || [];
  
  const [activeTab, setActiveTab] = useState('periods');
  const [createRateDialogOpen, setCreateRateDialogOpen] = useState(false);
  const [createPackageDialogOpen, setCreatePackageDialogOpen] = useState(false);
  
  // For calendar view - current month and next month
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarStart = startOfMonth(calendarMonth);
  const calendarEnd = endOfMonth(addMonths(calendarMonth, 1));
  
  const { ratesByRoomType, calculateRatesForPeriod, isLoading: calendarLoading } = useDailyRates(calendarStart, calendarEnd);

  const activeRatePeriods = ratePeriods.filter(rp => rp.is_active).length;
  const activePackages = packages.filter(p => p.is_active).length;
  
  // Calculate average rate from room types
  const avgBaseRate = roomTypes.length > 0
    ? roomTypes.reduce((sum, rt) => sum + rt.base_rate, 0) / roomTypes.length
    : 0;

  const isLoading = ratesLoading || packagesLoading || roomTypesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rates & Packages</h1>
          <p className="text-muted-foreground">
            Manage dynamic pricing rules and packages for {currentProperty?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'periods' && (
            <Button onClick={() => setCreateRateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate Period
            </Button>
          )}
          {activeTab === 'packages' && (
            <Button onClick={() => setCreatePackageDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          )}
          {activeTab === 'calendar' && (
            <Button 
              variant="outline"
              onClick={() => calculateRatesForPeriod.mutate({ startDate: calendarStart, endDate: calendarEnd })}
              disabled={calculateRatesForPeriod.isPending}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {calculateRatesForPeriod.isPending ? 'Calculating...' : 'Recalculate Rates'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Types</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Avg. base rate: {formatCurrency(avgBaseRate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Periods</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRatePeriods}</div>
            <p className="text-xs text-muted-foreground">
              {ratePeriods.length} total ({ratePeriods.length - activeRatePeriods} inactive)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePackages}</div>
            <p className="text-xs text-muted-foreground">
              {packages.length} total ({packages.length - activePackages} inactive)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Range</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roomTypes.length > 0 ? (
                <>
                  {formatCurrency(Math.min(...roomTypes.map(rt => rt.base_rate)))} - {formatCurrency(Math.max(...roomTypes.map(rt => rt.base_rate)))}
                </>
              ) : (
                'N/A'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Base rate range
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rate Periods
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <RatePeriodsList ratePeriods={ratePeriods} roomTypes={roomTypes} />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <PackagesList packages={packages} roomTypes={roomTypes} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <DailyRateCalendar 
            ratesByRoomType={ratesByRoomType}
            calendarMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            isLoading={calendarLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRatePeriodDialog
        open={createRateDialogOpen}
        onOpenChange={setCreateRateDialogOpen}
        roomTypes={roomTypes}
      />
      <CreatePackageDialog
        open={createPackageDialogOpen}
        onOpenChange={setCreatePackageDialogOpen}
        roomTypes={roomTypes}
      />
    </div>
  );
}
