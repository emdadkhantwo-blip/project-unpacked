import { format, parseISO, differenceInDays } from "date-fns";
import { Hotel, CalendarDays, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

type Reservation = Tables<"reservations">;

interface GuestHistoryTabProps {
  reservations: Reservation[];
  isLoading: boolean;
}

export function GuestHistoryTab({ reservations, isLoading }: GuestHistoryTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Hotel className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No stay history found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked_out":
        return <Badge variant="secondary">Checked Out</Badge>;
      case "checked_in":
        return <Badge className="bg-success/10 text-success border-success/30">In House</Badge>;
      case "confirmed":
        return <Badge variant="outline">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
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
    return labels[source] || source;
  };

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => {
        const checkIn = parseISO(reservation.check_in_date);
        const checkOut = parseISO(reservation.check_out_date);
        const nights = differenceInDays(checkOut, checkIn);

        return (
          <Card key={reservation.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">
                    {reservation.confirmation_number}
                  </code>
                  {getStatusBadge(reservation.status)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {getSourceLabel(reservation.source)}
                </Badge>
              </div>

              {/* Body */}
              <div className="p-3 space-y-2">
                {/* Dates */}
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(checkIn, "MMM d, yyyy")} → {format(checkOut, "MMM d, yyyy")}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {nights} night{nights !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Guests */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}
                    {reservation.children > 0 && `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`}
                  </span>
                </div>

                {/* Revenue */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold text-success">
                    ৳{reservation.total_amount.toLocaleString()}
                  </span>
                </div>

                {/* Special Requests */}
                {reservation.special_requests && (
                  <div className="text-xs text-muted-foreground italic pt-1 border-t">
                    "{reservation.special_requests}"
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
