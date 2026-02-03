import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import { StaffWithAttendance } from "@/hooks/useAttendance";

interface AttendanceTableProps {
  staff: StaffWithAttendance[];
  isAdmin: boolean;
  onMarkPresent: (profileId: string) => void;
  onClockOut: (attendanceId: string, profileId: string) => void;
  isMarkingPresent: boolean;
  isClockingOut: boolean;
}

export function AttendanceTable({
  staff,
  isAdmin,
  onMarkPresent,
  onClockOut,
  isMarkingPresent,
  isClockingOut,
}: AttendanceTableProps) {
  const getStatusBadge = (status: StaffWithAttendance["status"], isLate: boolean) => {
    if (status === "absent") {
      return <Badge variant="destructive">Absent</Badge>;
    }
    if (status === "on_break") {
      return <Badge className="bg-vibrant-amber text-white">On Break</Badge>;
    }
    if (status === "clocked_out") {
      return <Badge variant="secondary">Left</Badge>;
    }
    if (isLate) {
      return <Badge className="bg-vibrant-orange text-white">Late</Badge>;
    }
    return <Badge className="bg-vibrant-green text-white">Present</Badge>;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--:--";
    return format(new Date(dateStr), "HH:mm");
  };

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No staff found</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Add staff members to track their attendance.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Status</TableHead>
          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.profile_id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{member.full_name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{member.position}</Badge>
            </TableCell>
            <TableCell className="font-mono">{formatTime(member.clock_in)}</TableCell>
            <TableCell className="font-mono">{formatTime(member.clock_out)}</TableCell>
            <TableCell>{getStatusBadge(member.status, member.is_late)}</TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                {member.status === "absent" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkPresent(member.profile_id)}
                    disabled={isMarkingPresent}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Mark Present
                  </Button>
                )}
                {member.status === "present" && member.attendance_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onClockOut(member.attendance_id!, member.profile_id)}
                    disabled={isClockingOut}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Clock Out
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
