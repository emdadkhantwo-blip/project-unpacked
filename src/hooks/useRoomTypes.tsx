import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type RoomType = Tables<"room_types">;

export function useRoomTypes() {
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["room-types", propertyId],
    queryFn: async (): Promise<RoomType[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();
  const { currentProperty, tenant } = useTenant();
  const propertyId = currentProperty?.id;
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description: string | null;
      base_rate: number;
      max_occupancy: number;
      amenities?: string[];
    }) => {
      if (!propertyId || !tenantId) throw new Error("No property selected");

      const { error } = await supabase.from("room_types").insert({
        ...data,
        property_id: propertyId,
        tenant_id: tenantId,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", propertyId] });
      toast.success("Room type created successfully");
    },
    onError: (error) => {
      console.error("Error creating room type:", error);
      toast.error("Failed to create room type");
    },
  });
}

export function useUpdateRoomType() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async ({
      roomTypeId,
      data,
    }: {
      roomTypeId: string;
      data: {
        name?: string;
        code?: string;
        description?: string | null;
        base_rate?: number;
        max_occupancy?: number;
        is_active?: boolean;
        amenities?: string[];
      };
    }) => {
      const { error } = await supabase
        .from("room_types")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", roomTypeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", propertyId] });
      toast.success("Room type updated successfully");
    },
    onError: (error) => {
      console.error("Error updating room type:", error);
      toast.error("Failed to update room type");
    },
  });
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (roomTypeId: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("room_types")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", roomTypeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types", propertyId] });
      toast.success("Room type deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting room type:", error);
      toast.error("Failed to delete room type");
    },
  });
}

export interface AvailableRoom {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
}

export function useAvailableRooms(roomTypeId: string | null, checkIn: Date | null, checkOut: Date | null) {
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["available-rooms", propertyId, roomTypeId, checkIn?.toISOString(), checkOut?.toISOString()],
    queryFn: async (): Promise<AvailableRoom[]> => {
      if (!propertyId || !roomTypeId || !checkIn || !checkOut) return [];

      // Get ALL active rooms of this type (regardless of current status)
      // This allows booking occupied rooms for future dates
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id, room_number, floor, status")
        .eq("property_id", propertyId)
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true)
        .order("room_number");

      if (roomsError) throw roomsError;

      // Get rooms that are already booked for these dates
      const { data: bookedRooms, error: bookedError } = await supabase
        .from("reservation_rooms")
        .select(`
          room_id,
          reservation:reservations!inner(
            check_in_date,
            check_out_date,
            status
          )
        `)
        .not("room_id", "is", null)
        .in("reservation.status", ["confirmed", "checked_in"]);

      if (bookedError) throw bookedError;

      // Filter out rooms that overlap with the requested dates
      const checkInStr = checkIn.toISOString().split("T")[0];
      const checkOutStr = checkOut.toISOString().split("T")[0];

      const bookedRoomIds = new Set(
        bookedRooms
          ?.filter((br) => {
            const res = br.reservation as any;
            // Check for date overlap: room is booked if reservation overlaps with requested dates
            return res.check_in_date < checkOutStr && res.check_out_date > checkInStr;
          })
          .map((br) => br.room_id)
      );

      // Return available rooms with their current status for display
      return rooms?.filter((room) => !bookedRoomIds.has(room.id)) || [];
    },
    enabled: !!propertyId && !!roomTypeId && !!checkIn && !!checkOut,
  });
}
