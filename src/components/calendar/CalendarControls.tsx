import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCw } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarControlsProps {
  startDate: Date;
  numDays: number;
  onStartDateChange: (date: Date) => void;
  onNumDaysChange: (days: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CalendarControls({
  startDate,
  numDays,
  onStartDateChange,
  onNumDaysChange,
  onRefresh,
  isRefreshing,
}: CalendarControlsProps) {
  const endDate = addDays(startDate, numDays - 1);

  const goToPrevious = () => {
    onStartDateChange(startOfDay(subDays(startDate, numDays)));
  };

  const goToNext = () => {
    onStartDateChange(startOfDay(addDays(startDate, numDays)));
  };

  const goToToday = () => {
    onStartDateChange(startOfDay(new Date()));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Range Display */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-start gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => date && onStartDateChange(startOfDay(date))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Days Range Selector */}
      <Select
        value={numDays.toString()}
        onValueChange={(value) => onNumDaysChange(parseInt(value, 10))}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="7">7 Days</SelectItem>
          <SelectItem value="14">14 Days</SelectItem>
          <SelectItem value="21">21 Days</SelectItem>
          <SelectItem value="30">30 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}
