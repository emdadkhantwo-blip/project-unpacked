import { useState, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUpdateReservation } from "@/hooks/useReservations";
import type { Reservation } from "@/hooks/useReservations";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

interface ExtendStayDialogProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedReservation: Reservation) => void;
}

export function ExtendStayDialog({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: ExtendStayDialogProps) {
  const originalCheckIn = parseISO(reservation.check_in_date);
  const originalCheckOut = parseISO(reservation.check_out_date);
  
  const [newCheckInDate, setNewCheckInDate] = useState<Date | undefined>(originalCheckIn);
  const [newCheckOutDate, setNewCheckOutDate] = useState<Date | undefined>(originalCheckOut);
  const [isChecking, setIsChecking] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  
  const updateReservation = useUpdateReservation();

  // Calculate room rate from reservation
  const averageRatePerNight = useMemo(() => {
    const originalNights = differenceInDays(originalCheckOut, originalCheckIn);
    if (originalNights <= 0) return 0;
    return reservation.total_amount / originalNights;
  }, [reservation.total_amount, originalCheckOut, originalCheckIn]);

  // Calculate new nights and cost difference
  const { originalNights, newNights, nightsDifference, costDifference, newTotal } = useMemo(() => {
    const origNights = differenceInDays(originalCheckOut, originalCheckIn);
    
    if (!newCheckInDate || !newCheckOutDate) {
      return { 
        originalNights: origNights, 
        newNights: origNights, 
        nightsDifference: 0, 
        costDifference: 0, 
        newTotal: reservation.total_amount 
      };
    }
    
    const calcNewNights = differenceInDays(newCheckOutDate, newCheckInDate);
    const diff = calcNewNights - origNights;
    const cost = diff * averageRatePerNight;
    
    return {
      originalNights: origNights,
      newNights: calcNewNights,
      nightsDifference: diff,
      costDifference: cost,
      newTotal: reservation.total_amount + cost,
    };
  }, [newCheckInDate, newCheckOutDate, originalCheckIn, originalCheckOut, averageRatePerNight, reservation.total_amount]);

  // Check room availability for the new date range
  const checkRoomAvailability = async (): Promise<{
    available: boolean;
    conflicts: string[];
  }> => {
    if (!newCheckInDate || !newCheckOutDate) {
      return { available: false, conflicts: [] };
    }

    // Get the room_id from reservation_rooms
    const roomId = reservation.reservation_rooms?.[0]?.room_id;
    if (!roomId) {
      // No room assigned, no conflict possible
      return { available: true, conflicts: [] };
    }

    const newCheckIn = format(newCheckInDate, "yyyy-MM-dd");
    const newCheckOut = format(newCheckOutDate, "yyyy-MM-dd");

    // Query for overlapping reservations (excluding current)
    const { data: conflicts, error } = await supabase
      .from("reservations")
      .select(`
        id,
        confirmation_number,
        check_in_date,
        check_out_date,
        reservation_rooms!inner(room_id)
      `)
      .neq("id", reservation.id)
      .eq("reservation_rooms.room_id", roomId)
      .in("status", ["confirmed", "checked_in"])
      .lte("check_in_date", newCheckOut)
      .gt("check_out_date", newCheckIn);

    if (error) {
      console.error("Availability check error:", error);
      return { available: true, conflicts: [] }; // Fail open
    }

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map((c) => c.confirmation_number),
    };
  };

  const handleConfirm = async () => {
    if (!newCheckInDate || !newCheckOutDate || newNights <= 0) return;

    setIsChecking(true);
    setConflictError(null);

    // Check availability first
    const { available, conflicts } = await checkRoomAvailability();

    if (!available) {
      setConflictError(`Room not available. Conflicts with: ${conflicts.join(", ")}`);
      setIsChecking(false);
      return;
    }

    try {
      await updateReservation.mutateAsync({
        reservationId: reservation.id,
        updates: {
          check_in_date: format(newCheckInDate, "yyyy-MM-dd"),
          check_out_date: format(newCheckOutDate, "yyyy-MM-dd"),
          total_amount: newTotal,
        },
      });

      // Construct the updated reservation with new values
      const updatedReservation: Reservation = {
        ...reservation,
        check_in_date: format(newCheckInDate, "yyyy-MM-dd"),
        check_out_date: format(newCheckOutDate, "yyyy-MM-dd"),
        total_amount: newTotal,
      };

      onOpenChange(false);
      onSuccess?.(updatedReservation);
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Reset dates when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNewCheckInDate(originalCheckIn);
      setNewCheckOutDate(originalCheckOut);
      setConflictError(null);
    }
    onOpenChange(isOpen);
  };

  const hasChanges = newCheckInDate && newCheckOutDate && (
    format(newCheckInDate, "yyyy-MM-dd") !== reservation.check_in_date ||
    format(newCheckOutDate, "yyyy-MM-dd") !== reservation.check_out_date
  );

  const isValid = newCheckInDate && newCheckOutDate && newNights > 0 && hasChanges;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modify Stay Dates</DialogTitle>
          <DialogDescription>
            Change the check-in and/or check-out dates for this reservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Dates Summary */}
          <div className="rounded-lg border p-3 bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Check-In</span>
              <span className="font-medium">
                {format(originalCheckIn, "EEE, MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original Check-Out</span>
              <span className="font-medium">
                {format(originalCheckOut, "EEE, MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Original Nights</span>
              <span className="font-medium">{originalNights}</span>
            </div>
          </div>

          {/* Conflict Error */}
          {conflictError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {conflictError}
            </div>
          )}

          {/* New Check-In Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Check-In Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newCheckInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newCheckInDate ? (
                    format(newCheckInDate, "EEE, MMM d, yyyy")
                  ) : (
                    <span>Select check-in date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newCheckInDate}
                  onSelect={(date) => {
                    setNewCheckInDate(date);
                    setConflictError(null);
                    // Ensure check-out is after check-in
                    if (date && newCheckOutDate && date >= newCheckOutDate) {
                      setNewCheckOutDate(undefined);
                    }
                  }}
                  disabled={(date) => 
                    (newCheckOutDate ? date >= newCheckOutDate : false)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Check-Out Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Check-Out Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newCheckOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newCheckOutDate ? (
                    format(newCheckOutDate, "EEE, MMM d, yyyy")
                  ) : (
                    <span>Select check-out date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newCheckOutDate}
                  onSelect={(date) => {
                    setNewCheckOutDate(date);
                    setConflictError(null);
                  }}
                  disabled={(date) => 
                    (newCheckInDate ? date <= newCheckInDate : false)
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cost Summary */}
          {hasChanges && newNights > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Duration</span>
                <span className="font-medium">{newNights} night{newNights !== 1 ? 's' : ''}</span>
              </div>
              {nightsDifference !== 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate per Night</span>
                    <span>{formatCurrency(averageRatePerNight)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {nightsDifference > 0 ? 'Additional' : 'Reduced'} Nights
                    </span>
                    <span className={cn(
                      "font-medium",
                      nightsDifference > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {nightsDifference > 0 ? '+' : ''}{nightsDifference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost Adjustment</span>
                    <span className={cn(
                      "font-medium",
                      costDifference > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {costDifference >= 0 ? '+' : ''}{formatCurrency(costDifference)}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">New Total</span>
                <span className="font-bold">{formatCurrency(newTotal)}</span>
              </div>
            </div>
          )}

          {/* Validation message */}
          {newCheckInDate && newCheckOutDate && newNights <= 0 && (
            <p className="text-sm text-destructive">
              Check-out date must be after check-in date
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || updateReservation.isPending || isChecking}
          >
            {isChecking ? "Checking availability..." : updateReservation.isPending ? "Updating..." : "Confirm Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
