import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import type { Reservation } from "./useReservations";

export type FrontDeskReservation = Reservation;

export function useTodayArrivals() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["front-desk-arrivals", currentPropertyId],
    queryFn: async (): Promise<FrontDeskReservation[]> => {
      if (!currentPropertyId) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, is_vip, corporate_account_id),
          reservation_rooms(
            id,
            room_id,
            room_type:room_types(id, name, code),
            room:rooms(id, room_number)
          )
        `)
        .eq("property_id", currentPropertyId)
        .eq("check_in_date", today)
        .eq("status", "confirmed")
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((res) => ({
        ...res,
        guest: res.guest as FrontDeskReservation["guest"],
        reservation_rooms: (res.reservation_rooms || []).map((rr: any) => ({
          id: rr.id,
          room_id: rr.room_id,
          room_type: rr.room_type,
          room: rr.room,
        })),
      }));
    },
    enabled: !!currentPropertyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTodayDepartures() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["front-desk-departures", currentPropertyId],
    queryFn: async (): Promise<FrontDeskReservation[]> => {
      if (!currentPropertyId) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, is_vip, corporate_account_id),
          reservation_rooms(
            id,
            room_id,
            room_type:room_types(id, name, code),
            room:rooms(id, room_number)
          )
        `)
        .eq("property_id", currentPropertyId)
        .eq("check_out_date", today)
        .in("status", ["checked_in", "checked_out"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((res) => ({
        ...res,
        guest: res.guest as FrontDeskReservation["guest"],
        reservation_rooms: (res.reservation_rooms || []).map((rr: any) => ({
          id: rr.id,
          room_id: rr.room_id,
          room_type: rr.room_type,
          room: rr.room,
        })),
      }));
    },
    enabled: !!currentPropertyId,
    refetchInterval: 30000,
  });
}

export function useInHouseGuests() {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["front-desk-in-house", currentPropertyId],
    queryFn: async (): Promise<FrontDeskReservation[]> => {
      if (!currentPropertyId) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, is_vip, corporate_account_id),
          reservation_rooms(
            id,
            room_id,
            room_type:room_types(id, name, code),
            room:rooms(id, room_number)
          )
        `)
        .eq("property_id", currentPropertyId)
        .eq("status", "checked_in")
        .order("check_out_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((res) => ({
        ...res,
        guest: res.guest as FrontDeskReservation["guest"],
        reservation_rooms: (res.reservation_rooms || []).map((rr: any) => ({
          id: rr.id,
          room_id: rr.room_id,
          room_type: rr.room_type,
          room: rr.room,
        })),
      }));
    },
    enabled: !!currentPropertyId,
    refetchInterval: 30000,
  });
}
