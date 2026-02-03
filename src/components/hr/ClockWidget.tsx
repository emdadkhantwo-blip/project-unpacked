import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Loader2,
  CheckCircle2,
  Hand
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StaffWithAttendance } from '@/hooks/useAttendance';

interface ClockWidgetProps {
  todayRecord: StaffWithAttendance | null;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  isLoading: boolean;
}

export function ClockWidget({
  todayRecord,
  onClockIn,
  onClockOut,
  onBreakStart,
  onBreakEnd,
  isLoading,
}: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isClockedIn = todayRecord?.status === 'present' || todayRecord?.status === 'on_break';
  const isOnBreak = todayRecord?.status === 'on_break';
  const isClockedOut = todayRecord?.status === 'clocked_out';

  const getStatusBadge = () => {
    if (!todayRecord || todayRecord.status === 'absent') {
      return <Badge variant="secondary">Not Clocked In</Badge>;
    }
    if (todayRecord.status === 'clocked_out') {
      return <Badge variant="outline" className="bg-muted">Clocked Out</Badge>;
    }
    if (todayRecord.status === 'on_break') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">On Break</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Working</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Attendance
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Time Display */}
        <div className="text-center py-3 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold tracking-tight">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Today's Record Summary */}
        {todayRecord?.clock_in && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-green-500" />
              <span>In: {format(new Date(todayRecord.clock_in), 'HH:mm')}</span>
            </div>
            {isClockedOut && todayRecord.worked_hours > 0 && (
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Worked: {todayRecord.worked_hours.toFixed(1)} hrs</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Main Action Buttons */}
        <div className="space-y-3">
          {!isClockedIn && !isClockedOut ? (
            // Not clocked in - show clock in button
            <Button 
              className="w-full h-14 flex-col gap-1"
              onClick={onClockIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              <span className="text-xs">Clock In</span>
            </Button>
          ) : isClockedIn && !isClockedOut ? (
            // Clocked in, not clocked out - show break and clock out options
            <div className="space-y-2">
              {/* Break Buttons */}
              {!isOnBreak ? (
                <Button 
                  variant="secondary"
                  className="w-full h-12 flex-col gap-1"
                  onClick={onBreakStart}
                  disabled={isLoading}
                >
                  <Coffee className="h-4 w-4" />
                  <span className="text-xs">Start Break</span>
                </Button>
              ) : (
                <Button 
                  variant="secondary"
                  className="w-full h-12 flex-col gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400"
                  onClick={onBreakEnd}
                  disabled={isLoading}
                >
                  <Hand className="h-4 w-4" />
                  <span className="text-xs">End Break</span>
                </Button>
              )}

              {/* Clock Out Button */}
              <Button 
                variant="destructive"
                className="w-full h-14 flex-col gap-1"
                onClick={onClockOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                <span className="text-xs">Clock Out</span>
              </Button>
            </div>
          ) : (
            // Already clocked out
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">You've completed your shift for today!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
