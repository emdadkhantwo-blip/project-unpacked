import { useMemo, forwardRef, useState } from "react";
import { format, differenceInCalendarDays, isToday, addDays, parseISO, startOfDay } from "date-fns";
import { motion, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, UserCheck, CalendarClock } from "lucide-react";
import type { CalendarRoom, CalendarReservation } from "@/hooks/useCalendarReservations";

interface CalendarTimelineProps {
  rooms: CalendarRoom[];
  dateRange: Date[];
  onReservationClick?: (reservation: CalendarReservation) => void;
  onReservationMove?: (
    reservationId: string,
    reservationRoomId: string,
    newRoomId: string,
    oldRoomId: string | null
  ) => void;
  onReservationDateChange?: (
    reservationId: string,
    originalCheckInDate: string,
    originalCheckOutDate: string,
    newCheckInDate: string,
    newCheckOutDate: string,
    originalTotalAmount: number
  ) => void;
}

const CELL_WIDTH = 48; // pixels per day
const ROW_HEIGHT = 48; // pixels per room row

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/80 border-blue-600",
  checked_in: "bg-emerald-500/80 border-emerald-600",
  checked_out: "bg-muted border-border",
  cancelled: "bg-destructive/50 border-destructive",
  no_show: "bg-orange-500/50 border-orange-600",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  confirmed: "text-white",
  checked_in: "text-white",
  checked_out: "text-muted-foreground",
  cancelled: "text-destructive-foreground",
  no_show: "text-white",
};

interface ReservationBlockProps {
  reservation: CalendarReservation;
  startDate: Date;
  dateRange: Date[];
  onClick?: (reservation: CalendarReservation) => void;
}

interface DraggableReservationBlockProps extends ReservationBlockProps {
  onDragEnd?: (info: PanInfo) => void;
  roomIndex: number;
  totalRooms: number;
  isDragEnabled: boolean;
  maxLeftOffset: number;
  maxRightOffset: number;
}

