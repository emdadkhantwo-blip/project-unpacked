import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { MoreHorizontal, LogIn, LogOut, XCircle, Eye, Star, Trash2, BedDouble } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import type { Reservation } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";

interface ReservationListItemProps {
  reservation: Reservation;
  onCheckIn: (reservationId: string) => void;
  onCheckOut: (reservationId: string) => void;
  onCancel: (reservationId: string) => void;
  onView: (reservationId: string) => void;
  onDelete?: (reservationId: string) => void;
  onAssignRooms?: (reservationId: string) => void;
}

export function ReservationListItem({
  reservation,
  onCheckIn,
  onCheckOut,
  onCancel,
  onView,
  onDelete,
  onAssignRooms,
}: ReservationListItemProps) {
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const roomInfo = reservation.reservation_rooms
    .map((rr) => rr.room?.room_number || rr.room_type?.code || "TBA")
    .join(", ");

  const nights = differenceInCalendarDays(
    parseISO(reservation.check_out_date),
    parseISO(reservation.check_in_date)
  );

  const canCheckIn = reservation.status === "confirmed";
  const canCheckOut = reservation.status === "checked_in";
  const canCancel = reservation.status === "confirmed";
  const canDelete = reservation.status === "confirmed" || reservation.status === "cancelled";
  
  // Show "Assign Rooms" option for confirmed reservations with unassigned rooms
  const hasUnassignedRooms = reservation.reservation_rooms.some(rr => !rr.room_id);
  const canAssignRooms = reservation.status === "confirmed" && hasUnassignedRooms;

  const getRowBorderColor = () => {
    if (reservation.guest?.is_vip) return "border-l-amber-500";
    switch (reservation.status) {
      case "checked_in": return "border-l-emerald-500";
      case "confirmed": return "border-l-blue-500";
      case "cancelled": return "border-l-rose-500";
      case "checked_out": return "border-l-slate-400";
      default: return "border-l-muted";
    }
  };

  return (
    <TableRow className={cn(
      "hover:bg-muted/30 transition-colors border-l-4",
      getRowBorderColor()
    )}>
      <TableCell className="font-mono text-sm">
        <span className="bg-muted/50 px-2 py-1 rounded text-xs">
          {reservation.confirmation_number}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{guestName}</span>
          {reservation.guest?.is_vip && (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          )}
        </div>
        {reservation.guest?.email && (
          <p className="text-xs text-muted-foreground">{reservation.guest.email}</p>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {format(parseISO(reservation.check_in_date), "MMM d")} -{" "}
          {format(parseISO(reservation.check_out_date), "MMM d, yyyy")}
        </div>
        <p className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded inline-block mt-0.5">
          {nights} night{nights !== 1 ? "s" : ""}
        </p>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{roomInfo || "Not assigned"}</span>
      </TableCell>
      <TableCell>
        <ReservationStatusBadge status={reservation.status} />
      </TableCell>
      <TableCell className="text-right">
        <span className="font-semibold text-emerald-600">
          ৳{reservation.total_amount.toLocaleString()}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <DropdownMenuItem onClick={() => onView(reservation.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canAssignRooms && onAssignRooms && (
              <DropdownMenuItem onClick={() => onAssignRooms(reservation.id)}>
                <BedDouble className="mr-2 h-4 w-4" />
                Assign Rooms
              </DropdownMenuItem>
            )}
            {canCheckIn && (
              <DropdownMenuItem onClick={() => onCheckIn(reservation.id)}>
                <LogIn className="mr-2 h-4 w-4" />
                Check In
              </DropdownMenuItem>
            )}
            {canCheckOut && (
              <DropdownMenuItem onClick={() => onCheckOut(reservation.id)}>
                <LogOut className="mr-2 h-4 w-4" />
                Check Out
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onCancel(reservation.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Reservation
                </DropdownMenuItem>
              </>
            )}
            {canDelete && onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(reservation.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Reservation
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
