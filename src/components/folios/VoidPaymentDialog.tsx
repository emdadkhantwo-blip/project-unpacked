import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVoidPayment } from "@/hooks/useFolios";
import type { Payment } from "@/hooks/useFolios";

interface VoidPaymentDialogProps {
  payment: Payment;
  folioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidPaymentDialog({ payment, folioId, open, onOpenChange }: VoidPaymentDialogProps) {
  const [reason, setReason] = useState("");
  const voidPayment = useVoidPayment();

  const handleSubmit = () => {
    if (!reason.trim()) return;

    voidPayment.mutate(
      {
        paymentId: payment.id,
        folioId,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Payment
          </DialogTitle>
          <DialogDescription>
            This will void the payment of ৳{Number(payment.amount).toLocaleString()} and update the folio balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> Voiding a payment cannot be undone. The folio balance will be increased by the voided amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="void-reason">Reason for voiding <span className="text-destructive">*</span></Label>
            <Textarea
              id="void-reason"
              placeholder="Enter the reason for voiding this payment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || voidPayment.isPending}
          >
            {voidPayment.isPending ? "Voiding..." : "Void Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
