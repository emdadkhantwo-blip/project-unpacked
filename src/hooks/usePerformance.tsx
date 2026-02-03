import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
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
  // Joined
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

export function usePerformance() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch performance notes
  const {
    data: notes = [],
    isLoading,
  } = useQuery({
    queryKey: ["performance-notes", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("hr_performance_notes")
        .select(`
          *,
          staff:profiles!hr_performance_notes_profile_id_fkey(full_name, avatar_url),
          author:profiles!hr_performance_notes_author_id_fkey(full_name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((note) => ({
        id: note.id,
        tenant_id: note.tenant_id,
        profile_id: note.profile_id,
        author_id: note.author_id,
        note_type: note.note_type as PerformanceNoteType,
        content: note.content,
        rating: note.rating,
        created_at: note.created_at,
        staff_name: (note.staff as any)?.full_name || "Unknown",
        staff_avatar: (note.staff as any)?.avatar_url || null,
        author_name: (note.author as any)?.full_name || "Unknown",
      }));
    },
    enabled: !!tenantId,
  });

  // Stats
  const stats = {
    total: notes.length,
    warnings: notes.filter((n) => n.note_type === "warning").length,
    rewards: notes.filter((n) => n.note_type === "reward").length,
    averageRating: (() => {
      const rated = notes.filter((n) => n.rating !== null);
      if (rated.length === 0) return null;
      return rated.reduce((sum, n) => sum + (n.rating || 0), 0) / rated.length;
    })(),
  };

  // Calculate staff performance summaries
  const staffPerformance: StaffPerformance[] = (() => {
    const staffMap = new Map<string, StaffPerformance>();

    notes.forEach((note) => {
      if (!staffMap.has(note.profile_id)) {
        staffMap.set(note.profile_id, {
          profile_id: note.profile_id,
          name: note.staff_name,
          avatar: note.staff_avatar,
          total_notes: 0,
          warnings: 0,
          rewards: 0,
          average_rating: null,
        });
      }

      const staff = staffMap.get(note.profile_id)!;
      staff.total_notes++;
      if (note.note_type === "warning") staff.warnings++;
      if (note.note_type === "reward") staff.rewards++;
    });

    // Calculate average rating per staff
    staffMap.forEach((staff, profileId) => {
      const staffNotes = notes.filter(
        (n) => n.profile_id === profileId && n.rating !== null
      );
      if (staffNotes.length > 0) {
        staff.average_rating =
          staffNotes.reduce((sum, n) => sum + (n.rating || 0), 0) /
          staffNotes.length;
      }
    });

    return Array.from(staffMap.values());
  })();

  // Fetch staff for dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list-performance", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Add performance note
  const addNote = useMutation({
    mutationFn: async (data: {
      profile_id: string;
      note_type: PerformanceNoteType;
      content: string;
      rating?: number;
    }) => {
      if (!tenantId || !user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("hr_performance_notes").insert({
        tenant_id: tenantId,
        profile_id: data.profile_id,
        author_id: user.id,
        note_type: data.note_type,
        content: data.content,
        rating: data.rating || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-notes"] });
      toast({ title: "Performance note added" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("hr_performance_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-notes"] });
      toast({ title: "Note deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    notes,
    stats,
    staffPerformance,
    staffList,
    isLoading,
    addNote,
    deleteNote,
  };
}
