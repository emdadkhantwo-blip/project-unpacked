import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3, BedDouble, Wallet, Users, CreditCard, Banknote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/currency';
import type { AuditStatistics } from '@/hooks/useNightAudit';

interface NightAuditStatsProps {
  stats?: AuditStatistics;
  onRefresh: () => void;
}

export function NightAuditStats({ stats, onRefresh }: NightAuditStatsProps) {
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Daily Statistics</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>End of day summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Occupancy Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <BedDouble className="h-4 w-4" />
            Occupancy
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold">{stats?.occupiedRooms || 0}</p>
              <p className="text-xs text-muted-foreground">Occupied</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold">{stats?.vacantRooms || 0}</p>
              <p className="text-xs text-muted-foreground">Vacant</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-center">
              <p className="text-lg font-bold text-primary">
                {formatPercent(stats?.occupancyRate || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Rate</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Guest Movement */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            Guest Movement
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-green-500/10 p-2 text-center">
              <p className="text-lg font-bold text-green-600">{stats?.arrivalsToday || 0}</p>
              <p className="text-xs text-muted-foreground">Arrivals</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2 text-center">
              <p className="text-lg font-bold text-blue-600">{stats?.departuresToday || 0}</p>
              <p className="text-xs text-muted-foreground">Departures</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold">{stats?.stayovers || 0}</p>
              <p className="text-xs text-muted-foreground">Stayovers</p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-2 text-center">
              <p className="text-lg font-bold text-red-600">{stats?.noShows || 0}</p>
              <p className="text-xs text-muted-foreground">No-Shows</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Revenue Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Wallet className="h-4 w-4" />
            Revenue
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Room Revenue</span>
              <span className="font-medium">{formatCurrency(stats?.roomRevenue || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>F&B Revenue</span>
              <span className="font-medium">{formatCurrency(stats?.fbRevenue || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Other Revenue</span>
              <span className="font-medium">{formatCurrency(stats?.otherRevenue || 0)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-medium">
              <span>Total Revenue</span>
              <span className="text-primary">{formatCurrency(stats?.totalRevenue || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Payments</span>
              <span className="text-green-600 font-medium">{formatCurrency(stats?.totalPayments || 0)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-center border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">ADR</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(stats?.adr || 0)}</p>
            <p className="text-[10px] text-muted-foreground">Average Daily Rate</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 text-center border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">RevPAR</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats?.revpar || 0)}</p>
            <p className="text-[10px] text-muted-foreground">Revenue Per Available Room</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
