import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddFolioCharge, FolioItemType } from "@/hooks/useFolios";

interface AddChargeDialogProps {
  folioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const itemTypes: { value: FolioItemType; label: string }[] = [
  { value: "room_charge", label: "Room Charge" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "laundry", label: "Laundry" },
  { value: "minibar", label: "Minibar" },
  { value: "spa", label: "Spa" },
  { value: "parking", label: "Parking" },
  { value: "telephone", label: "Telephone" },
  { value: "internet", label: "Internet" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export function AddChargeDialog({ folioId, open, onOpenChange }: AddChargeDialogProps) {
  const [itemType, setItemType] = useState<FolioItemType>("miscellaneous");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const addCharge = useAddFolioCharge();

  const handleSubmit = () => {
    if (!description || !unitPrice) return;

    addCharge.mutate(
      {
        folioId,
        itemType,
        description,
        quantity: parseInt(quantity) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setDescription("");
          setQuantity("1");
          setUnitPrice("");
        },
      }
    );
  };

  const total = (parseInt(quantity) || 0) * (parseFloat(unitPrice) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Charge</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Charge Type</Label>
            <Select value={itemType} onValueChange={(v) => setItemType(v as FolioItemType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="e.g., Room service - Breakfast"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
            <Label>Unit Price (৳)</Label>
            <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          {total > 0 && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">৳{total.toFixed(2)}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description || !unitPrice || addCharge.isPending}
          >
            {addCharge.isPending ? "Adding..." : "Add Charge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
