import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useMaintenanceNotifications() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`maintenance-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance_tickets",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // Invalidate maintenance-related queries
          queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
          queryClient.invalidateQueries({ queryKey: ["my-maintenance-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["my-maintenance-stats"] });
          // Also refresh room data since maintenance affects room status
          queryClient.invalidateQueries({ queryKey: ["rooms"] });

          // Show notification based on event type
          if (payload.eventType === "INSERT") {
            const newTicket = payload.new as { title: string; priority: number };
            const priorityLabel = newTicket.priority === 3 ? "🔴 High" : newTicket.priority === 2 ? "🟡 Medium" : "🟢 Low";
            toast({
              title: "New Maintenance Ticket",
              description: `${priorityLabel}: ${newTicket.title}`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTicket = payload.new as { status: string; title: string };
            const oldTicket = payload.old as { status?: string };

            if (oldTicket?.status !== updatedTicket.status) {
              const statusMessages: Record<string, string> = {
                in_progress: "Work started",
                resolved: "Ticket resolved",
                open: "Ticket reopened",
              };

              const message = statusMessages[updatedTicket.status] || `Status: ${updatedTicket.status}`;
              toast({
                title: "Maintenance Update",
                description: `${updatedTicket.title} - ${message}`,
              });
            }
          } else if (payload.eventType === "DELETE") {
            toast({
              title: "Ticket Deleted",
              description: "A maintenance ticket has been removed",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);
}
