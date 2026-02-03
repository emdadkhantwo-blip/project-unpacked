import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useReservationNotifications() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  useEffect(() => {
    if (!propertyId) return;

    // Subscribe to reservations changes
    const reservationsChannel = supabase
      .channel(`reservations-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // Invalidate all reservation-related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
          queryClient.invalidateQueries({ queryKey: ["reservation-stats"] });
          queryClient.invalidateQueries({ queryKey: ["calendar-reservations"] });
          queryClient.invalidateQueries({ queryKey: ["today-arrivals"] });
          queryClient.invalidateQueries({ queryKey: ["today-departures"] });
          queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });

          // Show notification based on event type
          if (payload.eventType === "INSERT") {
            const newRes = payload.new as { confirmation_number: string };
            toast({
              title: "New Reservation",
              description: `Reservation ${newRes.confirmation_number} has been created`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedRes = payload.new as { confirmation_number: string; status: string };
            const oldRes = payload.old as { status?: string };
            
            // Only notify for status changes
            if (oldRes?.status !== updatedRes.status) {
              const statusMessages: Record<string, string> = {
                checked_in: "Guest has checked in",
                checked_out: "Guest has checked out",
                cancelled: "Reservation cancelled",
                no_show: "Marked as no-show",
              };
              
              const message = statusMessages[updatedRes.status] || `Status changed to ${updatedRes.status}`;
              toast({
                title: `Reservation ${updatedRes.confirmation_number}`,
                description: message,
              });
            }
          } else if (payload.eventType === "DELETE") {
            const deletedRes = payload.old as { confirmation_number: string };
            toast({
              title: "Reservation Deleted",
              description: `Reservation ${deletedRes.confirmation_number} has been removed`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(reservationsChannel);
    };
  }, [propertyId, queryClient]);
}
