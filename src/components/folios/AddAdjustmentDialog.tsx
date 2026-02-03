import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAddFolioAdjustment } from "@/hooks/useFolios";

interface AddAdjustmentDialogProps {
  folioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdjustmentDialog({ folioId, open, onOpenChange }: AddAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<"discount" | "debit">("discount");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const addAdjustment = useAddFolioAdjustment();

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || !reason.trim()) return;

    addAdjustment.mutate(
      {
        folioId,
        amount: adjustmentType === "discount" ? -numAmount : numAmount,
        reason: reason.trim(),
        isDiscount: adjustmentType === "discount",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount("");
          setReason("");
          setAdjustmentType("discount");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Adjustment</DialogTitle>
          <DialogDescription>
            Add a discount (credit) or additional charge (debit) to this folio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as "discount" | "debit")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="discount" id="discount" />
                <Label htmlFor="discount" className="font-normal cursor-pointer">
                  Discount (Credit)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="debit" />
                <Label htmlFor="debit" className="font-normal cursor-pointer">
                  Additional Charge (Debit)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Amount (৳)</Label>
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
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder={adjustmentType === "discount" 
                ? "e.g., Loyalty discount, Manager's approval..." 
                : "e.g., Late check-out fee, Damage charge..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className={`rounded-lg p-3 text-center ${adjustmentType === "discount" ? "bg-emerald-50" : "bg-amber-50"}`}>
              <p className="text-sm text-muted-foreground">
                {adjustmentType === "discount" ? "Discount Amount" : "Additional Charge"}
              </p>
              <p className={`text-2xl font-bold ${adjustmentType === "discount" ? "text-emerald-600" : "text-amber-600"}`}>
                {adjustmentType === "discount" ? "-" : "+"}৳{parseFloat(amount).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || !reason.trim() || addAdjustment.isPending}
          >
            {addAdjustment.isPending ? "Adding..." : "Add Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
