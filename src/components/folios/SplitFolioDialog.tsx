import { useState } from "react";
import { Scissors, Check } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSplitFolio, type FolioItem } from "@/hooks/useFolios";

interface SplitFolioDialogProps {
  folioId: string;
  items: FolioItem[];
  guestId: string;
  propertyId: string;
  reservationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SplitFolioDialog({ 
  folioId, 
  items, 
  guestId, 
  propertyId, 
  reservationId,
  open, 
  onOpenChange 
}: SplitFolioDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const splitFolio = useSplitFolio();

  const activeItems = items.filter(item => !item.voided);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === activeItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(activeItems.map(item => item.id));
    }
  };

  const selectedTotal = activeItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + Number(item.total_price), 0);

  const handleSubmit = () => {
    if (selectedItems.length === 0) return;

    splitFolio.mutate(
      {
        sourceFolioId: folioId,
        itemIds: selectedItems,
        guestId,
        propertyId,
        reservationId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedItems([]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Split Folio
          </DialogTitle>
          <DialogDescription>
            Select charges to move to a new folio. A new folio will be created with the selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              <Check className="h-4 w-4 mr-1" />
              {selectedItems.length === activeItems.length ? "Deselect All" : "Select All"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} of {activeItems.length} selected
            </span>
          </div>

          <ScrollArea className="h-64 rounded-md border">
            <div className="p-4 space-y-2">
              {activeItems.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No charges available to split
                </div>
              ) : (
                activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.item_type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} • {format(new Date(item.service_date), "MMM d")}
                      </p>
                    </div>
                    <p className="font-medium">৳{Number(item.total_price).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {selectedItems.length > 0 && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Total to split</p>
              <p className="text-2xl font-bold">৳{selectedTotal.toLocaleString()}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || splitFolio.isPending}
          >
            {splitFolio.isPending ? "Creating..." : "Create New Folio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
