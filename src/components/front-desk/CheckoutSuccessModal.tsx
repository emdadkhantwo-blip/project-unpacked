import { CheckCircle, Download } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { useTenant } from "@/hooks/useTenant";
import { openInvoicePrintView } from "./InvoicePrintView";

export interface CheckoutData {
  guestName: string;
  guestPhone: string | null;
  roomNumbers: string[];
  checkInDate: string;
  checkOutDate: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  invoiceNumber: string;
  reservationId: string;
}

interface CheckoutSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutData: CheckoutData | null;
}

export function CheckoutSuccessModal({
  open,
  onOpenChange,
  checkoutData,
}: CheckoutSuccessModalProps) {
  const { tenant } = useTenant();

  if (!checkoutData) return null;

  const nightsStayed = differenceInCalendarDays(
    parseISO(checkoutData.checkOutDate),
    parseISO(checkoutData.checkInDate)
  );

  const handleDownloadInvoice = () => {
    openInvoicePrintView({
      hotelName: tenant?.name || "Hotel",
      hotelLogo: tenant?.logo_url || null,
      invoiceNumber: checkoutData.invoiceNumber,
      guestName: checkoutData.guestName,
      guestPhone: checkoutData.guestPhone,
      roomNumbers: checkoutData.roomNumbers,
      checkInDate: checkoutData.checkInDate,
      checkOutDate: checkoutData.checkOutDate,
      nightsStayed,
      subtotal: checkoutData.subtotal,
      taxAmount: checkoutData.taxAmount,
      serviceCharge: checkoutData.serviceCharge,
      totalAmount: checkoutData.totalAmount,
      paidAmount: checkoutData.paidAmount,
      balance: checkoutData.balance,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success animate-scale-in" />
          </div>
          <DialogTitle className="text-xl">Check-Out Successful!</DialogTitle>
          <DialogDescription>
            The guest has been checked out successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Guest</span>
            <span className="font-medium">{checkoutData.guestName}</span>
          </div>
          {checkoutData.guestPhone && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{checkoutData.guestPhone}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Room(s)</span>
            <span className="font-medium">{checkoutData.roomNumbers.join(", ") || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{nightsStayed} night{nightsStayed !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Check-in</span>
            <span className="font-medium">{format(parseISO(checkoutData.checkInDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Check-out</span>
            <span className="font-medium">{format(parseISO(checkoutData.checkOutDate), "MMM d, yyyy")}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between font-medium">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(checkoutData.totalAmount)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={handleDownloadInvoice} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
