import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  Star,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  CalendarDays,
  Trash2,
  IdCard,
  ExternalLink,
  Receipt,
  Banknote,
  Plus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import type { Reservation } from "@/hooks/useReservations";
import { ExtendStayDialog } from "./ExtendStayDialog";
import { AddChargeDialog } from "@/components/folios/AddChargeDialog";
import { RecordPaymentDialog } from "@/components/folios/RecordPaymentDialog";

interface ReservationDetailDrawerProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onCancel?: () => void;
  onExtendStay?: (updatedReservation: Reservation) => void;
  onDelete?: () => void;
}

interface FolioSummary {
  id: string;
  folio_number: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  updated_at: string;
  created_at: string;
  charges_count: number;
  payments_count: number;
}

interface GuestIdDocument {
  id: string;
  guest_number: number;
  document_url: string;
  document_type: string;
  file_name: string | null;
  created_at: string;
}

export function ReservationDetailDrawer({
  reservation,
  open,
  onOpenChange,
  onCheckIn,
  onCheckOut,
  onCancel,
  onExtendStay,
  onDelete,
}: ReservationDetailDrawerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [extendStayOpen, setExtendStayOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Fetch folio data for this reservation
  const { data: folio, isLoading: isFolioLoading } = useQuery({
    queryKey: ["reservation-folio", reservation?.id],
    queryFn: async (): Promise<FolioSummary | null> => {
      if (!reservation?.id) return null;

      const { data, error } = await supabase
        .from("folios")
        .select(`
          id, folio_number, subtotal, tax_amount, service_charge, 
          total_amount, paid_amount, balance, status, updated_at, created_at,
          folio_items(id, voided),
          payments(id, voided)
        `)
        .eq("reservation_id", reservation.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        folio_number: data.folio_number,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        service_charge: data.service_charge,
        total_amount: data.total_amount,
        paid_amount: data.paid_amount,
        balance: data.balance,
        status: data.status,
        updated_at: data.updated_at,
        created_at: data.created_at,
        charges_count: data.folio_items?.filter((i: { voided: boolean }) => !i.voided).length || 0,
        payments_count: data.payments?.filter((p: { voided: boolean }) => !p.voided).length || 0,
      };
    },
    enabled: !!reservation?.id && open,
  });

  // Guest ID documents feature not yet available
  const guestIds: GuestIdDocument[] = [];
  const isGuestIdsLoading = false;

  if (!reservation) return null;

  const guest = reservation.guest;
  // Use differenceInCalendarDays for consistent night count calculation
  const nights = differenceInCalendarDays(
    parseISO(reservation.check_out_date),
    parseISO(reservation.check_in_date)
  );

  const canCheckIn = reservation.status === "confirmed";
  const canCheckOut = reservation.status === "checked_in";
  const canExtendStay = reservation.status === "confirmed" || reservation.status === "checked_in";
  const canCancel = reservation.status === "confirmed";
  const canDelete = reservation.status === "confirmed" || reservation.status === "cancelled";
  
  // Check if any rooms need assignment
  const hasUnassignedRooms = reservation.reservation_rooms.some(rr => !rr.room_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Reservation Details</SheetTitle>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {reservation.confirmation_number}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guest ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {guest.first_name} {guest.last_name}
                    </span>
                    {guest.is_vip && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${guest.email}`} className="hover:underline">
                        {guest.email}
                      </a>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${guest.phone}`} className="hover:underline">
                        {guest.phone}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No guest information available</p>
              )}
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Check-In</p>
                  <p className="font-medium">
                    {format(new Date(reservation.check_in_date), "EEE, MMM d, yyyy")}
                  </p>
                  {reservation.actual_check_in && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {format(new Date(reservation.actual_check_in), "h:mm a")}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check-Out</p>
                  <p className="font-medium">
                    {format(new Date(reservation.check_out_date), "EEE, MMM d, yyyy")}
                  </p>
                  {reservation.actual_check_out && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {format(new Date(reservation.actual_check_out), "h:mm a")}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{nights} night{nights !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium">
                  {reservation.adults} adult{reservation.adults !== 1 ? "s" : ""}
                  {reservation.children > 0 && `, ${reservation.children} child${reservation.children !== 1 ? "ren" : ""}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="capitalize">
                  {reservation.source.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Room Assignments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BedDouble className="h-4 w-4" />
                Room Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.reservation_rooms.length > 0 ? (
                <div className="space-y-2">
                  {reservation.reservation_rooms.map((rr) => (
                    <div
                      key={rr.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {rr.room?.room_number ? (
                            <>Room {rr.room.room_number}</>
                          ) : (
                            <span className="text-amber-600">Not assigned</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rr.room_type?.name || rr.room_type?.code || "Unknown type"}
                        </p>
                      </div>
                      {!rr.room?.room_number && (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/20">
                          Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                  {hasUnassignedRooms && canCheckIn && (
                    <Alert className="mt-3 border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Rooms must be assigned during check-in
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rooms assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Guest ID Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="h-4 w-4" />
                Guest ID Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGuestIdsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : guestIds && guestIds.length > 0 ? (
                <div className="space-y-2">
                  {guestIds.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {doc.document_type === "image" ? (
                          <div className="h-10 w-14 rounded border overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={doc.document_url}
                              alt={`Guest ${doc.guest_number} ID`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement?.querySelector(".fallback-icon")?.classList.remove("hidden");
                              }}
                            />
                            <IdCard className="h-5 w-5 text-muted-foreground fallback-icon hidden" />
                          </div>
                        ) : (
                          <div className="h-10 w-14 rounded border bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">Guest {doc.guest_number} ID</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {doc.file_name || `${doc.document_type.toUpperCase()} Document`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => window.open(doc.document_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No ID documents uploaded
                </div>
              )}
            </CardContent>
          </Card>

          {/* Folio / Billing */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  Folio Summary
                </CardTitle>
                {folio && (
                  <Badge 
                    variant={folio.status === 'open' ? 'default' : 'secondary'}
                    className={folio.status === 'open' 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : ''}
                  >
                    {folio.status === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isFolioLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : folio ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Folio #</span>
                    <span className="font-mono">{folio.folio_number}</span>
                  </div>
                  
                  {/* Charges & Payments Count */}
                  <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span>{folio.charges_count} Charge{folio.charges_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span>{folio.payments_count} Payment{folio.payments_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{folio.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>৳{folio.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span>৳{folio.service_charge.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>৳{folio.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600">৳{folio.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Balance Due</span>
                    <span className={folio.balance > 0 ? "text-red-600" : "text-green-600"}>
                      ৳{folio.balance.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Last Updated */}
                  {folio.updated_at && (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                      Last updated: {format(new Date(folio.updated_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                  
                  {/* Action Buttons for Open Folios */}
                  {folio.status === 'open' && (
                    <div className="flex gap-2 pt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => setAddChargeOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Charge
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => setPaymentOpen(true)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Payment
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs"
                        onClick={() => navigate(`/folios?selected=${folio.id}`)}
                        title="View Full Folio"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No folio created yet
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Folio Dialogs */}
          {folio && (
            <>
              <AddChargeDialog
                folioId={folio.id}
                open={addChargeOpen}
                onOpenChange={(open) => {
                  setAddChargeOpen(open);
                  if (!open) {
                    queryClient.invalidateQueries({ queryKey: ["reservation-folio", reservation?.id] });
                  }
                }}
              />
              <RecordPaymentDialog
                folioId={folio.id}
                balance={folio.balance}
                open={paymentOpen}
                onOpenChange={(open) => {
                  setPaymentOpen(open);
                  if (!open) {
                    queryClient.invalidateQueries({ queryKey: ["reservation-folio", reservation?.id] });
                  }
                }}
              />
            </>
          )}

          {/* Special Requests & Notes */}
          {(reservation.special_requests || reservation.internal_notes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Notes & Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservation.special_requests && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Special Requests
                    </p>
                    <p className="text-sm rounded-lg bg-muted p-3">
                      {reservation.special_requests}
                    </p>
                  </div>
                )}
                {reservation.internal_notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Internal Notes
                    </p>
                    <p className="text-sm rounded-lg bg-amber-500/10 p-3 text-amber-800">
                      {reservation.internal_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            {canCheckIn && onCheckIn && (
              <Button className="flex-1" onClick={onCheckIn}>
                {hasUnassignedRooms ? "Check In & Assign Rooms" : "Check In"}
              </Button>
            )}
            {canCheckOut && onCheckOut && (
              <Button className="flex-1" onClick={onCheckOut}>
                Check Out
              </Button>
            )}
            {canExtendStay && (
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setExtendStayOpen(true)}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Modify Dates
              </Button>
            )}
            {canCancel && onCancel && (
              <Button variant="destructive" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {canDelete && onDelete && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this reservation ({reservation.confirmation_number})? 
                      This action cannot be undone and will also remove any associated folios and payments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        onDelete();
                        onOpenChange(false);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!canCheckIn && !canCheckOut && !canCancel && !canExtendStay && !canDelete && (
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>

          {/* Extend Stay Dialog */}
          <ExtendStayDialog
            reservation={reservation}
            open={extendStayOpen}
            onOpenChange={setExtendStayOpen}
            onSuccess={(updatedReservation) => {
              onExtendStay?.(updatedReservation);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
