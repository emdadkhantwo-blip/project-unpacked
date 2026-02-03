import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isSameDay, format } from "date-fns";
import { BedDouble, CheckCircle2, AlertCircle, AlertTriangle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useRooms } from "@/hooks/useRooms";
import type { Reservation } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";
import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import type { RoomStatus } from "@/types/database";

interface RoomAssignment {
  reservationRoomId: string;
  roomId: string;
}

interface OccupantInfo {
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
}

interface AvailableRoom {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
  occupant?: OccupantInfo;
}

interface RoomAssignmentDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (assignments: RoomAssignment[]) => void;
  isLoading?: boolean;
  /** If true, this is assignment-only mode (not check-in) */
  assignmentOnly?: boolean;
}

/**
 * Hook to get available rooms for check-in assignment.
 * - For same-day check-in: Only shows vacant rooms (physically ready)
 * - For future check-in: Shows all rooms without date conflicts (includes occupied/dirty)
 * - Also fetches current occupant info for occupied rooms
 */
function useAvailableRoomsByType(
  roomTypeId: string | null,
  propertyId: string | null,
  checkInDate: Date | null,
  checkOutDate: Date | null
) {
  const isToday = checkInDate ? isSameDay(checkInDate, new Date()) : true;

  return useQuery({
    queryKey: ["available-rooms-assignment", propertyId, roomTypeId, checkInDate?.toISOString(), checkOutDate?.toISOString()],
    queryFn: async (): Promise<AvailableRoom[]> => {
      if (!propertyId || !roomTypeId) return [];

      // Build base query for all active rooms of this type
      let query = supabase
        .from("rooms")
        .select("id, room_number, floor, status")
        .eq("property_id", propertyId)
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true)
        .order("room_number");

      // For same-day check-in, only show vacant rooms (must be physically ready)
      if (isToday) {
        query = query.eq("status", "vacant");
      }

      const { data: rooms, error: roomsError } = await query;
      if (roomsError) throw roomsError;

      // Fetch current occupants for occupied rooms
      const occupiedRoomIds = rooms?.filter(r => r.status === "occupied").map(r => r.id) || [];
      let occupantMap = new Map<string, OccupantInfo>();

      if (occupiedRoomIds.length > 0) {
        const { data: currentOccupants } = await supabase
          .from("reservation_rooms")
          .select(`
            room_id,
            reservation:reservations!inner(
              check_in_date,
              check_out_date,
              status,
              guest:guests(first_name, last_name)
            )
          `)
          .in("room_id", occupiedRoomIds)
          .eq("reservation.status", "checked_in");

        currentOccupants?.forEach((occ) => {
          const res = occ.reservation as any;
          if (res?.guest && occ.room_id) {
            occupantMap.set(occ.room_id, {
              guestName: `${res.guest.first_name} ${res.guest.last_name}`,
              checkInDate: res.check_in_date,
              checkOutDate: res.check_out_date,
            });
          }
        });
      }

      // For future dates, also filter by reservation conflicts
      if (!isToday && checkInDate && checkOutDate) {
        const checkInStr = checkInDate.toISOString().split("T")[0];
        const checkOutStr = checkOutDate.toISOString().split("T")[0];

        // Get rooms with conflicting reservations
        const { data: bookedRooms, error: bookedError } = await supabase
          .from("reservation_rooms")
          .select(`
            room_id,
            reservation:reservations!inner(
              check_in_date,
              check_out_date,
              status
            )
          `)
          .not("room_id", "is", null)
          .in("reservation.status", ["confirmed", "checked_in"]);

        if (bookedError) throw bookedError;

        const bookedRoomIds = new Set(
          bookedRooms
            ?.filter((br) => {
              const res = br.reservation as any;
              // Check for date overlap
              return res.check_in_date < checkOutStr && res.check_out_date > checkInStr;
            })
            .map((br) => br.room_id)
        );

        return rooms?.filter((room) => !bookedRoomIds.has(room.id)).map(room => ({
          ...room,
          occupant: occupantMap.get(room.id),
        })) || [];
      }

      return rooms?.map(room => ({
        ...room,
        occupant: occupantMap.get(room.id),
      })) || [];
    },
    enabled: !!propertyId && !!roomTypeId,
  });
}

interface RoomSelectorProps {
  reservationRoom: {
    id: string;
    room_id: string | null;
    room_type?: { id: string; name: string; code: string } | null;
    room?: { id: string; room_number: string } | null;
  };
  propertyId: string;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  usedRoomIds: Set<string>;
  checkInDate: Date;
  checkOutDate: Date;
}

