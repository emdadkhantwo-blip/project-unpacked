import { toast } from "@/hooks/use-toast";

export type PerformanceNoteType = "feedback" | "warning" | "reward" | "kpi";

export interface PerformanceNote {
  id: string;
  tenant_id: string;
  profile_id: string;
  author_id: string;
  note_type: PerformanceNoteType;
  content: string;
  rating: number | null;
  created_at: string;
  staff_name: string;
  staff_avatar: string | null;
  author_name: string;
}

export interface StaffPerformance {
  profile_id: string;
  name: string;
  avatar: string | null;
  total_notes: number;
  warnings: number;
  rewards: number;
  average_rating: number | null;
}

// Note: HR performance tables don't exist yet - returning mock data

export function usePerformance() {
  const addNote = {
    mutate: () => {
      toast({ title: "Info", description: "Performance module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Performance module not yet configured" });
    },
    isPending: false,
  };

  const deleteNote = {
    mutate: () => {
      toast({ title: "Info", description: "Performance module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Performance module not yet configured" });
    },
    isPending: false,
  };

  return {
    notes: [] as PerformanceNote[],
    stats: {
      total: 0,
      warnings: 0,
      rewards: 0,
      averageRating: null as number | null,
    },
    staffPerformance: [] as StaffPerformance[],
    staffList: [] as { id: string; full_name: string; avatar_url: string | null }[],
    isLoading: false,
    addNote,
    deleteNote,
  };
}
