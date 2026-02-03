import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Clock, 
  LogIn, 
  LogOut,
  Coffee,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
  CalendarDays,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceTable } from '@/components/hr/AttendanceTable';
import { MonthlyAttendanceSheet } from '@/components/hr/MonthlyAttendanceSheet';
import { ClockWidget } from '@/components/hr/ClockWidget';

const HRAttendance = () => {
  const { user, roles } = useAuth();
  const {
    staffAttendance,
    stats,
    isLoading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    markPresent,
    resetAttendance,
    isClockingIn,
    isClockingOut,
    isStartingBreak,
    isEndingBreak,
    isMarkingPresent,
    isResettingAttendance,
  } = useAttendance();

  const isAdmin = roles.includes("owner") || roles.includes("manager");

  // Find current user's attendance
  const myAttendance = staffAttendance.find(s => s.profile_id === user?.id) || null;

  const handleClockIn = () => {
    if (user?.id) {
      clockIn(user.id);
    }
  };

  const handleClockOut = () => {
    if (myAttendance?.attendance_id) {
      clockOut({ attendanceId: myAttendance.attendance_id, profileId: user?.id || "" });
    }
  };

  const handleStartBreak = () => {
    if (myAttendance?.attendance_id) {
      startBreak(myAttendance.attendance_id);
    }
  };

  const handleEndBreak = () => {
    if (myAttendance?.attendance_id) {
      endBreak(myAttendance.attendance_id);
    }
  };

  const handleMarkPresent = (profileId: string) => {
    markPresent({ profileId });
  };

  const handleAdminClockOut = (attendanceId: string, profileId: string) => {
    clockOut({ attendanceId, profileId });
  };

  const handleResetAttendance = () => {
    resetAttendance();
  };

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <Tabs defaultValue="daily" className="w-full min-w-0">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Attendance
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Monthly Sheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present Today</p>
                    <p className="text-2xl font-bold">{stats.present}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-vibrant-green" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold">{stats.absent}</p>
                  </div>
                  <UserX className="h-8 w-8 text-vibrant-rose" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late Arrivals</p>
                    <p className="text-2xl font-bold">{stats.late}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-vibrant-amber" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">On Break</p>
                    <p className="text-2xl font-bold">{stats.onBreak}</p>
                  </div>
                  <Coffee className="h-8 w-8 text-vibrant-blue" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clock Widget */}
          <ClockWidget
            todayRecord={myAttendance}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onBreakStart={handleStartBreak}
            onBreakEnd={handleEndBreak}
            isLoading={isClockingIn || isClockingOut || isStartingBreak || isEndingBreak}
          />

          {/* Today's Attendance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-vibrant-blue" />
                Today's Attendance
              </CardTitle>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isResettingAttendance}>
                      {isResettingAttendance ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reset All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Today's Attendance</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all attendance records for today, including clock-in/out times and break records for all staff members. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetAttendance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Reset All Attendance
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AttendanceTable
                  staff={staffAttendance}
                  isAdmin={isAdmin}
                  onMarkPresent={handleMarkPresent}
                  onClockOut={handleAdminClockOut}
                  isMarkingPresent={isMarkingPresent}
                  isClockingOut={isClockingOut}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 min-w-0 overflow-hidden">
          <MonthlyAttendanceSheet />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRAttendance;
