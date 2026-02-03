import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, MoveRight, AlertCircle } from "lucide-react";
import { POSOrder, POSOrderItem } from "@/hooks/usePOS";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransferItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceOrder: POSOrder | null;
  availableOrders: POSOrder[];
  onTransfer: (itemIds: string[], destinationOrderId: string) => void;
}

export function TransferItemsDialog({
  open,
  onOpenChange,
  sourceOrder,
  availableOrders,
  onTransfer,
}: TransferItemsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [destinationOrderId, setDestinationOrderId] = useState<string>("");

  if (!sourceOrder) return null;

  const items = sourceOrder.items || [];
  const destinationOrder = availableOrders.find((o) => o.id === destinationOrderId);

  // Filter out the source order from available destinations
  const destinationOptions = availableOrders.filter(
    (o) => o.id !== sourceOrder.id && !["posted", "cancelled"].includes(o.status)
  );

  const selectedTotal = items
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + Number(item.total_price), 0);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const handleTransfer = () => {
    if (selectedItems.length === 0 || !destinationOrderId) return;
    onTransfer(selectedItems, destinationOrderId);
    setSelectedItems([]);
    setDestinationOrderId("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedItems([]);
    setDestinationOrderId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="h-5 w-5" />
            Transfer Items
          </DialogTitle>
          <DialogDescription>
            Move items from {sourceOrder.order_number} to another table
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Order Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{sourceOrder.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {sourceOrder.table_number ? `Table ${sourceOrder.table_number}` : "No table"}
                  </p>
                </div>
                <Badge variant="outline">{sourceOrder.status}</Badge>
              </div>

              <div className="flex items-center justify-between mb-2">
                <Label>Select items to transfer:</Label>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedItems.length === items.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        selectedItems.includes(item.id)
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity}x {item.item_name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">Note: {item.notes}</p>
                        )}
                      </div>
                      <Badge variant="secondary">৳{Number(item.total_price).toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedItems.length > 0 && (
                <div className="mt-3 pt-3 border-t flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} item(s) selected
                  </span>
                  <span className="font-medium">৳{selectedTotal.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arrow */}
          {selectedItems.length > 0 && (
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Destination Selection */}
          <div className="space-y-2">
            <Label>Transfer to:</Label>
            {destinationOptions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No other active orders available. Create a new order first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={destinationOrderId} onValueChange={setDestinationOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination table/order" />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {order.table_number ? `Table ${order.table_number}` : order.order_number}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          - ৳{Number(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Destination Order Preview */}
          {destinationOrder && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{destinationOrder.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {destinationOrder.table_number
                        ? `Table ${destinationOrder.table_number}`
                        : "No table"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current total</p>
                    <p className="font-medium">৳{Number(destinationOrder.total_amount).toFixed(2)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">After transfer:</p>
                  <p className="text-lg font-bold text-primary">
                    ৳{(Number(destinationOrder.total_amount) + selectedTotal).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={selectedItems.length === 0 || !destinationOrderId}
          >
            <MoveRight className="mr-2 h-4 w-4" />
            Transfer {selectedItems.length} Item(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
