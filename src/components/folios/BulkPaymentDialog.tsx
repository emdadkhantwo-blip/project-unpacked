import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBulkPayment, type Folio, type PaymentMethod } from "@/hooks/useFolios";

interface BulkPaymentDialogProps {
  folios: Folio[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function BulkPaymentDialog({ folios, open, onOpenChange, onSuccess }: BulkPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const bulkPayment = useBulkPayment();

  const totalBalance = folios.reduce((sum, f) => sum + Number(f.balance), 0);
  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = () => {
    if (parsedAmount <= 0) return;

    bulkPayment.mutate(
      {
        folioIds: folios.map(f => f.id),
        totalAmount: parsedAmount,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setReferenceNumber("");
          setNotes("");
          onSuccess();
        },
      }
    );
  };

  const handlePayFullBalance = () => {
    setAmount(totalBalance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bulk Payment
          </DialogTitle>
          <DialogDescription>
            Record a single payment to be distributed across {folios.length} selected folios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Selected Folios</span>
              <span className="font-medium">{folios.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Balance Due</span>
              <span className="font-bold text-lg">৳{totalBalance.toLocaleString()}</span>
            </div>
          </div>

          <ScrollArea className="h-32 rounded-md border">
            <div className="p-3 space-y-2">
              {folios.map((folio) => (
                <div key={folio.id} className="flex justify-between text-sm">
                  <span className="font-medium">{folio.folio_number}</span>
                  <span className="text-muted-foreground">
                    {folio.guest?.first_name} {folio.guest?.last_name} - ৳{Number(folio.balance).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Payment Amount</Label>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={handlePayFullBalance}>
                Pay Full Balance
              </Button>
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Number (optional)</Label>
            <Input
              placeholder="e.g., TXN-12345"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={parsedAmount <= 0 || bulkPayment.isPending}
          >
            {bulkPayment.isPending ? "Processing..." : `Pay ৳${parsedAmount.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