const DraggableReservationBlock = forwardRef<HTMLButtonElement, DraggableReservationBlockProps>(
  ({ reservation, startDate, dateRange, onClick, onDragEnd, roomIndex, totalRooms, isDragEnabled, maxLeftOffset, maxRightOffset }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    
    // Normalize rangeStart to start of day for consistent calculations
    const rangeStart = startOfDay(startDate);
    // rangeEnd should be the day AFTER the last visible day (exclusive)
    const rangeEnd = addDays(rangeStart, dateRange.length);

    const checkIn = parseISO(reservation.check_in_date);
    const checkOut = parseISO(reservation.check_out_date);

    // Clamp to visible range
    const visibleStart = checkIn < rangeStart ? rangeStart : checkIn;
    const visibleEnd = checkOut > rangeEnd ? rangeEnd : checkOut;

    // Use differenceInCalendarDays to ignore time components
    const startOffset = differenceInCalendarDays(visibleStart, rangeStart);
    const duration = differenceInCalendarDays(visibleEnd, visibleStart);

    // Skip if no visible portion
    if (duration <= 0) return null;

    const left = startOffset * CELL_WIDTH + 2; // 2px padding from left edge
    const width = duration * CELL_WIDTH - 4; // 4px total gap (2px on each side)

    const guestName = reservation.guest
      ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
      : "Unknown Guest";

    const isVip = reservation.guest?.is_vip;

    // Check if checkout is visible (for half-day indicator)
    const isCheckoutVisible = checkOut <= rangeEnd && checkOut > rangeStart;

    // Calculate drag constraints (vertical for rooms, horizontal for dates)
    const maxUp = -(roomIndex * ROW_HEIGHT);
    const maxDown = (totalRooms - roomIndex - 1) * ROW_HEIGHT;

    return (
      <motion.button
        ref={ref as any}
        drag={isDragEnabled}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ 
          top: maxUp, 
          bottom: maxDown,
          left: maxLeftOffset,
          right: maxRightOffset
        }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event, info) => {
          setIsDragging(false);
          onDragEnd?.(info);
        }}
        onClick={() => !isDragging && onClick?.(reservation)}
        className={cn(
          "absolute top-1 h-10 rounded-md border px-2 flex items-center gap-1 overflow-hidden transition-all",
          isDragging 
            ? "cursor-grabbing z-50 shadow-lg ring-2 ring-primary" 
            : isDragEnabled 
              ? "cursor-grab hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:z-10"
              : "cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:z-10",
          STATUS_COLORS[reservation.status],
          STATUS_TEXT_COLORS[reservation.status]
        )}
        style={{ left: `${left}px`, width: `${width}px` }}
        whileDrag={{ scale: 1.05, opacity: 0.9 }}
      >
        {isVip && <Crown className="h-3 w-3 flex-shrink-0 text-amber-300" />}
        {reservation.status === "checked_in" && (
          <UserCheck className="h-3 w-3 flex-shrink-0" />
        )}
        {reservation.status === "confirmed" && (
          <CalendarClock className="h-3 w-3 flex-shrink-0" />
        )}
        <span className="truncate text-xs font-medium">{guestName}</span>
        
        {/* Checkout indicator - diagonal stripe on right edge */}
        {isCheckoutVisible && (
          <div 
            className="absolute right-0 top-0 h-full w-3 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.3) 2px,
                rgba(255, 255, 255, 0.3) 4px
              )`,
            }}
            title="Checkout"
          />
        )}
      </motion.button>
    );
  }
);
DraggableReservationBlock.displayName = "DraggableReservationBlock";

function ReservationBlockWithTooltip({
  reservation,
  startDate,
  dateRange,
  onClick,
  onDragEnd,
  roomIndex,
  totalRooms,
  isDragEnabled,
  maxLeftOffset,
  maxRightOffset,
}: DraggableReservationBlockProps) {
  const checkIn = parseISO(reservation.check_in_date);
  const checkOut = parseISO(reservation.check_out_date);
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DraggableReservationBlock
          reservation={reservation}
          startDate={startDate}
          dateRange={dateRange}
          onClick={onClick}
          onDragEnd={onDragEnd}
          roomIndex={roomIndex}
          totalRooms={totalRooms}
          isDragEnabled={isDragEnabled}
          maxLeftOffset={maxLeftOffset}
          maxRightOffset={maxRightOffset}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-semibold">{guestName}</div>
          <div className="text-xs text-muted-foreground">
            {reservation.confirmation_number}
          </div>
          <div className="text-xs">
            {format(checkIn, "MMM d")} → {format(checkOut, "MMM d, yyyy")}
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {reservation.status.replace("_", " ")}
          </Badge>
          {isDragEnabled && (
            <div className="text-xs text-muted-foreground italic pt-1">
              Drag to move dates or change room
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CalendarTimeline({ 
  rooms, 
  dateRange, 
  onReservationClick,
  onReservationMove,
  onReservationDateChange,
}: CalendarTimelineProps) {
  const startDate = dateRange[0];

  // Create a flat list of rooms with their indices for drag calculations
  const flatRoomList = useMemo(() => {
    const list: { room: CalendarRoom; globalIndex: number }[] = [];
    rooms.forEach((room) => {
      list.push({ room, globalIndex: list.length });
    });
    return list;
  }, [rooms]);

  // Group rooms by floor, with unassigned rooms grouped under "Unassigned"
  const groupedRooms = useMemo(() => {
    const floors = new Map<string, CalendarRoom[]>();
    
    // First, separate unassigned rooms
    const unassignedRooms = rooms.filter((room) => room.id.startsWith("unassigned"));
    const assignedRooms = rooms.filter((room) => !room.id.startsWith("unassigned"));
    
    // Add unassigned group first if there are any
    if (unassignedRooms.length > 0) {
      floors.set("Unassigned", unassignedRooms);
    }
    
    // Then group assigned rooms by floor
    assignedRooms.forEach((room) => {
      const floor = room.floor || "Other";
      const existing = floors.get(floor) || [];
      existing.push(room);
      floors.set(floor, existing);
    });
    
    return floors;
  }, [rooms]);

  const handleDragEnd = (
    reservation: CalendarReservation,
    currentRoomId: string,
    roomIndex: number,
    info: PanInfo
  ) => {
    const deltaY = info.offset.y;
    const deltaX = info.offset.x;
    const rowsMoved = Math.round(deltaY / ROW_HEIGHT);
    const daysMoved = Math.round(deltaX / CELL_WIDTH);

    // Handle horizontal date change
    if (daysMoved !== 0) {
      const checkIn = parseISO(reservation.check_in_date);
      const checkOut = parseISO(reservation.check_out_date);
      
      const newCheckIn = addDays(checkIn, daysMoved);
      const newCheckOut = addDays(checkOut, daysMoved);
      
      onReservationDateChange?.(
        reservation.id,
        reservation.check_in_date,
        reservation.check_out_date,
        format(newCheckIn, "yyyy-MM-dd"),
        format(newCheckOut, "yyyy-MM-dd"),
        reservation.total_amount
      );
    }

    // Handle vertical room change (only if not changing dates to avoid double-update confusion)
    if (rowsMoved !== 0 && daysMoved === 0) {
      const targetRoomIndex = roomIndex + rowsMoved;
      if (targetRoomIndex < 0 || targetRoomIndex >= flatRoomList.length) return;

      const targetRoom = flatRoomList[targetRoomIndex].room;
      
      // Can't move to any unassigned row
      if (targetRoom.id.startsWith("unassigned")) return;

      // Call the move handler
      onReservationMove?.(
        reservation.id,
        reservation.reservation_room_id,
        targetRoom.id,
        currentRoomId.startsWith("unassigned") ? null : currentRoomId
      );
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-card text-muted-foreground">
        No rooms configured. Add rooms in the Rooms section to see them here.
      </div>
    );
  }

  // Track the global row index for proper drag offset calculation
  let globalRowIndex = 0;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <div className="min-w-max">
        {/* Header Row - Dates */}
        <div className="flex border-b bg-muted/50 sticky top-0 z-20">
          {/* Room label column */}
          <div className="w-32 flex-shrink-0 border-r px-3 py-2 font-medium text-sm">
            Room
          </div>
          {/* Date columns */}
          <div className="flex">
            {dateRange.map((date, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col items-center justify-center border-r px-1 py-1",
                  isToday(date) && "bg-primary/10"
                )}
                style={{ width: `${CELL_WIDTH}px` }}
              >
                <span className="text-2xs text-muted-foreground uppercase">
                  {format(date, "EEE")}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary font-bold"
                  )}
                >
                  {format(date, "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows grouped by floor */}
        {Array.from(groupedRooms.entries()).map(([floor, floorRooms]) => (
          <div key={floor}>
            {/* Floor Header */}
            <div className={cn(
              "flex border-b",
              floor === "Unassigned" ? "bg-amber-500/10" : "bg-muted/30"
            )}>
              <div className="w-32 flex-shrink-0 border-r px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                {floor === "Other" ? "No Floor" : floor === "Unassigned" ? "Unassigned" : `Floor ${floor}`}
              </div>
              <div className="flex-1" />
            </div>

            {/* Rooms in this floor */}
            {floorRooms.map((room) => {
              const currentGlobalIndex = globalRowIndex;
              globalRowIndex++;
              
              // Enable drag only if move handler is provided and room is not unassigned
              const isDragEnabled = !!onReservationMove && !room.id.startsWith("unassigned");
              const isUnassignedRoom = room.id.startsWith("unassigned");
              
              return (
                <div key={room.id} className={cn(
                  "flex border-b hover:bg-muted/20",
                  isUnassignedRoom && "bg-amber-500/5"
                )}>
                  {/* Room label */}
                  <div className="w-32 flex-shrink-0 border-r px-3 py-2 flex flex-col justify-center">
                    <span className={cn(
                      "font-medium text-sm truncate",
                      isUnassignedRoom && "text-amber-700 dark:text-amber-400"
                    )}>
                      {room.room_number}
                    </span>
                    <span className="text-2xs text-muted-foreground truncate">
                      {room.room_type?.name || "—"}
                    </span>
                  </div>

                  {/* Timeline grid with reservations */}
                  <div
                    className="relative"
                    style={{
                      width: `${dateRange.length * CELL_WIDTH}px`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {dateRange.map((date, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border-r h-full",
                            isToday(date) && "bg-primary/5"
                          )}
                          style={{ width: `${CELL_WIDTH}px` }}
                        />
                      ))}
                    </div>

                    {/* Reservation blocks */}
                    {room.reservations.map((res) => {
                      // Calculate horizontal constraints for this reservation
                      const checkIn = parseISO(res.check_in_date);
                      const checkOut = parseISO(res.check_out_date);
                      const normalizedStartDate = startOfDay(startDate);
                      const startOffset = differenceInCalendarDays(checkIn < normalizedStartDate ? normalizedStartDate : checkIn, normalizedStartDate);
                      const duration = differenceInCalendarDays(checkOut, checkIn);
                      
                      // Max left: can't go before the start of visible range
                      const maxLeftOffset = -startOffset * CELL_WIDTH;
                      // Max right: can't extend beyond visible range
                      const maxRightOffset = (dateRange.length - startOffset - duration) * CELL_WIDTH;
                      
                      return (
                        <ReservationBlockWithTooltip
                          key={`${res.id}-${res.reservation_room_id}`}
                          reservation={res}
                          startDate={startDate}
                          dateRange={dateRange}
                          onClick={onReservationClick}
                          onDragEnd={(info) => handleDragEnd(res, room.id, currentGlobalIndex, info)}
                          roomIndex={currentGlobalIndex}
                          totalRooms={flatRoomList.length}
                          isDragEnabled={isDragEnabled}
                          maxLeftOffset={maxLeftOffset}
                          maxRightOffset={maxRightOffset}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
