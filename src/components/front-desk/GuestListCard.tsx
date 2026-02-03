import { differenceInDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LogIn, 
  LogOut, 
  Eye, 
  Crown, 
  BedDouble,
  User,
} from "lucide-react";
import type { FrontDeskReservation } from "@/hooks/useFrontDesk";
import { cn } from "@/lib/utils";

interface GuestListCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  guests: FrontDeskReservation[];
  isLoading?: boolean;
  emptyMessage: string;
  type: "arrivals" | "departures" | "in-house";
  onCheckIn?: (reservation: FrontDeskReservation) => void;
  onCheckOut?: (reservation: FrontDeskReservation) => void;
  onViewDetails?: (reservation: FrontDeskReservation) => void;
}

function GuestListItem({
  reservation,
  type,
  onCheckIn,
  onCheckOut,
  onViewDetails,
}: {
  reservation: FrontDeskReservation;
  type: "arrivals" | "departures" | "in-house";
  onCheckIn?: (reservation: FrontDeskReservation) => void;
  onCheckOut?: (reservation: FrontDeskReservation) => void;
  onViewDetails?: (reservation: FrontDeskReservation) => void;
}) {
  const guestName = reservation.guest
    ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
    : "Unknown Guest";

  const roomNumbers = reservation.reservation_rooms
    .filter((rr) => rr.room?.room_number)
    .map((rr) => rr.room?.room_number)
    .join(", ");

  const roomTypes = reservation.reservation_rooms
    .map((rr) => rr.room_type?.name)
    .filter(Boolean)
    .join(", ");

  const nights = differenceInDays(
    new Date(reservation.check_out_date),
    new Date(reservation.check_in_date)
  );

  const getBorderColor = () => {
    if (reservation.guest?.is_vip) return "border-l-amber-500";
    if (type === "arrivals") return "border-l-emerald-500";
    if (type === "departures") return "border-l-orange-500";
    return "border-l-blue-500";
  };

  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-lg border border-l-4 p-3 transition-all hover:shadow-md hover:-translate-y-0.5 bg-card",
      getBorderColor()
    )}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
          reservation.guest?.is_vip 
            ? "bg-gradient-to-br from-amber-500 to-orange-600" 
            : type === "arrivals"
            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
            : type === "departures"
            ? "bg-gradient-to-br from-orange-500 to-red-600"
            : "bg-gradient-to-br from-blue-500 to-indigo-600"
        )}>
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{guestName}</span>
            {reservation.guest?.is_vip && (
              <Crown className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {roomNumbers || roomTypes || "No room assigned"}
            </span>
            <span className="bg-muted/50 px-1.5 py-0.5 rounded">
              {nights} night{nights !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded inline-block mt-1">
            {reservation.confirmation_number}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(reservation)}
          className="h-8 px-2"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {type === "arrivals" && onCheckIn && (
          <Button
            size="sm"
            onClick={() => onCheckIn(reservation)}
            className="h-8 gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-sm"
          >
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
        )}

        {type === "in-house" && onCheckOut && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCheckOut(reservation)}
            className="h-8 gap-1"
          >
            <LogOut className="h-4 w-4" />
            Check Out
          </Button>
        )}
      </div>
    </div>
  );
}

export function GuestListCard({
  title,
  description,
  icon,
  guests,
  isLoading,
  emptyMessage,
  type,
  onCheckIn,
  onCheckOut,
  onViewDetails,
}: GuestListCardProps) {
  const getHeaderGradient = () => {
    if (type === "arrivals") return "from-emerald-500 to-teal-600";
    if (type === "departures") return "from-orange-500 to-red-600";
    return "from-blue-500 to-indigo-600";
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className={cn(
        "pb-3 text-white bg-gradient-to-r",
        getHeaderGradient()
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base text-white">{title}</CardTitle>
              <CardDescription className="text-xs text-white/80">{description}</CardDescription>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-none shadow-sm text-sm">
            {isLoading ? "..." : guests.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {guests.map((reservation) => (
                <GuestListItem
                  key={reservation.id}
                  reservation={reservation}
                  type={type}
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckOut}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
