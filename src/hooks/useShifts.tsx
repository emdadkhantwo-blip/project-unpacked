import { toast } from "@/hooks/use-toast";

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

// Note: HR shifts tables don't exist yet - returning mock data

export function useShifts(_propertyId?: string) {
  return {
    shifts: [] as Shift[],
    isLoading: false,
    createShift: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    deleteShift: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    isCreating: false,
    isDeleting: false,
  };
}

export function useWeeklySchedule(_weekStart: Date) {
  return {
    staffSchedule: [] as StaffWithShifts[],
    isLoading: false,
    stats: {
      totalAssignments: 0,
      staffWithAssignments: 0,
    },
    assignShift: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    removeAssignment: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    isAssigning: false,
    isRemoving: false,
  };
}

export function useStaffShiftAssignments(_staffId: string, _days: number = 7) {
  return {
    assignments: [] as ShiftAssignment[],
    isLoading: false,
    assignShift: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    removeShift: () => {
      toast({ title: "Info", description: "Shifts module not yet configured" });
    },
    isAssigning: false,
    isRemoving: false,
  };
}
