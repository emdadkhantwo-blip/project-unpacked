import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Building2, CheckCircle, CreditCard, AlertTriangle } from "lucide-react";
import { useFolioByReservationId, useRecordPayment, type PaymentMethod } from "@/hooks/useFolios";
import { useCorporateAccountById } from "@/hooks/useCorporateAccounts";
import { useCheckOut, type CheckoutResult } from "@/hooks/useReservations";
import { useTenant } from "@/hooks/useTenant";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FrontDeskReservation } from "@/hooks/useFrontDesk";
import type { CheckoutData } from "@/components/front-desk/CheckoutSuccessModal";

interface CheckoutDialogProps {
  reservation: FrontDeskReservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (checkoutData: CheckoutData) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function CheckoutDialog({
  reservation,
  open,
  onOpenChange,
  onSuccess,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "corporate">("cash");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const { currentProperty } = useTenant();
  
  const { data: folio, isLoading: folioLoading } = useFolioByReservationId(
    open ? reservation?.id ?? null : null
  );
  
  const corporateAccountId = reservation?.guest?.corporate_account_id;
  // Always fetch corporate account if the guest has one (to show in dropdown)
  const { data: corporateAccount } = useCorporateAccountById(
    open && corporateAccountId ? corporateAccountId : null
  );

  const recordPayment = useRecordPayment();
  const checkOutMutation = useCheckOut();

  // Reset payment method when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentMethod("cash");
    }
  }, [open]);

  if (!reservation) return null;

  const guestName = `${reservation.guest?.first_name} ${reservation.guest?.last_name}`;
  const roomNumbers = reservation.reservation_rooms
    ?.map((rr) => rr.room?.room_number)
    .filter(Boolean)
    .join(", ") || "Unassigned";

  const balance = folio?.balance ?? 0;
  const totalAmount = folio?.total_amount ?? 0;
  const paidAmount = folio?.paid_amount ?? 0;
  const hasBalance = balance > 0;
  const hasCorporateAccount = !!corporateAccountId;

  const afterPaymentBalance = corporateAccount
    ? Number(corporateAccount.current_balance) + balance
    : 0;
  const exceedsCreditLimit = corporateAccount
    ? afterPaymentBalance > Number(corporateAccount.credit_limit || 0)
    : false;

  const isProcessing = recordPayment.isPending || checkOutMutation.isPending || isSendingEmail;

  // Send corporate billing email
  const sendCorporateBillingEmail = async (billedAmount: number) => {
    if (!corporateAccountId || !reservation || !folio) return;
    
    try {
      setIsSendingEmail(true);
      await supabase.functions.invoke("send-corporate-billing-email", {
        body: {
          corporateAccountId,
          reservationId: reservation.id,
          guestName,
          roomNumbers,
          checkInDate: reservation.check_in_date,
          checkOutDate: reservation.check_out_date,
          billedAmount,
          propertyName: currentProperty?.name || "Hotel",
          folioNumber: folio.folio_number,
        },
      });
      console.log("Corporate billing email sent successfully");
    } catch (error) {
      console.error("Failed to send corporate billing email:", error);
      // Don't fail checkout if email fails
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCheckout = async () => {
    try {
      let corporateBilledAmount = 0;
      
      // If there's a balance and payment method selected, record payment first
      if (hasBalance && folio) {
        if (paymentMethod === "corporate" && corporateAccountId) {
          corporateBilledAmount = balance;
          await recordPayment.mutateAsync({
            folioId: folio.id,
            amount: balance,
            paymentMethod: "other",
            notes: `Corporate billing - ${corporateAccount?.company_name}`,
            corporateAccountId: corporateAccountId,
          });
        } else if (paymentMethod !== "corporate") {
          await recordPayment.mutateAsync({
            folioId: folio.id,
            amount: balance,
            paymentMethod: paymentMethod as PaymentMethod,
          });
        }
      }

      // Then complete checkout
      const result: CheckoutResult = await checkOutMutation.mutateAsync(reservation.id);
      
      // Send corporate billing email if payment was billed to corporate account
      if (corporateBilledAmount > 0 && corporateAccountId) {
        // Fire and forget - don't block checkout
        sendCorporateBillingEmail(corporateBilledAmount);
      }
      
      onOpenChange(false);
      if (result.checkoutData) {
        onSuccess(result.checkoutData);
      }
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout: {guestName}</DialogTitle>
          <DialogDescription>
            Room {roomNumbers} • {format(new Date(reservation.check_in_date), "MMM d")} → {format(new Date(reservation.check_out_date), "MMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folio Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-3">Folio Summary</div>
              {folioLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ) : folio ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Amount</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Paid Amount</span>
                    <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Balance</span>
                    <span className={hasBalance ? "text-destructive" : "text-green-600"}>
                      {formatCurrency(balance)}
                      {!hasBalance && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                          PAID
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No folio found</div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection - Only if there's a balance */}
          {hasBalance && folio && (
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod | "corporate")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                  {hasCorporateAccount && (
                    <SelectItem value="corporate">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Corporate Account
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Corporate Account Info */}
              {paymentMethod === "corporate" && corporateAccount && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{corporateAccount.company_name}</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Balance</span>
                        <span>{formatCurrency(corporateAccount.current_balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span>{formatCurrency(corporateAccount.credit_limit || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>After This Payment</span>
                        <span className={exceedsCreditLimit ? "text-destructive" : ""}>
                          {formatCurrency(afterPaymentBalance)}
                        </span>
                      </div>
                    </div>
                    {exceedsCreditLimit && (
                      <div className="flex items-center gap-2 mt-3 text-destructive text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>This payment will exceed the credit limit</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* All Settled Message */}
          {!hasBalance && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">All charges have been settled</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={isProcessing || (paymentMethod === "corporate" && exceedsCreditLimit)}
          >
            {isProcessing ? (
              "Processing..."
            ) : hasBalance ? (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatCurrency(balance)} & Check Out
              </>
            ) : (
              "Check Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}