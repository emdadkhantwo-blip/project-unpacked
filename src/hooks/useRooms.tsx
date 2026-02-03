import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { toast } from "sonner";
import type { RoomStatus } from "@/types/database";

interface Room {
  id: string;
  room_number: string;
  floor: string | null;
  status: RoomStatus;
  is_active: boolean;
  notes: string | null;
  property_id: string;
  room_type_id: string;
  room_type: {
    id: string;
    name: string;
    code: string;
    base_rate: number;
    max_occupancy: number;
    amenities?: unknown;
  } | null;
}

interface RoomWithGuest extends Room {
  current_guest?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export function useRooms() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["rooms", currentPropertyId],
    queryFn: async (): Promise<RoomWithGuest[]> => {
      if (!currentPropertyId) return [];

      // Fetch rooms with room types
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select(`
          *,
          room_type:room_types(id, name, code, base_rate, max_occupancy, amenities)
        `)
        .eq("property_id", currentPropertyId)
        .eq("is_active", true)
        .order("room_number");

      if (error) throw error;

      // Fetch current guests for occupied rooms
      const occupiedRoomIds = rooms
        .filter((r) => r.status === "occupied")
        .map((r) => r.id);

      if (occupiedRoomIds.length > 0) {
        const { data: reservationRooms } = await supabase
          .from("reservation_rooms")
          .select(`
            room_id,
            reservation:reservations!inner(
              status,
              guest:guests(id, first_name, last_name)
            )
          `)
          .in("room_id", occupiedRoomIds)
          .eq("reservation.status", "checked_in");

        // Create a map of room_id to guest
        const roomGuestMap = new Map<string, { id: string; first_name: string; last_name: string }>();
        
        reservationRooms?.forEach((rr) => {
          if (rr.room_id && rr.reservation?.guest) {
            const guest = Array.isArray(rr.reservation.guest) 
              ? rr.reservation.guest[0] 
              : rr.reservation.guest;
            if (guest) {
              roomGuestMap.set(rr.room_id, guest);
            }
          }
        });

        return rooms.map((room) => ({
          ...room,
          room_type: room.room_type as Room["room_type"],
          current_guest: roomGuestMap.get(room.id) || null,
        }));
      }

      return rooms.map((room) => ({
        ...room,
        room_type: room.room_type as Room["room_type"],
        current_guest: null,
      }));
    },
    enabled: !!currentPropertyId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const currentPropertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (data: {
      room_number: string;
      floor: string | null;
      room_type_id: string;
      notes: string | null;
    }) => {
      if (!currentPropertyId || !tenantId) throw new Error("No property selected");

      const { error } = await supabase.from("rooms").insert({
        ...data,
        property_id: currentPropertyId,
        tenant_id: tenantId,
        status: "vacant",
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      toast.success("Room created successfully");
    },
    onError: (error) => {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      roomId,
      data,
    }: {
      roomId: string;
      data: {
        room_number?: string;
        floor?: string | null;
        room_type_id?: string;
        notes?: string | null;
        is_active?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("rooms")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      toast.success("Room updated successfully");
    },
    onError: (error) => {
      console.error("Error updating room:", error);
      toast.error("Failed to update room");
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (roomId: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("rooms")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["room-stats", currentPropertyId] });
      toast.success("Room deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    },
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: RoomStatus }) => {
      const { error } = await supabase
        .from("rooms")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", currentPropertyId] });
      toast.success("Room status updated");
    },
    onError: (error) => {
      console.error("Error updating room status:", error);
      toast.error("Failed to update room status");
    },
  });
}

export function useRoomStats() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["room-stats", currentPropertyId],
    queryFn: async () => {
      if (!currentPropertyId) return null;

      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("status")
        .eq("property_id", currentPropertyId)
        .eq("is_active", true);

      if (error) throw error;

      const stats = {
        total: rooms.length,
        vacant: 0,
        occupied: 0,
        dirty: 0,
        maintenance: 0,
        out_of_order: 0,
      };

      rooms.forEach((room) => {
        const status = room.status as RoomStatus;
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
    enabled: !!currentPropertyId,
  });
}
