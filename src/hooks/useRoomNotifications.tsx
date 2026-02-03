import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useRoomNotifications() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  useEffect(() => {
    if (!propertyId) return;

    // Subscribe to rooms changes
    const roomsChannel = supabase
      .channel(`rooms-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // Invalidate rooms queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
          queryClient.invalidateQueries({ queryKey: ["room-stats"] });

          // Show notification for new rooms
          if (payload.eventType === "INSERT") {
            const newRoom = payload.new as { room_number: string };
            toast({
              title: "Room Added",
              description: `Room ${newRoom.room_number} has been added`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedRoom = payload.new as { room_number: string; status: string };
            // Only notify for status changes
            if (payload.old && (payload.old as any).status !== updatedRoom.status) {
              toast({
                title: "Room Status Updated",
                description: `Room ${updatedRoom.room_number} is now ${updatedRoom.status}`,
              });
            }
          } else if (payload.eventType === "DELETE") {
            const deletedRoom = payload.old as { room_number: string };
            toast({
              title: "Room Removed",
              description: `Room ${deletedRoom.room_number} has been removed`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to room types changes
    const roomTypesChannel = supabase
      .channel(`room-types-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_types",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // Invalidate room types queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["room-types"] });

          if (payload.eventType === "INSERT") {
            const newType = payload.new as { name: string; code: string };
            toast({
              title: "Room Type Created",
              description: `${newType.name} (${newType.code}) has been added`,
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(roomTypesChannel);
    };
  }, [propertyId, queryClient]);
}
