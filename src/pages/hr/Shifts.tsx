import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CalendarClock, 
  Sun,
  Sunset,
  Moon,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { useShifts, useWeeklySchedule } from '@/hooks/useShifts';
import { CreateShiftDialog } from '@/components/hr/CreateShiftDialog';

const getShiftIcon = (startTime: string) => {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 5 && hour < 14) return Sun;
  if (hour >= 14 && hour < 22) return Sunset;
  return Moon;
};

const HRShifts = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { 
    shifts, 
    isLoading: shiftsLoading, 
    createShift, 
    deleteShift, 
    isCreating,
    isDeleting 
  } = useShifts();
  
  const {
    staffSchedule,
    isLoading: scheduleLoading,
    stats,
    assignShift,
    removeAssignment,
    isAssigning,
    isRemoving,
  } = useWeeklySchedule(weekStart);

  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  const handleCreateShift = (data: {
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    color: string;
  }) => {
    createShift(data);
  };

  const handleAssignShift = (profileId: string, shiftId: string, date: string) => {
    assignShift({ profileId, shiftId, date });
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    removeAssignment(assignmentId);
  };

  const isLoading = shiftsLoading || scheduleLoading;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-cyan/10 to-vibrant-blue/10 border-l-4 border-l-vibrant-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shifts This Week</p>
                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-vibrant-cyan" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Staff Assigned</p>
                <p className="text-2xl font-bold">{stats.staffWithAssignments}</p>
              </div>
              <Users className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overtime Alerts</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shift Templates</p>
                <p className="text-2xl font-bold">{shifts.length}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-vibrant-purple" />
              Shift Templates
            </CardTitle>
            <CreateShiftDialog onCreateShift={handleCreateShift} isCreating={isCreating} />
          </div>
        </CardHeader>
        <CardContent>
          {shiftsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No shift templates yet</p>
              <p className="text-sm">Create your first shift template to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map((shift) => {
                const Icon = getShiftIcon(shift.start_time);
                return (
                  <div 
                    key={shift.id}
                    className="p-4 rounded-lg border-l-4 bg-card hover:bg-muted/50 transition-colors group relative"
                    style={{ borderLeftColor: shift.color || '#3B82F6' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${shift.color}20` }}
                      >
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: shift.color || '#3B82F6' }} 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{shift.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {shift.start_time} - {shift.end_time}
                        </p>
                        {shift.break_minutes && shift.break_minutes > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {shift.break_minutes} min break
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteShift(shift.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-vibrant-blue" />
              Weekly Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : staffSchedule.length === 0 ? (
            <div className="min-h-[200px] border rounded-lg p-4 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No staff members found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground min-w-[200px]">
                      Staff
                    </th>
                    {weekDays.map((day, index) => {
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      return (
                        <th key={index} className="text-center p-2 min-w-[100px]">
                          <div className="font-medium text-sm">{format(day, 'EEE')}</div>
                          <div className={`text-xs ${
                            isToday 
                              ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto' 
                              : 'text-muted-foreground'
                          }`}>
                            {format(day, 'd')}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {staffSchedule.map((staff) => (
                    <tr key={staff.profile_id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staff.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{staff.full_name}</p>
                            <p className="text-xs text-muted-foreground">{staff.position}</p>
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const assignment = staff.assignments[dateStr];
                        
                        return (
                          <td key={dateStr} className="p-1 text-center">
                            {assignment ? (
                              <div 
                                className="relative group rounded px-2 py-1 text-xs font-medium text-white cursor-pointer"
                                style={{ backgroundColor: assignment.shift.color || '#3B82F6' }}
                              >
                                {assignment.shift.name}
                                <button
                                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                  disabled={isRemoving}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 hover:bg-muted"
                                    disabled={shifts.length === 0 || isAssigning}
                                  >
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {shifts.map(shift => (
                                    <DropdownMenuItem
                                      key={shift.id}
                                      onClick={() => handleAssignShift(staff.profile_id, shift.id, dateStr)}
                                    >
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                                      />
                                      {shift.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRShifts;
