import { useState, useEffect } from "react";
import { format } from "date-fns";
import { LogIn, LogOut, Hotel, Clock } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useTodayArrivals, useTodayDepartures, useInHouseGuests } from "@/hooks/useFrontDesk";
import { useCheckIn, type CheckoutResult } from "@/hooks/useReservations";
import { useRoomStats } from "@/hooks/useRooms";
import { useReservationNotifications } from "@/hooks/useReservationNotifications";
import { useHousekeepingNotifications } from "@/hooks/useHousekeepingNotifications";
import { FrontDeskStatsBar } from "@/components/front-desk/FrontDeskStatsBar";
import { GuestListCard } from "@/components/front-desk/GuestListCard";
import { QuickActions } from "@/components/front-desk/QuickActions";
import { RoomAssignmentDialog } from "@/components/front-desk/RoomAssignmentDialog";
import { GuestSearchDialog } from "@/components/front-desk/GuestSearchDialog";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { CheckoutSuccessModal, type CheckoutData } from "@/components/front-desk/CheckoutSuccessModal";
import { CheckoutDialog } from "@/components/front-desk/CheckoutDialog";
import type { FrontDeskReservation } from "@/hooks/useFrontDesk";
import type { Reservation } from "@/hooks/useReservations";
import { useNavigate } from "react-router-dom";

export default function FrontDesk() {
  // Enable real-time notifications for reservations and housekeeping
  useReservationNotifications();
  useHousekeepingNotifications();

  const navigate = useNavigate();
  const { currentProperty } = useTenant();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data hooks
  const { data: arrivals = [], isLoading: arrivalsLoading } = useTodayArrivals();
  const { data: departures = [], isLoading: departuresLoading } = useTodayDepartures();
  const { data: inHouse = [], isLoading: inHouseLoading } = useInHouseGuests();
  const { data: roomStats, isLoading: roomStatsLoading } = useRoomStats();

  // Mutations
  const checkInMutation = useCheckIn();

  // UI State
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newReservationOpen, setNewReservationOpen] = useState(false);
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<FrontDeskReservation | null>(null);
  const [pendingCheckOut, setPendingCheckOut] = useState<FrontDeskReservation | null>(null);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleViewDetails = (reservation: FrontDeskReservation) => {
    setSelectedReservation(reservation);
    setDrawerOpen(true);
  };

  const handleCheckInClick = (reservation: FrontDeskReservation) => {
    setPendingCheckIn(reservation);
    setRoomAssignmentOpen(true);
  };

  const handleCheckOutClick = (reservation: FrontDeskReservation) => {
    setPendingCheckOut(reservation);
    setCheckOutDialogOpen(true);
  };

  const confirmCheckIn = (assignments: Array<{ reservationRoomId: string; roomId: string }>) => {
    if (pendingCheckIn) {
      checkInMutation.mutate(
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

  const handleCheckoutSuccess = (data: CheckoutData) => {
    setCheckOutDialogOpen(false);
    setPendingCheckOut(null);
    setCheckoutData(data);
    setCheckoutSuccessOpen(true);
  };

  const handleGuestSelect = (guestId: string) => {
    navigate(`/guests?selected=${guestId}`);
  };

  const handleReservationSelect = (reservationId: string) => {
    navigate(`/reservations?selected=${reservationId}`);
  };

  const isLoading = arrivalsLoading || departuresLoading || inHouseLoading || roomStatsLoading;

  return (
    <div className="space-y-6">
      {/* Header with time */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Front Desk</h1>
          <p className="text-sm text-muted-foreground">
            {currentProperty?.name} — {format(currentTime, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-lg font-medium tabular-nums">
            {format(currentTime, "HH:mm")}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <FrontDeskStatsBar
        arrivalsCount={arrivals.length}
        departuresCount={departures.length}
        inHouseCount={inHouse.length}
        vacantRoomsCount={roomStats?.vacant ?? 0}
        dirtyRoomsCount={roomStats?.dirty ?? 0}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions
        onNewReservation={() => setNewReservationOpen(true)}
        onSearchGuest={() => setGuestSearchOpen(true)}
      />

      {/* Guest Lists Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Arrivals */}
        <GuestListCard
          title="Today's Arrivals"
          description="Guests expected to check in"
          icon={<LogIn className="h-4 w-4 text-white" />}
          guests={arrivals}
          isLoading={arrivalsLoading}
          emptyMessage="No arrivals scheduled for today"
          type="arrivals"
          onCheckIn={handleCheckInClick}
          onViewDetails={handleViewDetails}
        />

        {/* Departures */}
        <GuestListCard
          title="Today's Departures"
          description="Guests expected to check out"
          icon={<LogOut className="h-4 w-4 text-white" />}
          guests={departures}
          isLoading={departuresLoading}
          emptyMessage="No departures scheduled for today"
          type="departures"
          onCheckOut={handleCheckOutClick}
          onViewDetails={handleViewDetails}
        />

        {/* In House */}
        <GuestListCard
          title="In House Guests"
          description="Currently staying guests"
          icon={<Hotel className="h-4 w-4 text-white" />}
          guests={inHouse}
          isLoading={inHouseLoading}
          emptyMessage="No guests currently in house"
          type="in-house"
          onCheckOut={handleCheckOutClick}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={() => {
          if (selectedReservation) {
            setDrawerOpen(false);
            handleCheckInClick(selectedReservation);
          }
        }}
        onCheckOut={() => {
          if (selectedReservation) {
            setDrawerOpen(false);
            handleCheckOutClick(selectedReservation);
          }
        }}
        onCancel={() => {
          // Not needed for front desk
        }}
      />

      {/* New Reservation Dialog */}
      <NewReservationDialog
        open={newReservationOpen}
        onOpenChange={setNewReservationOpen}
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
        isLoading={checkInMutation.isPending}
      />

      {/* Guest Search Dialog */}
      <GuestSearchDialog
        open={guestSearchOpen}
        onOpenChange={setGuestSearchOpen}
        onSelectGuest={handleGuestSelect}
        onSelectReservation={handleReservationSelect}
      />

      {/* Checkout Dialog with Payment Selection */}
      <CheckoutDialog
        reservation={pendingCheckOut}
        open={checkOutDialogOpen}
        onOpenChange={(open) => {
          setCheckOutDialogOpen(open);
          if (!open) setPendingCheckOut(null);
        }}
        onSuccess={handleCheckoutSuccess}
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
