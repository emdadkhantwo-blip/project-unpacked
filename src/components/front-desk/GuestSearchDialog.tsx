import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGuests } from "@/hooks/useGuests";
import { useReservations } from "@/hooks/useReservations";
import { Search, User, Calendar, Phone, Mail, Crown, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GuestSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGuest?: (guestId: string) => void;
  onSelectReservation?: (reservationId: string) => void;
}

export function GuestSearchDialog({
  open,
  onOpenChange,
  onSelectGuest,
  onSelectReservation,
}: GuestSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: guests = [], isLoading: guestsLoading } = useGuests();
  const { data: reservations = [], isLoading: reservationsLoading } = useReservations();

  const isLoading = guestsLoading || reservationsLoading;

  // Filter guests based on search
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return guests
      .filter((guest) => {
        const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
        const email = guest.email?.toLowerCase() || "";
        const phone = guest.phone?.toLowerCase() || "";
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      })
      .slice(0, 5);
  }, [guests, searchQuery]);

  // Filter reservations based on search
  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return reservations
      .filter((res) => {
        const guestName = res.guest
          ? `${res.guest.first_name} ${res.guest.last_name}`.toLowerCase()
          : "";
        const confirmationNumber = res.confirmation_number.toLowerCase();
        return guestName.includes(query) || confirmationNumber.includes(query);
      })
      .slice(0, 5);
  }, [reservations, searchQuery]);

  const handleGuestClick = (guestId: string) => {
    onSelectGuest?.(guestId);
    onOpenChange(false);
  };

  const handleReservationClick = (reservationId: string) => {
    onSelectReservation?.(reservationId);
    onOpenChange(false);
  };

  const hasResults = filteredGuests.length > 0 || filteredReservations.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find Guest</DialogTitle>
          <DialogDescription>
            Search for guests by name, email, phone, or confirmation number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guests or reservations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !searchQuery.trim() ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Start typing to search...
              </div>
            ) : !hasResults ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Guests Section */}
                {filteredGuests.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Guests
                    </h4>
                    <div className="space-y-2">
                      {filteredGuests.map((guest) => (
                        <button
                          key={guest.id}
                          className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                          onClick={() => handleGuestClick(guest.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {guest.first_name} {guest.last_name}
                                  </span>
                                  {guest.is_vip && (
                                    <Crown className="h-3 w-3 text-warning" />
                                  )}
                                  {guest.is_blacklisted && (
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {guest.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {guest.email}
                                    </span>
                                  )}
                                  {guest.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {guest.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {guest.total_stays} stays
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reservations Section */}
                {filteredReservations.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Reservations
                    </h4>
                    <div className="space-y-2">
                      {filteredReservations.map((res) => (
                        <button
                          key={res.id}
                          className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                          onClick={() => handleReservationClick(res.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                                <Calendar className="h-4 w-4 text-info" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {res.guest?.first_name} {res.guest?.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    #{res.confirmation_number}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(res.check_in_date), "MMM d")} -{" "}
                                  {format(new Date(res.check_out_date), "MMM d, yyyy")}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                res.status === "checked_in" && "border-success text-success",
                                res.status === "confirmed" && "border-info text-info",
                                res.status === "checked_out" && "border-muted-foreground"
                              )}
                            >
                              {res.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
