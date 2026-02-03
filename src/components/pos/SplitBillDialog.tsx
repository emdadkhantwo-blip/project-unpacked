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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ListChecks,
  Plus,
  Minus,
  Wallet,
} from "lucide-react";
import { POSOrder } from "@/hooks/usePOS";

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: POSOrder | null;
  onSplit: (splits: SplitPayment[]) => void;
}

export interface SplitPayment {
  amount: number;
  items?: string[];
  label: string;
}

export function SplitBillDialog({ open, onOpenChange, order, onSplit }: SplitBillDialogProps) {
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom" | "items">("equal");
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<number[]>([]);
  const [selectedItemsByPerson, setSelectedItemsByPerson] = useState<Record<number, string[]>>({});
  const [itemSplitPeople, setItemSplitPeople] = useState(2);

  if (!order) return null;

  const totalAmount = Number(order.total_amount);
  const items = order.items || [];

  // Equal split calculations
  const equalSplitAmount = totalAmount / numberOfSplits;

  // Custom split validation
  const customTotal = customAmounts.reduce((sum, amt) => sum + (amt || 0), 0);
  const customRemaining = totalAmount - customTotal;

  // Items split calculations
  const getPersonTotal = (personIndex: number) => {
    const personItems = selectedItemsByPerson[personIndex] || [];
    return items
      .filter((item) => personItems.includes(item.id))
      .reduce((sum, item) => sum + Number(item.total_price), 0);
  };

  const handleEqualSplit = () => {
    const splits: SplitPayment[] = Array.from({ length: numberOfSplits }, (_, i) => ({
      amount: equalSplitAmount,
      label: `Person ${i + 1}`,
    }));
    onSplit(splits);
    onOpenChange(false);
  };

  const handleCustomSplit = () => {
    if (Math.abs(customRemaining) > 0.01) {
      return; // Don't allow if amounts don't add up
    }
    const splits: SplitPayment[] = customAmounts.map((amount, i) => ({
      amount,
      label: `Person ${i + 1}`,
    }));
    onSplit(splits);
    onOpenChange(false);
  };

  const handleItemsSplit = () => {
    const splits: SplitPayment[] = Array.from({ length: itemSplitPeople }, (_, i) => ({
      amount: getPersonTotal(i),
      items: selectedItemsByPerson[i] || [],
      label: `Person ${i + 1}`,
    }));
    onSplit(splits);
    onOpenChange(false);
  };

  const toggleItemForPerson = (personIndex: number, itemId: string) => {
    setSelectedItemsByPerson((prev) => {
      const personItems = prev[personIndex] || [];
      const isSelected = personItems.includes(itemId);
      
      // First, remove the item from all other people
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum !== personIndex) {
          updated[keyNum] = updated[keyNum].filter((id) => id !== itemId);
        }
      });
      
      // Then toggle for this person
      if (isSelected) {
        updated[personIndex] = personItems.filter((id) => id !== itemId);
      } else {
        updated[personIndex] = [...personItems, itemId];
      }
      
      return updated;
    });
  };

  const initializeCustomAmounts = (count: number) => {
    const baseAmount = totalAmount / count;
    setCustomAmounts(Array(count).fill(parseFloat(baseAmount.toFixed(2))));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Split Bill - {order.order_number}
          </DialogTitle>
          <DialogDescription>
            Total: ৳{totalAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={splitMethod} onValueChange={(v) => setSplitMethod(v as typeof splitMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equal" className="gap-2">
              <Users className="h-4 w-4" />
              Equal Split
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Wallet className="h-4 w-4" />
              Custom Amounts
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <ListChecks className="h-4 w-4" />
              By Items
            </TabsTrigger>
          </TabsList>

          {/* Equal Split */}
          <TabsContent value="equal" className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSplits(Math.max(2, numberOfSplits - 1))}
                disabled={numberOfSplits <= 2}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-4xl font-bold">{numberOfSplits}</p>
                <p className="text-sm text-muted-foreground">people</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSplits(Math.min(10, numberOfSplits + 1))}
                disabled={numberOfSplits >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Each person pays</p>
                  <p className="text-3xl font-bold text-primary">৳{equalSplitAmount.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEqualSplit}>Split Equally</Button>
            </DialogFooter>
          </TabsContent>

          {/* Custom Amounts */}
          <TabsContent value="custom" className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Number of splits:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const newCount = Math.max(2, customAmounts.length - 1);
                    initializeCustomAmounts(newCount);
                  }}
                  disabled={customAmounts.length <= 2}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{customAmounts.length || 2}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const newCount = Math.min(10, (customAmounts.length || 2) + 1);
                    initializeCustomAmounts(newCount);
                  }}
                  disabled={customAmounts.length >= 10}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {customAmounts.length === 0 && (
                <Button size="sm" variant="secondary" onClick={() => initializeCustomAmounts(2)}>
                  Start
                </Button>
              )}
            </div>

            {customAmounts.length > 0 && (
              <>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {customAmounts.map((amount, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Label className="w-20">Person {index + 1}</Label>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => {
                              const newAmounts = [...customAmounts];
                              newAmounts[index] = parseFloat(e.target.value) || 0;
                              setCustomAmounts(newAmounts);
                            }}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span>Total assigned:</span>
                  <span className={customRemaining !== 0 ? "text-destructive" : "text-green-600"}>
                    ৳{customTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span className={customRemaining !== 0 ? "text-destructive font-bold" : ""}>
                    ৳{customRemaining.toFixed(2)}
                  </span>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCustomSplit} disabled={Math.abs(customRemaining) > 0.01}>
                    Split Bill
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          {/* By Items */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Number of people:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setItemSplitPeople(Math.max(2, itemSplitPeople - 1))}
                  disabled={itemSplitPeople <= 2}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{itemSplitPeople}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setItemSplitPeople(Math.min(10, itemSplitPeople + 1))}
                  disabled={itemSplitPeople >= 10}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[250px]">
              <div className="space-y-4">
                {Array.from({ length: itemSplitPeople }, (_, personIndex) => (
                  <Card key={personIndex}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Person {personIndex + 1}</span>
                        <Badge variant="secondary">৳{getPersonTotal(personIndex).toFixed(2)}</Badge>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const isSelected = (selectedItemsByPerson[personIndex] || []).includes(item.id);
                          const isAssignedToOther = Object.entries(selectedItemsByPerson).some(
                            ([key, items]) => parseInt(key) !== personIndex && items.includes(item.id)
                          );
                          
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                isAssignedToOther ? "opacity-50" : ""
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleItemForPerson(personIndex, item.id)}
                                disabled={isAssignedToOther}
                              />
                              <span className="flex-1 text-sm">
                                {item.quantity}x {item.item_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ৳{Number(item.total_price).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex justify-between text-sm">
              <span>Total assigned:</span>
              <span>
                ৳{Array.from({ length: itemSplitPeople }, (_, i) => getPersonTotal(i))
                  .reduce((sum, amt) => sum + amt, 0)
                  .toFixed(2)}
              </span>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleItemsSplit}>Split by Items</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
