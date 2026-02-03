import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import {
  useReservations,
  useReservationStats,
  useCheckIn,
  useCheckOut,
  useCancelReservation,
  useDeleteReservation,
  useAssignRooms,
  type ReservationStatus,
  type Reservation,
  type CheckoutResult,
} from "@/hooks/useReservations";
import { useReservationNotifications } from "@/hooks/useReservationNotifications";
import { useRoomSetupStatus } from "@/hooks/useRoomSetupStatus";
import { ReservationStatsBar } from "@/components/reservations/ReservationStatsBar";
import { ReservationFilters } from "@/components/reservations/ReservationFilters";
import { ReservationListItem } from "@/components/reservations/ReservationListItem";
import { ReservationDetailDrawer } from "@/components/reservations/ReservationDetailDrawer";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { RoomAssignmentDialog } from "@/components/front-desk/RoomAssignmentDialog";
import { CheckoutSuccessModal, type CheckoutData } from "@/components/front-desk/CheckoutSuccessModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reservations() {
  const navigate = useNavigate();
  
  // Enable real-time notifications for reservations
  useReservationNotifications();

  const { data: reservations, isLoading } = useReservations();
  const { data: stats, isLoading: isLoadingStats } = useReservationStats();
  const { hasRoomTypes, hasRooms, isReady } = useRoomSetupStatus();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const cancelReservation = useCancelReservation();
  const deleteReservation = useDeleteReservation();
  const assignRooms = useAssignRooms();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Detail drawer
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New reservation dialog
  const [newReservationOpen, setNewReservationOpen] = useState(false);

  // Room assignment dialog for check-in
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<Reservation | null>(null);
  
  // Quick room assignment dialog (assignment only, no check-in)
  const [quickAssignmentOpen, setQuickAssignmentOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<Reservation | null>(null);

  // Dialogs
  const [checkOutDialog, setCheckOutDialog] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    if (!reservations) return [];

    return reservations.filter((res) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesConfirmation = res.confirmation_number.toLowerCase().includes(query);
        const matchesGuest = res.guest
          ? `${res.guest.first_name} ${res.guest.last_name}`.toLowerCase().includes(query)
          : false;
        const matchesEmail = res.guest?.email?.toLowerCase().includes(query);
        if (!matchesConfirmation && !matchesGuest && !matchesEmail) return false;
      }

      // Status filter
      if (statusFilter !== "all" && res.status !== statusFilter) return false;

      // Date range filter
      if (dateRange.from) {
        const checkInDate = new Date(res.check_in_date);
        if (checkInDate < dateRange.from) return false;
      }
      if (dateRange.to) {
        const checkInDate = new Date(res.check_in_date);
        if (checkInDate > dateRange.to) return false;
      }

      return true;
    });
  }, [reservations, searchQuery, statusFilter, dateRange]);

  const handleCheckIn = (reservationId: string) => {
    const reservation = reservations?.find((r) => r.id === reservationId);
    if (reservation) {
      setPendingCheckIn(reservation);
      setRoomAssignmentOpen(true);
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

  const handleQuickAssign = (reservationId: string) => {
    const reservation = reservations?.find((r) => r.id === reservationId);
    if (reservation) {
      setPendingAssignment(reservation);
      setQuickAssignmentOpen(true);
    }
  };

  const confirmQuickAssign = (assignments: Array<{ reservationRoomId: string; roomId: string }>) => {
    if (pendingAssignment) {
      assignRooms.mutate(
        { reservationId: pendingAssignment.id, roomAssignments: assignments },
        {
          onSuccess: () => {
            setQuickAssignmentOpen(false);
            setPendingAssignment(null);
          },
        }
      );
    }
  };

  const handleCheckOut = (reservationId: string) => {
    setCheckOutDialog(reservationId);
  };

  const confirmCheckOut = () => {
    if (checkOutDialog) {
      checkOut.mutate(checkOutDialog, {
        onSuccess: (data: CheckoutResult) => {
          setCheckOutDialog(null);
          if (data.checkoutData) {
            setCheckoutData(data.checkoutData);
            setCheckoutSuccessOpen(true);
          }
        },
      });
    }
  };

  const handleCancel = (reservationId: string) => {
    setCancelDialog(reservationId);
  };

  const confirmCancel = () => {
    if (cancelDialog) {
      cancelReservation.mutate(cancelDialog);
      setCancelDialog(null);
    }
  };

  const handleView = (reservationId: string) => {
    const reservation = reservations?.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setDrawerOpen(true);
    }
  };

  const handleDrawerCheckIn = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setPendingCheckIn(selectedReservation);
      setRoomAssignmentOpen(true);
    }
  };

  const handleDrawerCheckOut = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setCheckOutDialog(selectedReservation.id);
    }
  };

  const handleDrawerCancel = () => {
    if (selectedReservation) {
      setDrawerOpen(false);
      setCancelDialog(selectedReservation.id);
    }
  };

  const handleDrawerDelete = () => {
    if (selectedReservation) {
      deleteReservation.mutate(selectedReservation.id);
      setSelectedReservation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ReservationStatsBar stats={null} isLoading />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Room Setup Required Banner */}
      {!isReady && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Complete Your Hotel Setup</h4>
                <p className="text-sm text-muted-foreground">
                  {!hasRoomTypes && !hasRooms && "Create room types and add rooms to start accepting reservations."}
                  {hasRoomTypes && !hasRooms && "Add physical rooms to enable check-ins for reservations."}
                  {!hasRoomTypes && hasRooms && "Create room types to categorize your rooms."}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/rooms')} className="shrink-0">
              Set Up Rooms
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <ReservationStatsBar stats={stats || null} isLoading={isLoadingStats} />

      {/* Header with Filters and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ReservationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <Button onClick={() => setNewReservationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Reservation
        </Button>
      </div>

      {/* No Results */}
      {filteredReservations.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-muted-foreground">
          No reservations found matching your filters
        </div>
      )}

      {/* Reservations List */}
      {filteredReservations.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Confirmation #</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="w-[180px]">Dates</TableHead>
                <TableHead className="w-[120px]">Room(s)</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <ReservationListItem
                  key={reservation.id}
                  reservation={reservation}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onCancel={handleCancel}
                  onView={handleView}
                  onDelete={(id) => deleteReservation.mutate(id)}
                  onAssignRooms={handleQuickAssign}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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

      {/* Quick Room Assignment Dialog (Pre-assignment without check-in) */}
      <RoomAssignmentDialog
        reservation={pendingAssignment}
        open={quickAssignmentOpen}
        onOpenChange={(open) => {
          setQuickAssignmentOpen(open);
          if (!open) setPendingAssignment(null);
        }}
        onConfirm={confirmQuickAssign}
        isLoading={assignRooms.isPending}
        assignmentOnly
      />

      {/* Check-Out Confirmation Dialog */}
      <AlertDialog open={!!checkOutDialog} onOpenChange={() => setCheckOutDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out this guest? This will mark the reservation as checked out
              and update the room status to dirty for housekeeping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCheckOut} disabled={checkOut.isPending}>
              {checkOut.isPending ? "Processing..." : "Check Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel} 
              disabled={cancelReservation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelReservation.isPending ? "Cancelling..." : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reservation Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCheckIn={handleDrawerCheckIn}
        onCheckOut={handleDrawerCheckOut}
        onCancel={handleDrawerCancel}
        onDelete={handleDrawerDelete}
      />

      {/* New Reservation Dialog */}
      <NewReservationDialog
        open={newReservationOpen}
        onOpenChange={setNewReservationOpen}
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
