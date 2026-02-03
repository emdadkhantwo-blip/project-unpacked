import { useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFolios, useTransferCharge } from "@/hooks/useFolios";
import type { FolioItem } from "@/hooks/useFolios";

interface TransferChargeDialogProps {
  item: FolioItem;
  sourceFolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferChargeDialog({ item, sourceFolioId, open, onOpenChange }: TransferChargeDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedFolioId, setSelectedFolioId] = useState<string>("");

  const { data: folios } = useFolios("open");
  const transferCharge = useTransferCharge();

  // Filter out the source folio and apply search
  const availableFolios = folios?.filter(f => {
    if (f.id === sourceFolioId) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      f.folio_number.toLowerCase().includes(query) ||
      f.guest?.first_name.toLowerCase().includes(query) ||
      f.guest?.last_name.toLowerCase().includes(query)
    );
  }) || [];

  const handleSubmit = () => {
    if (!selectedFolioId) return;

    transferCharge.mutate(
      {
        itemId: item.id,
        sourceFolioId,
        targetFolioId: selectedFolioId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedFolioId("");
          setSearch("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Charge
          </DialogTitle>
          <DialogDescription>
            Transfer "{item.description}" (৳{Number(item.total_price).toLocaleString()}) to another folio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by folio number or guest name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Target Folio</Label>
            <ScrollArea className="h-64 rounded-md border">
              {availableFolios.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No other open folios found
                </div>
              ) : (
                <RadioGroup value={selectedFolioId} onValueChange={setSelectedFolioId} className="p-4 space-y-2">
                  {availableFolios.map((folio) => (
                    <div
                      key={folio.id}
                      className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedFolioId(folio.id)}
                    >
                      <RadioGroupItem value={folio.id} id={folio.id} />
                      <div className="flex-1">
                        <p className="font-medium">{folio.folio_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {folio.guest?.first_name} {folio.guest?.last_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">৳{Number(folio.total_amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ৳{Number(folio.balance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFolioId || transferCharge.isPending}
          >
            {transferCharge.isPending ? "Transferring..." : "Transfer Charge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
