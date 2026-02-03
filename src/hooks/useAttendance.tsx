import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface StaffWithAttendance {
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  position: string;
  attendance_id: string | null;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  is_late: boolean;
  worked_hours: number;
  status: "absent" | "present" | "on_break" | "clocked_out";
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  onBreak: number;
}

const ROLE_POSITION_MAP: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
  accountant: "Accountant",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  kitchen: "Kitchen Staff",
  waiter: "Waiter/Server",
  night_auditor: "Night Auditor",
};

export function useAttendance(date?: Date) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  // Fetch all staff with their attendance for the target date
  const staffAttendanceQuery = useQuery({
    queryKey: ["attendance", tenant?.id, dateStr],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get all profiles in the tenant with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url
        `)
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (profilesError) throw profilesError;

      // Get roles for each profile
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profiles?.map(p => p.id) || []);

      if (rolesError) throw rolesError;

      // Get attendance records for the target date
      const { data: attendance, error: attendanceError } = await supabase
        .from("hr_attendance")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("date", dateStr);

      if (attendanceError) throw attendanceError;

      // Combine the data
      const staffList: StaffWithAttendance[] = (profiles || []).map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.id) || [];
        const primaryRole = userRoles[0]?.role || "staff";
        const attendanceRecord = attendance?.find(a => a.profile_id === profile.id);

        let status: StaffWithAttendance["status"] = "absent";
        if (attendanceRecord?.clock_in) {
          if (attendanceRecord.clock_out) {
            status = "clocked_out";
          } else if (attendanceRecord.break_start && !attendanceRecord.break_end) {
            status = "on_break";
          } else {
            status = "present";
          }
        }

        return {
          profile_id: profile.id,
          full_name: profile.full_name || "Unknown",
          avatar_url: profile.avatar_url,
          role: primaryRole,
          position: ROLE_POSITION_MAP[primaryRole] || "Staff",
          attendance_id: attendanceRecord?.id || null,
          clock_in: attendanceRecord?.clock_in || null,
          clock_out: attendanceRecord?.clock_out || null,
          break_start: attendanceRecord?.break_start || null,
          break_end: attendanceRecord?.break_end || null,
          is_late: attendanceRecord?.is_late || false,
          worked_hours: attendanceRecord?.worked_hours || 0,
          status,
        };
      });

      // Filter out superadmins
      return staffList.filter(s => s.role !== "superadmin");
    },
    enabled: !!tenant?.id,
  });

  // Calculate stats
  const stats: AttendanceStats = {
    present: staffAttendanceQuery.data?.filter(s => s.status === "present").length || 0,
    absent: staffAttendanceQuery.data?.filter(s => s.status === "absent").length || 0,
    late: staffAttendanceQuery.data?.filter(s => s.is_late).length || 0,
    onBreak: staffAttendanceQuery.data?.filter(s => s.status === "on_break").length || 0,
  };

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (profileId: string) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_attendance")
        .insert({
          tenant_id: tenant.id,
          profile_id: profileId,
          date: dateStr,
          clock_in: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Clocked In",
        description: "Attendance recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async ({ attendanceId, profileId }: { attendanceId: string; profileId: string }) => {
      const clockOut = new Date().toISOString();
      
      // Get clock in time to calculate worked hours
      const { data: existing } = await supabase
        .from("hr_attendance")
        .select("clock_in, break_start, break_end")
        .eq("id", attendanceId)
        .single();

      let workedHours = 0;
      if (existing?.clock_in) {
        const clockIn = new Date(existing.clock_in);
        const clockOutTime = new Date(clockOut);
        workedHours = (clockOutTime.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        
        // Subtract break time if applicable
        if (existing.break_start && existing.break_end) {
          const breakStart = new Date(existing.break_start);
          const breakEnd = new Date(existing.break_end);
          const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
          workedHours -= breakHours;
        }
      }

      const { data, error } = await supabase
        .from("hr_attendance")
        .update({
          clock_out: clockOut,
          worked_hours: Math.max(0, workedHours),
        })
        .eq("id", attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Clocked Out",
        description: "Attendance updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from("hr_attendance")
        .update({
          break_start: new Date().toISOString(),
        })
        .eq("id", attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Break Started",
        description: "Break time recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from("hr_attendance")
        .update({
          break_end: new Date().toISOString(),
        })
        .eq("id", attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Break Ended",
        description: "Welcome back!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark present (admin override) mutation
  const markPresentMutation = useMutation({
    mutationFn: async ({ profileId, clockInTime }: { profileId: string; clockInTime?: string }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_attendance")
        .insert({
          tenant_id: tenant.id,
          profile_id: profileId,
          date: dateStr,
          clock_in: clockInTime || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Marked Present",
        description: "Staff attendance has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset all attendance for today
  const resetAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("No tenant");

      const { error } = await supabase
        .from("hr_attendance")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("date", dateStr);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", tenant?.id, dateStr] });
      toast({
        title: "Attendance Reset",
        description: "All attendance records for today have been cleared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    staffAttendance: staffAttendanceQuery.data || [],
    stats,
    isLoading: staffAttendanceQuery.isLoading,
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    startBreak: startBreakMutation.mutate,
    endBreak: endBreakMutation.mutate,
    markPresent: markPresentMutation.mutate,
    resetAttendance: resetAttendanceMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
    isStartingBreak: startBreakMutation.isPending,
    isEndingBreak: endBreakMutation.isPending,
    isMarkingPresent: markPresentMutation.isPending,
    isResettingAttendance: resetAttendanceMutation.isPending,
  };
}
