import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Calendar, 
  Pencil, 
  Trash2, 
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { useRatePeriods, type RatePeriod, type RatePeriodType } from '@/hooks/useRatePeriods';
import { formatCurrency } from '@/lib/currency';
import type { RoomType } from '@/hooks/useRoomTypes';

interface RatePeriodsListProps {
  ratePeriods: RatePeriod[];
  roomTypes: RoomType[];
}

const rateTypeLabels: Record<RatePeriodType, { label: string; color: string }> = {
  weekend: { label: 'Weekend', color: 'bg-purple-100 text-purple-800' },
  seasonal: { label: 'Seasonal', color: 'bg-blue-100 text-blue-800' },
  event: { label: 'Event', color: 'bg-amber-100 text-amber-800' },
  last_minute: { label: 'Last Minute', color: 'bg-green-100 text-green-800' },
  holiday: { label: 'Holiday', color: 'bg-red-100 text-red-800' },
};

const dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RatePeriodsList({ ratePeriods, roomTypes }: RatePeriodsListProps) {
  const { toggleRatePeriod, deleteRatePeriod } = useRatePeriods();

  const getRoomTypeName = (id: string | null) => {
    if (!id) return 'All Room Types';
    const rt = roomTypes.find(r => r.id === id);
    return rt?.name || 'Unknown';
  };

  const formatAdjustment = (period: RatePeriod) => {
    const isPositive = period.amount >= 0;
    const Icon = period.adjustment_type === 'override' 
      ? ArrowUpDown 
      : isPositive ? TrendingUp : TrendingDown;
    
    let text = '';
    switch (period.adjustment_type) {
      case 'override':
        text = formatCurrency(period.amount);
        break;
      case 'fixed':
        text = `${isPositive ? '+' : ''}${formatCurrency(period.amount)}`;
        break;
      case 'percentage':
        text = `${isPositive ? '+' : ''}${period.amount}%`;
        break;
    }

    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>{text}</span>
      </div>
    );
  };

  const formatDateRange = (period: RatePeriod) => {
    if (period.days_of_week && period.days_of_week.length > 0) {
      return period.days_of_week.map(d => dayOfWeekLabels[d]).join(', ');
    }
    if (period.start_date && period.end_date) {
      return `${format(new Date(period.start_date), 'MMM d, yyyy')} - ${format(new Date(period.end_date), 'MMM d, yyyy')}`;
    }
    return 'Always active';
  };

  if (ratePeriods.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Rate Periods</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create rate periods to define dynamic pricing rules like weekend rates, seasonal pricing, or special event rates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ratePeriods.map((period) => (
        <Card key={period.id} className={!period.is_active ? 'opacity-60' : ''}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">{period.name}</CardTitle>
              <CardDescription className="text-sm">
                {getRoomTypeName(period.room_type_id)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={period.is_active}
                onCheckedChange={(checked) => toggleRatePeriod.mutate()}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => deleteRatePeriod.mutate()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={rateTypeLabels[period.rate_type].color}>
                {rateTypeLabels[period.rate_type].label}
              </Badge>
              <Badge variant="outline">Priority: {period.priority}</Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Adjustment:</span>
              {formatAdjustment(period)}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{formatDateRange(period)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
