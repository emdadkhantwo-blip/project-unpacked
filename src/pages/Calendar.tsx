import { useState } from "react";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { useCalendarReservations, type CalendarReservation } from "@/hooks/useCalendarReservations";
import { useCheckIn, useCheckOut, useCancelReservation, useMoveReservationToRoom, useDeleteReservation, useUpdateReservation, type Reservation, type CheckoutResult } from "@/hooks/useReservations";
import { useReservationNotifications } from "@/hooks/useReservationNotifications";
import { CalendarTimeline } from "@/components/calendar/CalendarTimeline";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarStatsBar } from "@/components/calendar/CalendarStatsBar";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { RoomAssignmentDialog } from "@/components/front-desk/RoomAssignmentDialog";
import { CheckoutSuccessModal, type CheckoutData } from "@/components/front-desk/CheckoutSuccessModal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Calendar() {
  // Enable real-time notifications for reservations
  useReservationNotifications();

  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [numDays, setNumDays] = useState(14);

  // Safe setter that normalizes date to start of day
  const handleStartDateChange = (date: Date) => setStartDate(startOfDay(date));
  
  // Drawer state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingReservation, setIsLoadingReservation] = useState(false);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Room assignment dialog state for check-in flow
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<Reservation | null>(null);

  const { data, isLoading, refetch, isRefetching } = useCalendarReservations(startDate, numDays);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Calendar refreshed");
  };
  
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();
  const moveReservation = useMoveReservationToRoom();
  const deleteReservation = useDeleteReservation();
  const updateReservation = useUpdateReservation();

  const handleReservationClick = async (calendarRes: CalendarReservation) => {
    setIsLoadingReservation(true);
    
    try {
      // Fetch full reservation details
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          guest:guests(id, first_name, last_name, email, phone, is_vip),
          reservation_rooms(
            id,
            room_id,
            room_type:room_types(id, name, code),
            room:rooms(id, room_number)
          )
        `)
        .eq("id", calendarRes.id)
        .single();

      if (error) throw error;

      if (data) {
        const formattedRes: Reservation = {
          ...data,
          guest: data.guest as Reservation["guest"],
          reservation_rooms: (data.reservation_rooms || []).map((rr: any) => ({
            id: rr.id,
            room_id: rr.room_id,
            room_type: rr.room_type,
            room: rr.room,
          })),
        };
        setSelectedReservation(formattedRes);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
      toast.error("Failed to load reservation details");
    } finally {
      setIsLoadingReservation(false);
    }
  };

  const handleCheckIn = () => {
    if (selectedReservation) {
      // Check if all rooms are already assigned
      const allRoomsAssigned = selectedReservation.reservation_rooms.every(rr => rr.room_id);
      
      if (allRoomsAssigned) {
        // Proceed directly if all rooms already have assignments
        checkIn.mutate({ 
          reservationId: selectedReservation.id,
          roomAssignments: selectedReservation.reservation_rooms.map(rr => ({
            reservationRoomId: rr.id,
            roomId: rr.room_id!
          }))
        });
        setDrawerOpen(false);
      } else {
        // Open room assignment dialog for unassigned rooms
        setPendingCheckIn(selectedReservation);
        setRoomAssignmentOpen(true);
        setDrawerOpen(false);
      }
    }
  };

  const confirmCheckIn = (assignments: Array<{ reservationRoomId: string; roomId: string }>) => {
    if (pendingCheckIn) {
      checkIn.mutate(
        { reservationId: pendingCheckIn.id, roomAssignments: assignments },
        {
          onSuccess: () => {
            setRoomAssignmentOpen(false);
            setPendingCheckIn(null);
          },
        }
      );
    }
  };

  const handleCheckOut = () => {
    if (selectedReservation) {
      checkOut.mutate(selectedReservation.id, {
        onSuccess: (data: CheckoutResult) => {
          setDrawerOpen(false);
          if (data.checkoutData) {
            setCheckoutData(data.checkoutData);
            setCheckoutSuccessOpen(true);
          }
        },
      });
    }
  };

  const handleCancel = () => {
    if (selectedReservation) {
      cancelReservation.mutate(selectedReservation.id);
      setDrawerOpen(false);
    }
  };

  const handleDelete = () => {
    if (selectedReservation) {
      deleteReservation.mutate(selectedReservation.id);
      setSelectedReservation(null);
    }
  };

  const handleExtendStay = (updatedReservation: Reservation) => {
    // Update the selected reservation with new data
    setSelectedReservation(updatedReservation);
    // Refresh calendar data
    queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0] === "calendar-reservations" 
    });
  };

  const handleReservationMove = (
    reservationId: string,
    reservationRoomId: string,
    newRoomId: string,
    oldRoomId: string | null
  ) => {
    moveReservation.mutate({
      reservationId,
      reservationRoomId,
      newRoomId,
      oldRoomId,
    });
  };

  const handleReservationDateChange = (
    reservationId: string,
    originalCheckInDate: string,
    originalCheckOutDate: string,
    newCheckInDate: string,
    newCheckOutDate: string,
    originalTotalAmount: number
  ) => {
    // Calculate nights difference and new price using calendar days
    const originalNights = differenceInCalendarDays(
      parseISO(originalCheckOutDate),
      parseISO(originalCheckInDate)
    );
    const newNights = differenceInCalendarDays(
      parseISO(newCheckOutDate),
      parseISO(newCheckInDate)
    );

    // Calculate rate per night from original reservation
    const ratePerNight = originalNights > 0 
      ? originalTotalAmount / originalNights 
      : 0;

    // Calculate new total
    const newTotalAmount = ratePerNight * newNights;

    updateReservation.mutate({
      reservationId,
      updates: {
        check_in_date: newCheckInDate,
        check_out_date: newCheckOutDate,
        total_amount: newTotalAmount,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CalendarStatsBar stats={null} isLoading />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <CalendarStatsBar stats={data?.stats || null} />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CalendarControls
          startDate={startDate}
          numDays={numDays}
          onStartDateChange={handleStartDateChange}
          onNumDaysChange={setNumDays}
          onRefresh={handleRefresh}
          isRefreshing={isRefetching}
        />
        <CalendarLegend />
      </div>

      {/* Timeline */}
      <CalendarTimeline
        rooms={data?.rooms || []}
        dateRange={data?.dateRange || []}
        onReservationClick={handleReservationClick}
        onReservationMove={handleReservationMove}
        onReservationDateChange={handleReservationDateChange}
      />

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onCancel={handleCancel}
        onExtendStay={handleExtendStay}
        onDelete={handleDelete}
      />

      {/* Room Assignment Dialog for Check-In */}
      <RoomAssignmentDialog
        reservation={pendingCheckIn}
        open={roomAssignmentOpen}
        onOpenChange={(open) => {
          setRoomAssignmentOpen(open);
          if (!open) setPendingCheckIn(null);
        }}
        onConfirm={confirmCheckIn}
        isLoading={checkIn.isPending}
      />

      {/* Checkout Success Modal with Invoice */}
      <CheckoutSuccessModal
        open={checkoutSuccessOpen}
        onOpenChange={setCheckoutSuccessOpen}
        checkoutData={checkoutData}
      />
    </div>
  );
}
