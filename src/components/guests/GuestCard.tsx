import { Star, Ban, Mail, Phone, MapPin, Calendar, Wallet } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Guest } from "@/hooks/useGuests";

interface GuestCardProps {
  guest: Guest;
  onClick?: () => void;
}

export function GuestCard({ guest, onClick }: GuestCardProps) {
  const initials = `${guest.first_name?.[0] || ""}${guest.last_name?.[0] || ""}`.toUpperCase();

  // Determine border color based on guest status
  const getBorderColor = () => {
    if (guest.is_blacklisted) return "border-l-rose-500";
    if (guest.is_vip) return "border-l-amber-500";
    return "border-l-blue-500";
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4",
        getBorderColor()
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
            <AvatarFallback className={cn(
              "font-semibold text-white",
              guest.is_vip ? "bg-gradient-to-br from-amber-500 to-orange-600" :
              guest.is_blacklisted ? "bg-gradient-to-br from-rose-500 to-red-600" :
              "bg-gradient-to-br from-blue-500 to-indigo-600"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Guest Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {guest.first_name} {guest.last_name}
                  </h3>
                  {guest.is_vip && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white shadow-sm">
                      <Star className="mr-1 h-3 w-3 fill-white" />
                      VIP
                    </Badge>
                  )}
                  {guest.is_blacklisted && (
                    <Badge className="bg-gradient-to-r from-rose-500 to-red-600 border-none text-white shadow-sm">
                      <Ban className="mr-1 h-3 w-3" />
                      Blocked
                    </Badge>
                  )}
                </div>
                {guest.nationality && (
                  <p className="text-sm text-muted-foreground">{guest.nationality}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {guest.email && (
                <div className="flex items-center gap-1.5">
                  <div className="rounded-full bg-blue-500/10 p-1">
                    <Mail className="h-3 w-3 text-blue-500" />
                  </div>
                  <span className="truncate max-w-[180px]">{guest.email}</span>
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-1.5">
                  <div className="rounded-full bg-emerald-500/10 p-1">
                    <Phone className="h-3 w-3 text-emerald-500" />
                  </div>
                  <span>{guest.phone}</span>
                </div>
              )}
              {(guest.city || guest.country) && (
                <div className="flex items-center gap-1.5">
                  <div className="rounded-full bg-purple-500/10 p-1">
                    <MapPin className="h-3 w-3 text-purple-500" />
                  </div>
                  <span>
                    {[guest.city, guest.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="rounded-full bg-indigo-500/10 p-1">
                  <Calendar className="h-3 w-3 text-indigo-500" />
                </div>
                <span className="font-semibold">{guest.total_stays}</span>
                <span className="text-muted-foreground">stays</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="rounded-full bg-emerald-500/10 p-1">
                  <Wallet className="h-3 w-3 text-emerald-500" />
                </div>
                <span className="font-semibold text-emerald-600">
                  ৳{guest.total_revenue.toLocaleString()}
                </span>
                <span className="text-muted-foreground">revenue</span>
              </div>
              {guest.date_of_birth && (
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  DOB: {format(new Date(guest.date_of_birth), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
