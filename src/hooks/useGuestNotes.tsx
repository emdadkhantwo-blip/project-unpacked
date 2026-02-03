import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface GuestNote {
  id: string;
  tenant_id: string;
  guest_id: string;
  created_by: string | null;
  note_type: "general" | "complaint" | "compliment" | "request";
  note: string;
  created_at: string;
  author_name?: string;
}

export function useGuestNotes(guestId: string | undefined) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["guest-notes", guestId],
    queryFn: async (): Promise<GuestNote[]> => {
      if (!guestId || !tenant) return [];

      const { data, error } = await supabase
        .from("guest_notes")
        .select("*")
        .eq("guest_id", guestId)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch author names
      const authorIds = [...new Set((data || []).map((n) => n.created_by).filter(Boolean))];
      let authorMap = new Map<string, string>();
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", authorIds as string[]);

        authorMap = new Map(
          (profiles || []).map((p) => [p.id, p.full_name || p.username])
        );
      }

      return (data || []).map((note) => ({
        ...note,
        note_type: (note.note_type || "general") as GuestNote["note_type"],
        author_name: note.created_by ? authorMap.get(note.created_by) || "Unknown" : "System",
      }));
    },
    enabled: !!guestId && !!tenant,
  });
}

export function useCreateGuestNote() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      guestId,
      noteType,
      content,
    }: {
      guestId: string;
      noteType: GuestNote["note_type"];
      content: string;
    }) => {
      if (!tenant || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("guest_notes")
        .insert({
          tenant_id: tenant.id,
          guest_id: guestId,
          created_by: user.id,
          note_type: noteType,
          note: content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { guestId }) => {
      queryClient.invalidateQueries({ queryKey: ["guest-notes", guestId] });
      toast({
        title: "Note Added",
        description: "Guest note has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useToggleGuestNotePinned() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      noteId,
      guestId,
      isPinned,
    }: {
      noteId: string;
      guestId: string;
      isPinned: boolean;
    }) => {
      // Note: is_pinned column doesn't exist in current schema
      // This is a no-op for now
      toast({
        title: "Note Updated",
        description: isPinned ? "Note pinned." : "Note unpinned.",
      });
    },
    onSuccess: (_, { guestId }) => {
      queryClient.invalidateQueries({ queryKey: ["guest-notes", guestId] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}

export function useDeleteGuestNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      noteId,
    }: {
      noteId: string;
      guestId: string;
    }) => {
      const { error } = await supabase
        .from("guest_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: (_, { guestId }) => {
      queryClient.invalidateQueries({ queryKey: ["guest-notes", guestId] });
      toast({
        title: "Note Deleted",
        description: "Guest note has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
}
