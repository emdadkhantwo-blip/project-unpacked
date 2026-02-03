import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay, startOfWeek, endOfWeek } from "date-fns";

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  color: string | null;
  is_active: boolean;
  property_id: string | null;
}

export interface ShiftAssignment {
  id: string;
  profile_id: string;
  shift_id: string;
  date: string;
  status: string;
  notes: string | null;
  shift?: Shift;
}

export interface StaffWithShifts {
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  position: string;
  assignments: { [date: string]: ShiftAssignment & { shift: Shift } };
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

export function useShifts(propertyId?: string) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shiftsQuery = useQuery({
    queryKey: ["shifts", tenant?.id, propertyId],
    queryFn: async () => {
      if (!tenant?.id) return [];

      let query = supabase
        .from("hr_shifts")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("start_time");

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Shift[];
    },
    enabled: !!tenant?.id,
  });

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
      color: string;
    }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data: shift, error } = await supabase
        .from("hr_shifts")
        .insert({
          tenant_id: tenant.id,
          name: data.name,
          start_time: data.startTime,
          end_time: data.endTime,
          break_minutes: data.breakMinutes,
          color: data.color,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", tenant?.id] });
      toast({
        title: "Shift Created",
        description: "New shift template has been created.",
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

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from("hr_shifts")
        .update({ is_active: false })
        .eq("id", shiftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", tenant?.id] });
      toast({
        title: "Shift Deleted",
        description: "Shift template has been removed.",
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
    shifts: shiftsQuery.data || [],
    isLoading: shiftsQuery.isLoading,
    createShift: createShiftMutation.mutate,
    deleteShift: deleteShiftMutation.mutate,
    isCreating: createShiftMutation.isPending,
    isDeleting: deleteShiftMutation.isPending,
  };
}

export function useWeeklySchedule(weekStart: Date) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startDate = format(startOfWeek(weekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const endDate = format(endOfWeek(weekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const scheduleQuery = useQuery({
    queryKey: ["weekly-schedule", tenant?.id, startDate],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Get all profiles in the tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);

      if (profilesError) throw profilesError;

      // Get roles for each profile
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", profiles?.map(p => p.id) || []);

      if (rolesError) throw rolesError;

      // Get shift assignments for the week
      const { data: assignments, error: assignmentsError } = await supabase
        .from("hr_shift_assignments")
        .select(`
          *,
          shift:hr_shifts(*)
        `)
        .eq("tenant_id", tenant.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (assignmentsError) throw assignmentsError;

      // Combine data
      const staffList: StaffWithShifts[] = (profiles || [])
        .map(profile => {
          const userRoles = roles?.filter(r => r.user_id === profile.id) || [];
          const primaryRole = userRoles[0]?.role || "staff";
          
          const staffAssignments: { [date: string]: ShiftAssignment & { shift: Shift } } = {};
          assignments
            ?.filter(a => a.profile_id === profile.id && a.shift)
            .forEach(a => {
              staffAssignments[a.date] = a as ShiftAssignment & { shift: Shift };
            });

          return {
            profile_id: profile.id,
            full_name: profile.full_name || "Unknown",
            avatar_url: profile.avatar_url,
            role: primaryRole,
            position: ROLE_POSITION_MAP[primaryRole] || "Staff",
            assignments: staffAssignments,
          };
        })
        .filter(s => s.role !== "superadmin");

      return staffList;
    },
    enabled: !!tenant?.id,
  });

  // Count stats
  const totalAssignments = scheduleQuery.data?.reduce(
    (sum, staff) => sum + Object.keys(staff.assignments).length,
    0
  ) || 0;

  const staffWithAssignments = scheduleQuery.data?.filter(
    staff => Object.keys(staff.assignments).length > 0
  ).length || 0;

  // Assign shift mutation
  const assignShiftMutation = useMutation({
    mutationFn: async ({
      profileId,
      shiftId,
      date,
    }: {
      profileId: string;
      shiftId: string;
      date: string;
    }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_shift_assignments")
        .insert({
          tenant_id: tenant.id,
          profile_id: profileId,
          shift_id: shiftId,
          date,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-schedule", tenant?.id] });
      toast({
        title: "Shift Assigned",
        description: "Shift has been assigned successfully.",
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

  // Remove shift assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("hr_shift_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-schedule", tenant?.id] });
      toast({
        title: "Assignment Removed",
        description: "Shift assignment has been removed.",
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
    staffSchedule: scheduleQuery.data || [],
    isLoading: scheduleQuery.isLoading,
    stats: {
      totalAssignments,
      staffWithAssignments,
    },
    assignShift: assignShiftMutation.mutate,
    removeAssignment: removeAssignmentMutation.mutate,
    isAssigning: assignShiftMutation.isPending,
    isRemoving: removeAssignmentMutation.isPending,
  };
}

export function useStaffShiftAssignments(staffId: string, days: number = 7) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = startOfDay(new Date());
  const endDate = addDays(today, days);

  const assignmentsQuery = useQuery({
    queryKey: ["shift-assignments", staffId, days],
    queryFn: async () => {
      if (!tenant?.id || !staffId) return [];

      const { data, error } = await supabase
        .from("hr_shift_assignments")
        .select(`
          *,
          shift:hr_shifts(*)
        `)
        .eq("tenant_id", tenant.id)
        .eq("profile_id", staffId)
        .gte("date", format(today, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date");

      if (error) throw error;
      return data as ShiftAssignment[];
    },
    enabled: !!tenant?.id && !!staffId,
  });

  const assignShiftMutation = useMutation({
    mutationFn: async ({
      shiftId,
      date,
    }: {
      shiftId: string;
      date: string;
    }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_shift_assignments")
        .insert({
          tenant_id: tenant.id,
          profile_id: staffId,
          shift_id: shiftId,
          date,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments", staffId] });
      toast({
        title: "Shift Assigned",
        description: "Shift has been assigned successfully.",
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

  const removeShiftMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("hr_shift_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments", staffId] });
      toast({
        title: "Shift Removed",
        description: "Shift assignment has been removed.",
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
    assignments: assignmentsQuery.data || [],
    isLoading: assignmentsQuery.isLoading,
    assignShift: assignShiftMutation.mutate,
    removeShift: removeShiftMutation.mutate,
    isAssigning: assignShiftMutation.isPending,
    isRemoving: removeShiftMutation.isPending,
  };
}
