import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

// Local interface for front desk reservations to avoid type conflicts
export interface FrontDeskReservationRoom {
  id: string;
  room_id: string | null;
  room_type?: { id: string; name: string; code: string } | null;
  room?: { id: string; room_number: string } | null;
}

export interface FrontDeskGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  is_vip: boolean | null;
  corporate_account_id: string | null;
}

export interface FrontDeskReservation {
  id: string;
  confirmation_number: string;
  property_id: string;
  tenant_id: string;
  guest_id: string;
  status: string | null;
  check_in_date: string;
  check_out_date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  adults: number | null;
  children: number | null;
  total_amount: number | null;
  source: string | null;
  notes: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  guest: FrontDeskGuest | null;
  reservation_rooms: FrontDeskReservationRoom[];
}

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

      return (data || []).map((res: any) => ({
        ...res,
        guest: res.guest as FrontDeskGuest | null,
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

      return (data || []).map((res: any) => ({
        ...res,
        guest: res.guest as FrontDeskGuest | null,
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

      return (data || []).map((res: any) => ({
        ...res,
        guest: res.guest as FrontDeskGuest | null,
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
