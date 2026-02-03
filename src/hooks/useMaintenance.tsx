import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type MaintenanceTicket = Tables<"maintenance_tickets"> & {
  room?: { room_number: string; floor: string | null } | null;
  assigned_profile?: { full_name: string | null; username: string } | null;
  reported_profile?: { full_name: string | null; username: string } | null;
};

export type TicketInsert = {
  title: string;
  description?: string;
  room_id?: string | null;
  priority?: number;
  assigned_to?: string | null;
};

export type TicketUpdate = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  assigned_to?: string | null;
  resolution_notes?: string | null;
};

export function useMaintenanceTickets(filters?: { status?: string; priority?: number }) {
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["maintenance-tickets", propertyId, filters],
    queryFn: async (): Promise<MaintenanceTicket[]> => {
      if (!propertyId || !tenantId) return [];

      let query = supabase
        .from("maintenance_tickets")
        .select(`
          *,
          room:rooms(room_number, floor)
        `)
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.priority && filters.priority > 0) {
        query = query.eq("priority", filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Manually fetch assigned and reported profiles
      const tickets = data || [];
      const userIds = new Set<string>();
      tickets.forEach((t) => {
        if (t.assigned_to) userIds.add(t.assigned_to);
        if (t.reported_by) userIds.add(t.reported_by);
      });

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", Array.from(userIds));

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        return tickets.map((ticket) => ({
          ...ticket,
          assigned_profile: ticket.assigned_to ? profileMap.get(ticket.assigned_to) || null : null,
          reported_profile: ticket.reported_by ? profileMap.get(ticket.reported_by) || null : null,
        }));
      }

      return tickets.map((t) => ({
        ...t,
        assigned_profile: null,
        reported_profile: null,
      }));
    },
    enabled: !!propertyId && !!tenantId,
    refetchInterval: 30000,
  });
}

export function useMaintenanceStats() {
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["maintenance-stats", propertyId],
    queryFn: async () => {
      if (!propertyId || !tenantId) {
        return { open: 0, inProgress: 0, resolved: 0, highPriority: 0 };
      }

      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("status, priority")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const tickets = data || [];
      return {
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
        highPriority: tickets.filter((t) => t.priority >= 3).length,
      };
    },
    enabled: !!propertyId && !!tenantId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (ticket: TicketInsert) => {
      if (!propertyId || !tenantId) throw new Error("No property selected");

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("maintenance_tickets")
        .insert({
          ...ticket,
          property_id: propertyId,
          tenant_id: tenantId,
          reported_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats", propertyId] });
      toast.success("Ticket created successfully");
    },
    onError: (error) => {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (ticket: TicketUpdate) => {
      const { id, ...updateData } = ticket;

      const { data, error } = await supabase
        .from("maintenance_tickets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats", propertyId] });
      toast.success("Ticket updated successfully");
    },
    onError: (error) => {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    },
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({ ticketId, resolutionNotes }: { ticketId: string; resolutionNotes: string }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("maintenance_tickets")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id,
          resolution_notes: resolutionNotes,
        })
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats", propertyId] });
      toast.success("Ticket resolved successfully");
    },
    onError: (error) => {
      console.error("Error resolving ticket:", error);
      toast.error("Failed to resolve ticket");
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: string; assignedTo: string | null }) => {
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .update({
          assigned_to: assignedTo,
          status: assignedTo ? "in_progress" : "open",
        })
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats", propertyId] });
      toast.success("Ticket assignment updated");
    },
    onError: (error) => {
      console.error("Error assigning ticket:", error);
      toast.error("Failed to assign ticket");
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("maintenance_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats", propertyId] });
      toast.success("Ticket deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    },
  });
}

export function useMyAssignedTickets() {
  const { currentProperty, tenant } = useTenant();
  const { user } = useAuth();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["my-assigned-tickets", propertyId, user?.id],
    queryFn: async (): Promise<MaintenanceTicket[]> => {
      if (!propertyId || !tenantId || !user?.id) return [];

      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select(`
          *,
          room:rooms(room_number, floor)
        `)
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .eq("assigned_to", user.id)
        .in("status", ["open", "in_progress"])
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        assigned_profile: null,
        reported_profile: null,
      }));
    },
    enabled: !!propertyId && !!tenantId && !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMyMaintenanceStats() {
  const { currentProperty, tenant } = useTenant();
  const { user } = useAuth();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["my-maintenance-stats", propertyId, user?.id],
    queryFn: async () => {
      if (!propertyId || !tenantId || !user?.id) {
        return { assigned: 0, open: 0, inProgress: 0, resolvedToday: 0, highPriority: 0 };
      }

      // Get assigned tickets
      const { data: assignedTickets, error: assignedError } = await supabase
        .from("maintenance_tickets")
        .select("status, priority")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .eq("assigned_to", user.id)
        .in("status", ["open", "in_progress"]);

      if (assignedError) throw assignedError;

      // Get resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: resolvedToday, error: resolvedError } = await supabase
        .from("maintenance_tickets")
        .select("id")
        .eq("property_id", propertyId)
        .eq("tenant_id", tenantId)
        .eq("resolved_by", user.id)
        .gte("resolved_at", today.toISOString());

      if (resolvedError) throw resolvedError;

      const tickets = assignedTickets || [];
      return {
        assigned: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        resolvedToday: resolvedToday?.length || 0,
        highPriority: tickets.filter((t) => t.priority >= 3).length,
      };
    },
    enabled: !!propertyId && !!tenantId && !!user?.id,
  });
}
