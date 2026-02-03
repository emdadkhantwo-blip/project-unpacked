import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, AlertTriangle } from "lucide-react";
import { useRecordPayment, PaymentMethod } from "@/hooks/useFolios";
import { useGuestCorporateAccounts } from "@/hooks/useCorporateAccounts";
import { formatCurrency } from "@/lib/currency";

interface RecordPaymentDialogProps {
  folioId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestId?: string | null;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function RecordPaymentDialog({ 
  folioId, 
  balance, 
  open, 
  onOpenChange,
  guestId 
}: RecordPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amount, setAmount] = useState(balance.toString());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const recordPayment = useRecordPayment();
  const { data: guestCorporateAccounts = [] } = useGuestCorporateAccounts(guestId || null);

  // Reset amount when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(balance.toString());
    }
  }, [open, balance]);

  // Check if selected payment method is a corporate account
  const isCorporatePayment = paymentMethod.startsWith("corporate_");
  const selectedCorporateAccountId = isCorporatePayment ? paymentMethod.replace("corporate_", "") : null;
  const selectedCorporateAccount = guestCorporateAccounts.find(acc => acc.id === selectedCorporateAccountId);

  const paymentAmount = parseFloat(amount) || 0;
  const newCorporateBalance = selectedCorporateAccount 
    ? Number(selectedCorporateAccount.current_balance) + paymentAmount 
    : 0;
  const exceedsCreditLimit = selectedCorporateAccount 
    && selectedCorporateAccount.credit_limit > 0 
    && newCorporateBalance > selectedCorporateAccount.credit_limit;

  const handleSubmit = () => {
    if (!paymentAmount || paymentAmount <= 0) return;

    const actualPaymentMethod: PaymentMethod = isCorporatePayment ? "other" : (paymentMethod as PaymentMethod);

    recordPayment.mutate(
      {
        folioId,
        amount: paymentAmount,
        paymentMethod: actualPaymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: isCorporatePayment && selectedCorporateAccount
          ? `Corporate billing: ${selectedCorporateAccount.company_name}${notes ? ` - ${notes}` : ""}`
          : notes || undefined,
        corporateAccountId: selectedCorporateAccountId || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setReferenceNumber("");
          setNotes("");
          setPaymentMethod("cash");
        },
      }
    );
  };

  const handlePayFull = () => {
    setAmount(balance.toString());
  };

  // Build payment methods list with all linked corporate accounts
  const availablePaymentMethods: { value: string; label: string; isCorporate?: boolean }[] = [
    ...paymentMethods,
    ...guestCorporateAccounts.map(account => ({
      value: `corporate_${account.id}`,
      label: `Corporate Account - ${account.company_name}`,
      isCorporate: true,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold">৳{balance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.isCorporate && <Building2 className="h-4 w-4 mr-2 inline" />}
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Corporate Account Info */}
          {isCorporatePayment && selectedCorporateAccount && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Billing to: {selectedCorporateAccount.company_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="ml-2 font-medium">{formatCurrency(Number(selectedCorporateAccount.current_balance))}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Credit Limit:</span>
                  <span className="ml-2 font-medium">
                    {selectedCorporateAccount.credit_limit > 0 
                      ? formatCurrency(selectedCorporateAccount.credit_limit) 
                      : "Unlimited"}
                  </span>
                </div>
              </div>
              {paymentAmount > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-sm">After Payment:</span>
                  <span className={`ml-2 font-medium ${exceedsCreditLimit ? "text-amber-600" : ""}`}>
                    {formatCurrency(newCorporateBalance)}
                  </span>
                </div>
              )}
              {exceedsCreditLimit && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This payment will exceed the credit limit by {formatCurrency(newCorporateBalance - selectedCorporateAccount.credit_limit)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount (৳)</Label>
              <Button type="button" variant="link" size="sm" onClick={handlePayFull}>
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

          {(paymentMethod === "credit_card" || paymentMethod === "debit_card" || paymentMethod === "bank_transfer") && (
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Transaction ID or reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
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
            disabled={!amount || parseFloat(amount) <= 0 || recordPayment.isPending}
          >
            {recordPayment.isPending ? "Recording..." : `Record ৳${parseFloat(amount || "0").toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
