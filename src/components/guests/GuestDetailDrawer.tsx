import { format } from "date-fns";
import {
  Star,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  CreditCard,
  Edit2,
  BarChart3,
  Heart,
  History,
  MessageSquare,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Guest } from "@/hooks/useGuests";
import { useGuestReservations } from "@/hooks/useGuests";
import { useGuestAnalytics } from "@/hooks/useGuestAnalytics";
import { GuestAnalyticsTab } from "./GuestAnalyticsTab";
import { GuestPreferencesTab } from "./GuestPreferencesTab";
import { GuestHistoryTab } from "./GuestHistoryTab";
import { GuestNotesTab } from "./GuestNotesTab";

interface GuestDetailDrawerProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function GuestDetailDrawer({
  guest,
  open,
  onOpenChange,
  onEdit,
}: GuestDetailDrawerProps) {
  const { data: reservations = [], isLoading: reservationsLoading } = useGuestReservations(guest?.id);
  const { data: analytics, isLoading: analyticsLoading } = useGuestAnalytics(guest?.id);

  if (!guest) return null;

  const initials = `${guest.first_name?.[0] || ""}${guest.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">
                  {guest.first_name} {guest.last_name}
                </SheetTitle>
                {onEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
                {guest.is_vip && (
                  <Badge variant="outline" className="border-warning bg-warning/10 text-warning">
                    <Star className="mr-1 h-3 w-3" />
                    VIP
                  </Badge>
                )}
                {guest.is_blacklisted && (
                  <Badge variant="destructive">
                    <Ban className="mr-1 h-3 w-3" />
                    Blacklisted
                  </Badge>
                )}
                {guest.nationality && (
                  <span className="text-muted-foreground">{guest.nationality}</span>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{guest.total_stays}</p>
                <p className="text-xs text-muted-foreground">Total Stays</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">
                  ${guest.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Prefs
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-380px)] mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {(guest.address || guest.city || guest.country) && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {guest.address && <p>{guest.address}</p>}
                        <p>
                          {[guest.city, guest.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.date_of_birth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {format(new Date(guest.date_of_birth), "MMMM d, yyyy")}</span>
                    </div>
                  )}
                  {guest.nationality && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.nationality}</span>
                    </div>
                  )}
                  {guest.id_type && guest.id_number && (
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {guest.id_type}: {guest.id_number}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {guest.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{guest.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Blacklist Reason */}
              {guest.is_blacklisted && guest.blacklist_reason && (
                <Card className="border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">
                      Blacklist Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{guest.blacklist_reason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Guest Since */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Guest since {format(new Date(guest.created_at), "MMMM yyyy")}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-0">
              <GuestNotesTab guest={guest} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <GuestAnalyticsTab analytics={analytics} isLoading={analyticsLoading} />
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="mt-0">
              <GuestPreferencesTab guest={guest} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <GuestHistoryTab reservations={reservations} isLoading={reservationsLoading} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
