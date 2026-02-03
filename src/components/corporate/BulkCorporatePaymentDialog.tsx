import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  useOutstandingFoliosForCorporate,
  useBulkCorporatePayment,
  type OutstandingFolio,
} from "@/hooks/useCorporateBulkPayment";
import { type CorporateAccount } from "@/hooks/useCorporateAccounts";

interface BulkCorporatePaymentDialogProps {
  account: CorporateAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkCorporatePaymentDialog({
  account,
  open,
  onOpenChange,
}: BulkCorporatePaymentDialogProps) {
  const [selectedFolios, setSelectedFolios] = useState<Set<string>>(new Set());
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const { data: folios = [], isLoading } = useOutstandingFoliosForCorporate(
    open ? account?.id || null : null
  );
  const bulkPayment = useBulkCorporatePayment();

  // Initialize payment amounts when folios load
  useEffect(() => {
    if (folios.length > 0) {
      const amounts: Record<string, number> = {};
      folios.forEach((f) => {
        amounts[f.id] = f.balance;
      });
      setPaymentAmounts(amounts);
    }
  }, [folios]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFolios(new Set());
      setPaymentAmounts({});
      setPaymentMethod("bank_transfer");
      setReferenceNumber("");
      setNotes("");
    }
  }, [open]);

  const totalSelectedBalance = useMemo(() => {
    return folios
      .filter((f) => selectedFolios.has(f.id))
      .reduce((sum, f) => sum + (paymentAmounts[f.id] || 0), 0);
  }, [selectedFolios, folios, paymentAmounts]);

  const handleSelectAll = () => {
    if (selectedFolios.size === folios.length) {
      setSelectedFolios(new Set());
    } else {
      setSelectedFolios(new Set(folios.map((f) => f.id)));
    }
  };

  const handleToggleFolio = (folioId: string) => {
    const newSelected = new Set(selectedFolios);
    if (newSelected.has(folioId)) {
      newSelected.delete(folioId);
    } else {
      newSelected.add(folioId);
    }
    setSelectedFolios(newSelected);
  };

  const handleAmountChange = (folioId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    const folio = folios.find((f) => f.id === folioId);
    // Don't allow amount greater than balance
    const maxAmount = folio?.balance || 0;
    setPaymentAmounts((prev) => ({
      ...prev,
      [folioId]: Math.min(amount, maxAmount),
    }));
  };

  const handleSubmit = async () => {
    if (selectedFolios.size === 0 || !account) return;

    const folioPayments = Array.from(selectedFolios)
      .map((folioId) => ({
        folioId,
        amount: paymentAmounts[folioId] || 0,
      }))
      .filter((p) => p.amount > 0);

    if (folioPayments.length === 0) {
      return;
    }

    await bulkPayment.mutateAsync({
      corporateAccountId: account.id,
      folioPayments,
      paymentMethod: paymentMethod as any,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });

    onOpenChange(false);
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            Record Bulk Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment from <strong>{account.company_name}</strong> to settle
            multiple outstanding folios at once.
          </DialogDescription>
        </DialogHeader>

        {/* Account Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-muted/30">
            <CardContent className="p-3 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-lg font-bold text-amber-600">
                  ৳{account.current_balance.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Credit Limit</p>
                <p className="text-lg font-bold">
                  ৳{account.credit_limit.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Outstanding Folios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Outstanding Folios</Label>
            {folios.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedFolios.size === folios.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          <ScrollArea className="h-[200px] border rounded-lg p-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : folios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">All Settled!</p>
                <p className="text-xs text-muted-foreground">
                  No outstanding folios for this account
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {folios.map((folio) => (
                  <FolioItem
                    key={folio.id}
                    folio={folio}
                    isSelected={selectedFolios.has(folio.id)}
                    amount={paymentAmounts[folio.id] || 0}
                    onToggle={() => handleToggleFolio(folio.id)}
                    onAmountChange={(value) => handleAmountChange(folio.id, value)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Payment Details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="bank_transfer">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Transfer
                  </span>
                </SelectItem>
                <SelectItem value="cash">
                  <span className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </span>
                </SelectItem>
                <SelectItem value="credit_card">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </span>
                </SelectItem>
                <SelectItem value="debit_card">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Debit Card
                  </span>
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Check/Transfer #"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional payment notes..."
            rows={2}
          />
        </div>

        {/* Payment Summary */}
        {selectedFolios.size > 0 && (
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedFolios.size} folio(s) selected
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  ৳{totalSelectedBalance.toLocaleString()}
                </p>
              </div>
              <Badge className="bg-emerald-500 text-white border-none">
                Total Payment
              </Badge>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedFolios.size === 0 || totalSelectedBalance === 0 || bulkPayment.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none"
          >
            {bulkPayment.isPending ? "Processing..." : `Record Payment`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FolioItemProps {
  folio: OutstandingFolio;
  isSelected: boolean;
  amount: number;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
}

function FolioItem({
  folio,
  isSelected,
  amount,
  onToggle,
  onAmountChange,
}: FolioItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{folio.folio_number}</span>
          {folio.confirmation_number && (
            <Badge variant="outline" className="text-xs">
              {folio.confirmation_number}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{folio.guest_name}</p>
        {folio.check_in_date && folio.check_out_date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(folio.check_in_date), "MMM d")} -{" "}
            {format(new Date(folio.check_out_date), "MMM d")}
          </p>
        )}
      </div>

      <div className="text-right space-y-1">
        <p className="text-xs text-muted-foreground">Balance: ৳{folio.balance.toLocaleString()}</p>
        {isSelected && (
          <Input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-24 h-7 text-sm text-right"
            min={0}
            max={folio.balance}
            step={0.01}
          />
        )}
      </div>
    </div>
  );
}
