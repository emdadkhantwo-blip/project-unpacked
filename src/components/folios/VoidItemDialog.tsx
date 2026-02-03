import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVoidFolioItem, FolioItem } from "@/hooks/useFolios";

interface VoidItemDialogProps {
  item: FolioItem;
  folioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidItemDialog({ item, folioId, open, onOpenChange }: VoidItemDialogProps) {
  const [reason, setReason] = useState("");
  const voidItem = useVoidFolioItem();

  const handleVoid = () => {
    if (!reason.trim()) return;

    voidItem.mutate(
      {
        itemId: item.id,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void Charge</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to void "{item.description}" for ৳{Number(item.total_price).toFixed(2)}.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-2">
          <Label>Reason for voiding *</Label>
          <Textarea
            placeholder="Please provide a reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={!reason.trim() || voidItem.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {voidItem.isPending ? "Voiding..." : "Void Charge"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
