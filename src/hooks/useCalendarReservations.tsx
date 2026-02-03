import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { addDays, format, startOfDay } from "date-fns";

export interface CalendarReservation {
  id: string;
  confirmation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    is_vip: boolean;
  } | null;
  room_id: string | null;
  room_number: string | null;
  room_type_name: string | null;
  reservation_room_id: string;
  total_amount: number; // For price recalculation on date changes
}

export interface CalendarRoom {
  id: string;
  room_number: string;
  floor: string | null;
  room_type: {
    id: string;
    name: string;
    code: string;
  } | null;
  reservations: CalendarReservation[];
}

export interface CalendarData {
  rooms: CalendarRoom[];
  dateRange: Date[];
  stats: {
    arrivals: number;
    departures: number;
    inHouse: number;
    available: number;
  };
}

export function useCalendarReservations(startDate: Date, numDays: number = 14) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  // Normalize the base date to start of day for consistent calculations
  const baseDate = startOfDay(startDate);
  const endDate = addDays(baseDate, numDays - 1);

  return useQuery({
    queryKey: ["calendar-reservations", currentPropertyId, format(startDate, "yyyy-MM-dd"), numDays],
    queryFn: async (): Promise<CalendarData> => {
      if (!currentPropertyId) {
        return { rooms: [], dateRange: [], stats: { arrivals: 0, departures: 0, inHouse: 0, available: 0 } };
      }

      // Generate date range using normalized base date
      const dateRange: Date[] = [];
      for (let i = 0; i < numDays; i++) {
        dateRange.push(addDays(baseDate, i));
      }

      // Fetch all rooms for the property
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floor,
          room_type:room_types(id, name, code)
        `)
        .eq("property_id", currentPropertyId)
        .eq("is_active", true)
        .order("room_number");

      if (roomsError) throw roomsError;

      // Fetch reservations that overlap with our date range
      // A reservation overlaps if: check_in_date <= endDate AND check_out_date > startDate
      const startDateStr = format(baseDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select(`
          id,
          confirmation_number,
          check_in_date,
          check_out_date,
          status,
          total_amount,
          guest:guests(id, first_name, last_name, is_vip),
          reservation_rooms(
            id,
            room_id,
            room:rooms(id, room_number),
            room_type:room_types(name)
          )
        `)
        .eq("property_id", currentPropertyId)
        .lte("check_in_date", endDateStr)
        .gt("check_out_date", startDateStr)
        .in("status", ["confirmed", "checked_in"]);

      if (resError) throw resError;

      // Map room_id to reservations
      const roomReservationsMap = new Map<string, CalendarReservation[]>();
      const unassignedReservations: CalendarReservation[] = [];

      reservations?.forEach((res) => {
        const reservationRooms = res.reservation_rooms || [];
        
        // Track if this reservation has any room assignments
        let hasRoomAssignment = false;
        
        reservationRooms.forEach((rr: any) => {
          const roomId = rr.room_id;
          if (roomId) {
            hasRoomAssignment = true;
            const calendarRes: CalendarReservation = {
              id: res.id,
              confirmation_number: res.confirmation_number,
              check_in_date: res.check_in_date,
              check_out_date: res.check_out_date,
              status: res.status as CalendarReservation["status"],
              guest: res.guest as CalendarReservation["guest"],
              room_id: roomId,
              room_number: rr.room?.room_number || null,
              room_type_name: rr.room_type?.name || null,
              reservation_room_id: rr.id,
              total_amount: res.total_amount,
            };

            const existing = roomReservationsMap.get(roomId) || [];
            existing.push(calendarRes);
            roomReservationsMap.set(roomId, existing);
          }
        });

        // If no room assignment (either no reservation_rooms or all have null room_id), add to unassigned list
        if (!hasRoomAssignment) {
          const calendarRes: CalendarReservation = {
            id: res.id,
            confirmation_number: res.confirmation_number,
            check_in_date: res.check_in_date,
            check_out_date: res.check_out_date,
            status: res.status as CalendarReservation["status"],
            guest: res.guest as CalendarReservation["guest"],
            room_id: null,
            room_number: null,
            room_type_name: reservationRooms[0]?.room_type?.name || null,
            reservation_room_id: reservationRooms[0]?.id || "",
            total_amount: res.total_amount,
          };
          unassignedReservations.push(calendarRes);
        }
      });

      // Build calendar rooms
      const calendarRooms: CalendarRoom[] = (rooms || []).map((room) => ({
        id: room.id,
        room_number: room.room_number,
        floor: room.floor,
        room_type: room.room_type as CalendarRoom["room_type"],
        reservations: roomReservationsMap.get(room.id) || [],
      }));

      // Create individual rows for each unassigned reservation
      // This prevents overlapping blocks when multiple unassigned reservations exist
      unassignedReservations.forEach((res) => {
        const guestName = res.guest
          ? `${res.guest.first_name} ${res.guest.last_name}`
          : "Unknown Guest";
        
        calendarRooms.unshift({
          id: `unassigned-${res.id}`,
          room_number: guestName,
          floor: "unassigned",
          room_type: {
            id: "unassigned",
            name: res.room_type_name || "No Type",
            code: "UA",
          },
          reservations: [res],
        });
      });

      // Calculate stats for today
      const todayStr = format(new Date(), "yyyy-MM-dd");
      let arrivals = 0;
      let departures = 0;
      let inHouse = 0;

      reservations?.forEach((res) => {
        if (res.check_in_date === todayStr && res.status === "confirmed") {
          arrivals++;
        }
        if (res.check_out_date === todayStr && res.status === "checked_in") {
          departures++;
        }
        if (res.status === "checked_in") {
          inHouse++;
        }
      });

      const available = (rooms?.length || 0) - inHouse;

      return {
        rooms: calendarRooms,
        dateRange,
        stats: { arrivals, departures, inHouse, available },
      };
    },
    enabled: !!currentPropertyId,
  });
}