function RoomSelector({
  reservationRoom,
  propertyId,
  selectedRoomId,
  onSelectRoom,
  usedRoomIds,
  checkInDate,
  checkOutDate,
}: RoomSelectorProps) {
  const isToday = isSameDay(checkInDate, new Date());
  const { data: availableRooms, isLoading } = useAvailableRoomsByType(
    reservationRoom.room_type?.id ?? null,
    propertyId,
    checkInDate,
    checkOutDate
  );

  // Filter out rooms already selected for other reservation_rooms
  const filteredRooms = availableRooms?.filter(
    (room) => !usedRoomIds.has(room.id) || room.id === selectedRoomId
  );

  const hasPreAssigned = reservationRoom.room_id && reservationRoom.room;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {reservationRoom.room_type?.name || "Unknown Room Type"}
          </span>
          <Badge variant="outline" className="text-xs">
            {reservationRoom.room_type?.code}
          </Badge>
        </div>
        {hasPreAssigned && (
          <Badge variant="secondary" className="text-xs">
            Pre-assigned: {reservationRoom.room?.room_number}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Select Room {filteredRooms?.length === 0 && (isToday ? "(No vacant rooms available)" : "(No rooms available for these dates)")}
          </Label>
          <Select
            value={selectedRoomId || ""}
            onValueChange={onSelectRoom}
            disabled={filteredRooms?.length === 0}
          >
            <SelectTrigger
              className={cn(
                selectedRoomId && "border-success",
                !selectedRoomId && filteredRooms && filteredRooms.length > 0 && "border-warning"
              )}
            >
              <SelectValue placeholder="Select a room..." />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {filteredRooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.room_number}</span>
                      {room.floor && (
                        <span className="text-xs text-muted-foreground">
                          Floor {room.floor}
                        </span>
                      )}
                      {/* Show status badge for non-vacant rooms (future bookings) */}
                      {room.status !== "vacant" && (
                        <RoomStatusBadge 
                          status={room.status as RoomStatus} 
                          size="sm" 
                        />
                      )}
                    </div>
                    {/* Show occupant info for occupied rooms */}
                    {room.status === "occupied" && room.occupant && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{room.occupant.guestName}</span>
                        <span className="text-muted-foreground/70">
                          ({format(new Date(room.occupant.checkInDate), "MMM d")} - {format(new Date(room.occupant.checkOutDate), "MMM d")})
                        </span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function RoomAssignmentDialog({
  reservation,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  assignmentOnly = false,
}: RoomAssignmentDialogProps) {
  const navigate = useNavigate();
  const { currentProperty } = useTenant();
  const { data: allRooms } = useRooms();
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());

  // Check if any rooms exist at all
  const hasAnyRooms = (allRooms?.length || 0) > 0;

  // Initialize assignments from existing room assignments
  useEffect(() => {
    if (reservation && open) {
      const initialAssignments = new Map<string, string>();
      reservation.reservation_rooms.forEach((rr) => {
        if (rr.room_id) {
          initialAssignments.set(rr.id, rr.room_id);
        }
      });
      setAssignments(initialAssignments);
    }
  }, [reservation, open]);

  if (!reservation || !currentProperty) return null;

  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const handleSelectRoom = (reservationRoomId: string, roomId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.set(reservationRoomId, roomId);
      return next;
    });
  };

  const handleConfirm = () => {
    const roomAssignments: RoomAssignment[] = [];
    assignments.forEach((roomId, reservationRoomId) => {
      roomAssignments.push({ reservationRoomId, roomId });
    });
    onConfirm(roomAssignments);
  };

  // Collect all currently selected room IDs to prevent duplicate selection
  const usedRoomIds = new Set(assignments.values());

  const allRoomsAssigned = reservation.reservation_rooms.every((rr) =>
    assignments.has(rr.id)
  );

  const assignedCount = assignments.size;
  const totalRooms = reservation.reservation_rooms.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            {assignmentOnly ? "Pre-Assign Rooms" : "Room Assignment"}
          </DialogTitle>
          <DialogDescription>
            {assignmentOnly ? (
              <>Assign rooms for <strong>{guestName}</strong>'s upcoming stay.</>
            ) : (
              <>Assign rooms for <strong>{guestName}</strong>'s check-in.</>
            )}
            <br />
            <span className="text-xs">
              Confirmation: {reservation.confirmation_number}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* No Rooms Available Warning */}
          {!hasAnyRooms && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Rooms Available</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span>
                  No physical rooms have been created yet. You need to add rooms before you can check in guests.
                </span>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/rooms');
                  }}
                >
                  Go to Rooms Page →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {hasAnyRooms && reservation.reservation_rooms.map((rr) => (
            <RoomSelector
              key={rr.id}
              reservationRoom={rr}
              propertyId={currentProperty.id}
              selectedRoomId={assignments.get(rr.id) || null}
              onSelectRoom={(roomId) => handleSelectRoom(rr.id, roomId)}
              usedRoomIds={usedRoomIds}
              checkInDate={new Date(reservation.check_in_date)}
              checkOutDate={new Date(reservation.check_out_date)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
          {allRoomsAssigned ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-success">
                All {totalRooms} room{totalRooms !== 1 ? "s" : ""} assigned
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-warning">
                {assignedCount} of {totalRooms} room{totalRooms !== 1 ? "s" : ""} assigned
              </span>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allRoomsAssigned || isLoading}
          >
            {isLoading 
              ? (assignmentOnly ? "Saving..." : "Checking In...") 
              : (assignmentOnly ? "Save Assignments" : "Confirm Check-In")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
