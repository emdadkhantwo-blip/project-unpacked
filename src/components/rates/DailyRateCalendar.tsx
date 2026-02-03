import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  getDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import type { RoomTypeWithRates } from '@/hooks/useDailyRates';
import { useDailyRates } from '@/hooks/useDailyRates';

interface DailyRateCalendarProps {
  ratesByRoomType: RoomTypeWithRates[];
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  isLoading?: boolean;
}

export default function DailyRateCalendar({ 
  ratesByRoomType, 
  calendarMonth, 
  onMonthChange,
  isLoading 
}: DailyRateCalendarProps) {
  const [editingCell, setEditingCell] = useState<{ roomTypeId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const startDate = startOfMonth(calendarMonth);
  const endDate = endOfMonth(addMonths(calendarMonth, 1));
  const { setDailyRate } = useDailyRates(startDate, endDate);

  const month1Days = eachDayOfInterval({
    start: startOfMonth(calendarMonth),
    end: endOfMonth(calendarMonth),
  });

  const month2 = addMonths(calendarMonth, 1);
  const month2Days = eachDayOfInterval({
    start: startOfMonth(month2),
    end: endOfMonth(month2),
  });

  const startEdit = (roomTypeId: string, date: string, currentRate: number) => {
    setEditingCell({ roomTypeId, date });
    setEditValue(currentRate.toString());
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    const rate = parseFloat(editValue);
    if (!isNaN(rate) && rate > 0) {
      await setDailyRate.mutateAsync({
        room_type_id: editingCell.roomTypeId,
        date: editingCell.date,
        rate,
        is_manual_override: true,
      });
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const renderDayCell = (day: Date, roomType: RoomTypeWithRates) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const rate = roomType.rates[dateStr] ?? roomType.base_rate;
    const isOverride = roomType.overrides[dateStr] ?? false;
    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
    const isEditing = editingCell?.roomTypeId === roomType.id && editingCell?.date === dateStr;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 w-16 text-xs px-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={saveEdit}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full h-full text-xs font-medium px-1 py-0.5 rounded transition-colors',
              'hover:bg-primary/10',
              isOverride && 'bg-amber-50 text-amber-700 border border-amber-200',
              isWeekend && !isOverride && 'bg-blue-50 text-blue-700',
              isToday(day) && 'ring-1 ring-primary'
            )}
          >
            {formatCurrency(rate, false)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="center">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {format(day, 'EEE, MMM d')}
            </div>
            <div className="text-xs text-muted-foreground">
              {roomType.name}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rate:</span>
              <span className="font-semibold">{formatCurrency(rate)}</span>
            </div>
            {isOverride && (
              <div className="text-xs text-amber-600">
                ⚠️ Manual override
              </div>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => startEdit(roomType.id, dateStr, rate)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit Rate
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderMonthGrid = (days: Date[], monthDate: Date) => (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-center py-2 bg-muted/50 rounded">
        {format(monthDate, 'MMMM yyyy')}
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {/* Empty cells for days before the 1st */}
        {Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => (
          <div 
            key={day.toISOString()} 
            className={cn(
              'text-xs py-1',
              isToday(day) && 'font-bold text-primary'
            )}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>

      {/* Rate rows per room type */}
      {ratesByRoomType.map((roomType) => (
        <div key={roomType.id} className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground truncate px-1">
            {roomType.name} (Base: {formatCurrency(roomType.base_rate)})
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: getDay(days[0]) }).map((_, i) => (
              <div key={`empty-${roomType.id}-${i}`} />
            ))}
            {days.map((day) => (
              <div key={day.toISOString()} className="h-6">
                {renderDayCell(day, roomType)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (ratesByRoomType.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No room types configured. Add room types to see the price calendar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Price Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(subMonths(calendarMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(calendarMonth, 'MMM yyyy')} - {format(month2, 'MMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(addMonths(calendarMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded" />
            <span>Manual Override</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-primary rounded" />
            <span>Today</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {renderMonthGrid(month1Days, calendarMonth)}
          {renderMonthGrid(month2Days, month2)}
        </div>
      </CardContent>
    </Card>
  );
}
