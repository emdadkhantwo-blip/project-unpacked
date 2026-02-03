import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { differenceInDays, parseISO, subMonths, format } from "date-fns";

export interface GuestAnalytics {
  totalStays: number;
  totalRevenue: number;
  averageSpendPerStay: number;
  averageLengthOfStay: number;
  totalNights: number;
  firstStay: string | null;
  lastStay: string | null;
  stayFrequency: string; // e.g., "Monthly", "Quarterly", "Annual", "One-time"
  mostBookedRoomType: string | null;
  preferredBookingSource: string | null;
  cancellationRate: number;
  revenueByMonth: { month: string; revenue: number }[];
  staysByYear: { year: string; count: number }[];
}

export function useGuestAnalytics(guestId?: string) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["guest-analytics", tenantId, guestId],
    queryFn: async (): Promise<GuestAnalytics | null> => {
      if (!tenantId || !guestId) return null;

      // Fetch all reservations for this guest
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("*, reservation_rooms(room_type_id, room_types:room_type_id(name))")
        .eq("tenant_id", tenantId)
        .eq("guest_id", guestId)
        .order("check_in_date", { ascending: true });

      if (error) throw error;

      if (!reservations || reservations.length === 0) {
        return {
          totalStays: 0,
          totalRevenue: 0,
          averageSpendPerStay: 0,
          averageLengthOfStay: 0,
          totalNights: 0,
          firstStay: null,
          lastStay: null,
          stayFrequency: "New Guest",
          mostBookedRoomType: null,
          preferredBookingSource: null,
          cancellationRate: 0,
          revenueByMonth: [],
          staysByYear: [],
        };
      }

      // Calculate metrics
      const completedStays = reservations.filter(
        (r) => r.status === "checked_out" || r.status === "checked_in"
      );
      const cancelledStays = reservations.filter((r) => r.status === "cancelled");
      
      const totalStays = completedStays.length;
      const totalRevenue = completedStays.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const averageSpendPerStay = totalStays > 0 ? totalRevenue / totalStays : 0;

      // Calculate total nights and average length
      let totalNights = 0;
      completedStays.forEach((r) => {
        const checkIn = parseISO(r.check_in_date);
        const checkOut = parseISO(r.check_out_date);
        totalNights += differenceInDays(checkOut, checkIn);
      });
      const averageLengthOfStay = totalStays > 0 ? totalNights / totalStays : 0;

      // First and last stay
      const firstStay = reservations[0]?.check_in_date || null;
      const lastStay = reservations[reservations.length - 1]?.check_in_date || null;

      // Stay frequency calculation
      let stayFrequency = "New Guest";
      if (totalStays >= 2 && firstStay && lastStay) {
        const firstDate = parseISO(firstStay);
        const lastDate = parseISO(lastStay);
        const monthsBetween = differenceInDays(lastDate, firstDate) / 30;
        const staysPerMonth = totalStays / Math.max(monthsBetween, 1);
        
        if (staysPerMonth >= 1) stayFrequency = "Weekly/Regular";
        else if (staysPerMonth >= 0.25) stayFrequency = "Monthly";
        else if (staysPerMonth >= 0.08) stayFrequency = "Quarterly";
        else stayFrequency = "Annual";
      } else if (totalStays === 1) {
        stayFrequency = "One-time";
      }

      // Most booked room type
      const roomTypeCounts: Record<string, number> = {};
      reservations.forEach((r) => {
        const rooms = r.reservation_rooms as any[];
        rooms?.forEach((room) => {
          const roomTypeName = room.room_types?.name || "Unknown";
          roomTypeCounts[roomTypeName] = (roomTypeCounts[roomTypeName] || 0) + 1;
        });
      });
      const mostBookedRoomType = Object.entries(roomTypeCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      // Preferred booking source
      const sourceCounts: Record<string, number> = {};
      reservations.forEach((r) => {
        sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
      });
      const preferredBookingSource = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      // Cancellation rate
      const cancellationRate = reservations.length > 0 
        ? (cancelledStays.length / reservations.length) * 100 
        : 0;

      // Revenue by month (last 12 months)
      const revenueByMonth: { month: string; revenue: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStr = format(monthDate, "MMM yyyy");
        const monthStart = format(monthDate, "yyyy-MM-01");
        const monthEnd = format(subMonths(monthDate, -1), "yyyy-MM-01");
        
        const monthRevenue = completedStays
          .filter((r) => r.check_in_date >= monthStart && r.check_in_date < monthEnd)
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);
        
        revenueByMonth.push({ month: monthStr, revenue: monthRevenue });
      }

      // Stays by year
      const staysByYearMap: Record<string, number> = {};
      completedStays.forEach((r) => {
        const year = r.check_in_date.substring(0, 4);
        staysByYearMap[year] = (staysByYearMap[year] || 0) + 1;
      });
      const staysByYear = Object.entries(staysByYearMap)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year.localeCompare(b.year));

      return {
        totalStays,
        totalRevenue,
        averageSpendPerStay,
        averageLengthOfStay,
        totalNights,
        firstStay,
        lastStay,
        stayFrequency,
        mostBookedRoomType,
        preferredBookingSource,
        cancellationRate,
        revenueByMonth,
        staysByYear,
      };
    },
    enabled: !!tenantId && !!guestId,
  });
}
