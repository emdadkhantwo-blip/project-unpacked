import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminApplication {
  id: string;
  full_name: string;
  hotel_name: string;
  email: string;
  phone: string | null;
  contact_name: string | null;
  room_count: number | null;
  property_count: number | null;
  current_software: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export function useAdminApplications() {
  return useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AdminApplication[];
    },
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, planId }: { applicationId: string; planId: string }) => {
      const { data, error } = await supabase.functions.invoke("approve-application", {
        body: { applicationId, planId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast({
        title: "Application Approved",
        description: "The applicant can now log in with their credentials.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message,
      });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      const { error } = await supabase
        .from("admin_applications")
        .update({
          status: "rejected",
          notes: reason || null,
        })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message,
      });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("admin_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast({
        title: "Application Deleted",
        description: "The application has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message,
      });
    },
  });
}