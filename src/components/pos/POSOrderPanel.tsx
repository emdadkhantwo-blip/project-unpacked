import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash2, ShoppingCart, Send, Receipt, Users } from "lucide-react";
import { POSItem, POSOutlet, useCreatePOSOrder, useActiveFolios } from "@/hooks/usePOS";
import { useTenant } from "@/hooks/useTenant";
import { useRooms } from "@/hooks/useRooms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CartItem {
  item: POSItem;
  quantity: number;
  notes?: string;
}

interface POSOrderPanelProps {
  cart: CartItem[];
  outlet: POSOutlet;
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onClearCart: () => void;
  initialTableNumber?: string;
  onTableNumberChange?: (table: string) => void;
}

export function POSOrderPanel({ cart, outlet, onUpdateItem, onClearCart, initialTableNumber, onTableNumberChange }: POSOrderPanelProps) {
  const [tableNumber, setTableNumber] = useState(initialTableNumber || "");

  // Sync table number when selected from floor plan
  useEffect(() => {
    if (initialTableNumber) {
      setTableNumber(initialTableNumber);
    }
  }, [initialTableNumber]);

  // Notify parent when table number changes
  const handleTableNumberChange = (value: string) => {
    setTableNumber(value);
    onTableNumberChange?.(value);
  };
  const [covers, setCovers] = useState("1");
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { currentProperty } = useTenant();
  const { data: folios = [] } = useActiveFolios();
  const { data: rooms = [] } = useRooms();
  const createOrder = useCreatePOSOrder();

  const occupiedRooms = rooms.filter((r) => r.status === "occupied");

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const taxRate = currentProperty?.tax_rate || 0;
  const serviceChargeRate = currentProperty?.service_charge_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + taxAmount + serviceCharge;

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    const selectedFolio = folios.find((f) => f.id === selectedFolioId);

    createOrder.mutate(
      {
        outlet_id: outlet.id,
        outlet_code: outlet.code,
        folio_id: selectedFolioId || undefined,
        room_id: selectedRoomId || undefined,
        guest_id: selectedFolio?.guest_id || undefined,
        table_number: tableNumber || undefined,
        covers: parseInt(covers) || 1,
        notes: notes || undefined,
        items: cart.map((c) => ({
          item_id: c.item.id,
          item_name: c.item.name,
          quantity: c.quantity,
          unit_price: c.item.price,
          notes: c.notes,
        })),
      },
      {
        onSuccess: () => {
          onClearCart();
          setTableNumber("");
          setCovers("1");
          setSelectedFolioId(null);
          setSelectedRoomId(null);
          setNotes("");
        },
      }
    );
  };

  return (
    <Card className="flex h-full flex-col border-none shadow-lg bg-gradient-to-b from-card to-muted/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShoppingCart className="h-5 w-5" />
          </div>
          Current Order
          {cart.length > 0 && (
            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {cart.reduce((sum, c) => sum + c.quantity, 0)} items
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pb-0 pt-4">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Table #</Label>
            <Input
              placeholder="e.g., T1"
              value={tableNumber}
              onChange={(e) => handleTableNumberChange(e.target.value)}
              className="h-9 bg-muted/50 border-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Covers
            </Label>
            <Input
              type="number"
              min="1"
              value={covers}
              onChange={(e) => setCovers(e.target.value)}
              className="h-9 bg-muted/50 border-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Room (for room service)</Label>
          <Select
            value={selectedRoomId || "none"}
            onValueChange={(v) => setSelectedRoomId(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-9 bg-muted/50 border-none">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">No room</SelectItem>
              {occupiedRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  Room {room.room_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Receipt className="h-3 w-3" /> Post to Folio
          </Label>
          <Select
            value={selectedFolioId || "none"}
            onValueChange={(v) => setSelectedFolioId(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-9 bg-muted/50 border-none">
              <SelectValue placeholder="Select folio (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">Pay at counter</SelectItem>
              {folios.map((folio) => (
                <SelectItem key={folio.id} value={folio.id}>
                  {folio.folio_number} - {folio.guest?.first_name} {folio.guest?.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No items in order</p>
              <p className="text-xs">Click items from menu to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((cartItem, idx) => (
                <div
                  key={cartItem.item.id}
                  className={cn(
                    "rounded-xl border bg-card p-3 transition-all hover:shadow-md",
                    "border-l-4",
                    idx % 2 === 0 ? "border-l-blue-500" : "border-l-indigo-500"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{cartItem.item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ৳{Number(cartItem.item.price).toFixed(0)} each
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      ৳{(cartItem.item.price * cartItem.quantity).toFixed(0)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      onClick={() =>
                        onUpdateItem(cartItem.item.id, cartItem.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center font-bold text-lg">
                      {cartItem.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                      onClick={() =>
                        onUpdateItem(cartItem.item.id, cartItem.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => onUpdateItem(cartItem.item.id, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Special instructions..."
                    value={cartItem.notes || ""}
                    onChange={(e) =>
                      onUpdateItem(cartItem.item.id, cartItem.quantity, e.target.value)
                    }
                    className="mt-2 h-8 text-xs bg-muted/50 border-none"
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 bg-muted/30 rounded-b-lg">
        {/* Totals */}
        <div className="w-full space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax ({taxRate}%)</span>
            <span>৳{taxAmount.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service ({serviceChargeRate}%)</span>
            <span>৳{serviceCharge.toFixed(0)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-emerald-600">৳{total.toFixed(0)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={onClearCart}
            disabled={cart.length === 0}
          >
            Clear
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || createOrder.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createOrder.isPending ? "Sending..." : "Send Order"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
