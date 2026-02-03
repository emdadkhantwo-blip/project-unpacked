import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isWeekend,
  isFuture
} from "date-fns";

const ROLE_POSITION_MAP: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
  accountant: "Accountant",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  kitchen: "Kitchen",
  waiter: "Waiter",
  night_auditor: "Night Auditor",
};

export type AttendanceStatus = "present" | "absent" | "late" | "weekend" | "future";

export interface StaffMonthlyData {
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  position: string;
  attendance: Record<string, AttendanceStatus>;
  summary: {
    present: number;
    absent: number;
    late: number;
    totalWorkDays: number;
  };
}

export interface MonthlyAttendanceData {
  staff: StaffMonthlyData[];
  daysInMonth: Date[];
  isLoading: boolean;
}

export function useMonthlyAttendance(selectedMonth: Date): MonthlyAttendanceData {
  const { tenant } = useTenant();

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const startStr = format(monthStart, "yyyy-MM-dd");
  const endStr = format(monthEnd, "yyyy-MM-dd");

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch all staff with their roles
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["monthly-staff", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profiles?.map(p => p.id) || []);

      if (rolesError) throw rolesError;

      const roleMap = new Map<string, string>();
      roles?.forEach(r => {
        if (!roleMap.has(r.user_id) || r.role === "owner" || r.role === "manager") {
          roleMap.set(r.user_id, r.role);
        }
      });

      return profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.id) || "staff",
      })) || [];
    },
    enabled: !!tenant?.id,
  });

  // Fetch attendance records for the month
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["monthly-attendance", tenant?.id, startStr, endStr],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("hr_attendance")
        .select("profile_id, date, clock_in, clock_out, is_late")
        .eq("tenant_id", tenant.id)
        .gte("date", startStr)
        .lte("date", endStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Process and aggregate data
  const staff: StaffMonthlyData[] = (staffData || []).map(s => {
    const attendance: Record<string, AttendanceStatus> = {};
    let present = 0;
    let absent = 0;
    let late = 0;
    let totalWorkDays = 0;

    daysInMonth.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      
      if (isFuture(day)) {
        attendance[dateStr] = "future";
        return;
      }
      
      if (isWeekend(day)) {
        attendance[dateStr] = "weekend";
        return;
      }

      totalWorkDays++;
      
      const record = attendanceData?.find(
        a => a.profile_id === s.id && a.date === dateStr
      );

      if (record?.clock_in) {
        if (record.is_late) {
          attendance[dateStr] = "late";
          late++;
          present++; // Late counts as present
        } else {
          attendance[dateStr] = "present";
          present++;
        }
      } else {
        attendance[dateStr] = "absent";
        absent++;
      }
    });

    return {
      profile_id: s.id,
      full_name: s.full_name || "Unknown",
      avatar_url: s.avatar_url,
      position: ROLE_POSITION_MAP[s.role] || "Staff",
      attendance,
      summary: {
        present,
        absent,
        late,
        totalWorkDays,
      },
    };
  });

  return {
    staff,
    daysInMonth,
    isLoading: staffLoading || attendanceLoading,
  };
}
