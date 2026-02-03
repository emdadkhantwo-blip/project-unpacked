import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export type DateRange = {
  from: Date;
  to: Date;
};

export type OccupancyData = {
  date: string;
  occupancy: number;
  occupied: number;
  total: number;
};

export type RevenueData = {
  date: string;
  revenue: number;
  roomCharges: number;
  services: number;
};

export type RoomTypePerformance = {
  name: string;
  code: string;
  revenue: number;
  nights: number;
  adr: number;
};

export type BookingSourceData = {
  source: string;
  count: number;
  revenue: number;
};

export type DashboardMetrics = {
  occupancyRate: number;
  adr: number;
  revPar: number;
  totalRevenue: number;
  roomRevenue: number;
  serviceRevenue: number;
  totalReservations: number;
  averageLos: number;
};

export function useOccupancyReport(dateRange: DateRange) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["occupancy-report", currentPropertyId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<OccupancyData[]> => {
      if (!currentPropertyId) return [];

      // Get total rooms for the property
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id")
        .eq("property_id", currentPropertyId)
        .eq("is_active", true);

      if (roomsError) throw roomsError;
      const totalRooms = rooms?.length || 0;
      if (totalRooms === 0) return [];

      // Get all reservations that overlap with date range
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("check_in_date, check_out_date, status, reservation_rooms(id)")
        .eq("property_id", currentPropertyId)
        .in("status", ["checked_in", "checked_out"])
        .lte("check_in_date", format(dateRange.to, "yyyy-MM-dd"))
        .gte("check_out_date", format(dateRange.from, "yyyy-MM-dd"));

      if (resError) throw resError;

      // Calculate occupancy for each day
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      return days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        let occupiedRooms = 0;

        reservations?.forEach((res: any) => {
          const checkIn = new Date(res.check_in_date);
          const checkOut = new Date(res.check_out_date);
          
          if (day >= checkIn && day < checkOut) {
            occupiedRooms += res.reservation_rooms?.length || 1;
          }
        });

        return {
          date: format(day, "MMM dd"),
          occupancy: Math.round((occupiedRooms / totalRooms) * 100),
          occupied: occupiedRooms,
          total: totalRooms,
        };
      });
    },
    enabled: !!currentPropertyId,
  });
}

export function useRevenueReport(dateRange: DateRange) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["revenue-report", currentPropertyId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<RevenueData[]> => {
      if (!currentPropertyId) return [];

      // Get folio items in date range
      const { data: items, error } = await supabase
        .from("folio_items")
        .select(`
          service_date,
          item_type,
          total_price,
          voided,
          folio:folios!inner(property_id)
        `)
        .gte("service_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("service_date", format(dateRange.to, "yyyy-MM-dd"))
        .eq("voided", false);

      if (error) throw error;

      const filteredItems = items?.filter((i: any) => i.folio?.property_id === currentPropertyId) || [];

      // Group by date
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      return days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayItems = filteredItems.filter((i) => i.service_date === dayStr);

        const roomCharges = dayItems
          .filter((i) => i.item_type === "room_charge")
          .reduce((sum, i) => sum + Number(i.total_price), 0);

        const services = dayItems
          .filter((i) => i.item_type !== "room_charge" && i.item_type !== "tax" && i.item_type !== "service_charge")
          .reduce((sum, i) => sum + Number(i.total_price), 0);

        return {
          date: format(day, "MMM dd"),
          revenue: roomCharges + services,
          roomCharges,
          services,
        };
      });
    },
    enabled: !!currentPropertyId,
  });
}

export function useRoomTypePerformance(dateRange: DateRange) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["room-type-performance", currentPropertyId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<RoomTypePerformance[]> => {
      if (!currentPropertyId) return [];

      // Get room types
      const { data: roomTypes, error: rtError } = await supabase
        .from("room_types")
        .select("id, name, code")
        .eq("property_id", currentPropertyId)
        .eq("is_active", true);

      if (rtError) throw rtError;

      // Get reservation rooms with their rates
      const { data: resRooms, error: rrError } = await supabase
        .from("reservation_rooms")
        .select(`
          room_type_id,
          rate_per_night,
          reservation:reservations!inner(
            check_in_date,
            check_out_date,
            status,
            property_id
          )
        `)
        .in("reservation.status", ["checked_in", "checked_out"]);

      if (rrError) throw rrError;

      const filteredResRooms = resRooms?.filter((rr: any) => {
        const res = rr.reservation;
        return (
          res?.property_id === currentPropertyId &&
          new Date(res.check_in_date) <= dateRange.to &&
          new Date(res.check_out_date) >= dateRange.from
        );
      }) || [];

      // Calculate performance per room type
      return roomTypes?.map((rt) => {
        const typeResRooms = filteredResRooms.filter((rr: any) => rr.room_type_id === rt.id);
        
        let totalNights = 0;
        let totalRevenue = 0;

        typeResRooms.forEach((rr: any) => {
          const checkIn = new Date(rr.reservation.check_in_date);
          const checkOut = new Date(rr.reservation.check_out_date);
          const rangeStart = dateRange.from > checkIn ? dateRange.from : checkIn;
          const rangeEnd = dateRange.to < checkOut ? dateRange.to : checkOut;
          
          const nights = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
          if (nights > 0) {
            totalNights += nights;
            totalRevenue += nights * Number(rr.rate_per_night);
          }
        });

        return {
          name: rt.name,
          code: rt.code,
          revenue: totalRevenue,
          nights: totalNights,
          adr: totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0,
        };
      }) || [];
    },
    enabled: !!currentPropertyId,
  });
}

export function useBookingSourceReport(dateRange: DateRange) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["booking-source-report", currentPropertyId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<BookingSourceData[]> => {
      if (!currentPropertyId) return [];

      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("source, total_amount")
        .eq("property_id", currentPropertyId)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;

      // Group by source
      const sourceMap = new Map<string, { count: number; revenue: number }>();
      
      reservations?.forEach((res) => {
        const source = res.source || "direct";
        const existing = sourceMap.get(source) || { count: 0, revenue: 0 };
        sourceMap.set(source, {
          count: existing.count + 1,
          revenue: existing.revenue + Number(res.total_amount),
        });
      });

      return Array.from(sourceMap.entries()).map(([source, data]) => ({
        source: formatSourceName(source),
        count: data.count,
        revenue: data.revenue,
      }));
    },
    enabled: !!currentPropertyId,
  });
}

export function useDashboardMetrics(dateRange: DateRange) {
  const { currentProperty } = useTenant();
  const currentPropertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["dashboard-metrics", currentPropertyId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!currentPropertyId) {
        return {
          occupancyRate: 0,
          adr: 0,
          revPar: 0,
          totalRevenue: 0,
          roomRevenue: 0,
          serviceRevenue: 0,
          totalReservations: 0,
          averageLos: 0,
        };
      }

      // Get total rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("property_id", currentPropertyId)
        .eq("is_active", true);

      const totalRooms = rooms?.length || 0;
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length;
      const totalRoomNights = totalRooms * days;

      // Get reservations in date range
      const { data: reservations } = await supabase
        .from("reservations")
        .select("check_in_date, check_out_date, status, reservation_rooms(id, rate_per_night)")
        .eq("property_id", currentPropertyId)
        .in("status", ["checked_in", "checked_out"])
        .lte("check_in_date", format(dateRange.to, "yyyy-MM-dd"))
        .gte("check_out_date", format(dateRange.from, "yyyy-MM-dd"));

      // Calculate occupied room nights and room revenue
      let occupiedRoomNights = 0;
      let roomRevenue = 0;
      let totalLos = 0;

      reservations?.forEach((res: any) => {
        const checkIn = new Date(res.check_in_date);
        const checkOut = new Date(res.check_out_date);
        const rangeStart = dateRange.from > checkIn ? dateRange.from : checkIn;
        const rangeEnd = dateRange.to < checkOut ? dateRange.to : checkOut;
        
        const nights = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
        const roomCount = res.reservation_rooms?.length || 1;
        
        if (nights > 0) {
          occupiedRoomNights += nights * roomCount;
          totalLos += Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          
          res.reservation_rooms?.forEach((rr: any) => {
            roomRevenue += nights * Number(rr.rate_per_night);
          });
        }
      });

      // Get service revenue (non-room charges)
      const { data: serviceItems } = await supabase
        .from("folio_items")
        .select(`
          total_price,
          item_type,
          voided,
          folio:folios!inner(property_id)
        `)
        .gte("service_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("service_date", format(dateRange.to, "yyyy-MM-dd"))
        .eq("voided", false)
        .neq("item_type", "room_charge")
        .neq("item_type", "tax")
        .neq("item_type", "service_charge");

      const serviceRevenue = serviceItems
        ?.filter((i: any) => i.folio?.property_id === currentPropertyId)
        .reduce((sum, i) => sum + Number(i.total_price), 0) || 0;

      const occupancyRate = totalRoomNights > 0 ? Math.round((occupiedRoomNights / totalRoomNights) * 100) : 0;
      const adr = occupiedRoomNights > 0 ? Math.round(roomRevenue / occupiedRoomNights) : 0;
      const revPar = totalRoomNights > 0 ? Math.round(roomRevenue / totalRoomNights) : 0;
      const averageLos = reservations?.length ? Math.round(totalLos / reservations.length * 10) / 10 : 0;

      return {
        occupancyRate,
        adr,
        revPar,
        totalRevenue: roomRevenue + serviceRevenue,
        roomRevenue,
        serviceRevenue,
        totalReservations: reservations?.length || 0,
        averageLos,
      };
    },
    enabled: !!currentPropertyId,
  });
}

function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    direct: "Direct",
    phone: "Phone",
    walk_in: "Walk-in",
    website: "Website",
    ota_booking: "Booking.com",
    ota_expedia: "Expedia",
    ota_agoda: "Agoda",
    corporate: "Corporate",
    travel_agent: "Travel Agent",
    other: "Other",
  };
  return names[source] || source;
}
