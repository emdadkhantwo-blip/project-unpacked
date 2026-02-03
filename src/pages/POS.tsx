import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UtensilsCrossed,
  Plus,
  ShoppingCart,
  Receipt,
  ChefHat,
  Settings,
  Coffee,
  Wine,
  ConciergeBell,
  LayoutGrid,
} from "lucide-react";
import { usePOSOutlets, usePOSItems, usePOSOrders, usePOSCategories, POSItem, POSOrder } from "@/hooks/usePOS";
import { POSOrderPanel } from "@/components/pos/POSOrderPanel";
import { POSMenuGrid } from "@/components/pos/POSMenuGrid";
import { POSOrdersTable } from "@/components/pos/POSOrdersTable";
import { KitchenDisplay } from "@/components/pos/KitchenDisplay";
import { POSSettingsDialog } from "@/components/pos/POSSettingsDialog";
import { CreateOutletDialog } from "@/components/pos/CreateOutletDialog";
import { TableManagement } from "@/components/pos/TableManagement";

const outletTypeIcons: Record<string, React.ReactNode> = {
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  bar: <Wine className="h-4 w-4" />,
  cafe: <Coffee className="h-4 w-4" />,
  room_service: <ConciergeBell className="h-4 w-4" />,
};

export default function POS() {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("order");
  const [cart, setCart] = useState<Array<{ item: POSItem; quantity: number; notes?: string }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateOutlet, setShowCreateOutlet] = useState(false);
  const [preSelectedTable, setPreSelectedTable] = useState<string>("");

  // Handler for table selection from floor plan
  const handleSelectTable = (tableId: string) => {
    setPreSelectedTable(tableId);
    setActiveTab("order");
  };

  const { data: outlets = [], isLoading: outletsLoading } = usePOSOutlets();
  const { data: categories = [] } = usePOSCategories(selectedOutletId || undefined);
  const { data: items = [] } = usePOSItems(selectedOutletId || undefined);
  const { data: orders = [] } = usePOSOrders(selectedOutletId || undefined);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

  // Auto-select first outlet
  if (!selectedOutletId && outlets.length > 0) {
    setSelectedOutletId(outlets[0].id);
  }

  const handleAddToCart = (item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateCartItem = (itemId: string, quantity: number, notes?: string) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((c) =>
          c.item.id === itemId ? { ...c, quantity, notes } : c
        )
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const activeOrders = orders.filter((o) => !["posted", "cancelled"].includes(o.status));
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  if (outletsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading POS...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (outlets.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No POS Outlets</h2>
          <p className="text-muted-foreground">
            Create your first restaurant or bar outlet to start taking orders.
          </p>
          <Button onClick={() => setShowCreateOutlet(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Outlet
          </Button>
          <CreateOutletDialog
            open={showCreateOutlet}
            onOpenChange={setShowCreateOutlet}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <Select
              value={selectedOutletId || ""}
              onValueChange={setSelectedOutletId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    <div className="flex items-center gap-2">
                      {outletTypeIcons[outlet.type] || <UtensilsCrossed className="h-4 w-4" />}
                      {outlet.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOutlet && (
              <Badge variant="outline" className="capitalize">
                {selectedOutlet.type.replace("_", " ")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateOutlet(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Outlet
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Active Orders</p>
                <p className="text-2xl font-bold text-white">{activeOrders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Pending</p>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Preparing</p>
                <p className="text-2xl font-bold text-white">{preparingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Today's Orders</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="order" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              New Order
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Receipt className="h-4 w-4" />
              Orders
              {activeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kitchen" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Kitchen Display
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Tables
              {Object.keys(orders.filter(o => o.table_number && !["posted", "cancelled"].includes(o.status)).reduce((acc, o) => ({ ...acc, [o.table_number!]: true }), {})).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(orders.filter(o => o.table_number && !["posted", "cancelled"].includes(o.status)).reduce((acc, o) => ({ ...acc, [o.table_number!]: true }), {})).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="mt-4 flex-1">
            <div className="grid h-full grid-cols-3 gap-4">
              {/* Menu Grid */}
              <div className="col-span-2">
                <POSMenuGrid
                  items={items}
                  categories={categories}
                  onAddItem={handleAddToCart}
                />
              </div>
              {/* Order Panel */}
              <div>
                <POSOrderPanel
                  cart={cart}
                  outlet={selectedOutlet!}
                  onUpdateItem={handleUpdateCartItem}
                  onClearCart={handleClearCart}
                  initialTableNumber={preSelectedTable}
                  onTableNumberChange={setPreSelectedTable}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4 flex-1">
            <POSOrdersTable orders={orders} outletId={selectedOutletId!} />
          </TabsContent>

          <TabsContent value="kitchen" className="mt-4 flex-1">
            <KitchenDisplay outletId={selectedOutletId!} />
          </TabsContent>

          <TabsContent value="tables" className="mt-4 flex-1">
            <TableManagement 
              orders={orders} 
              outletId={selectedOutletId!}
              onSelectEmptyTable={handleSelectTable}
              outlet={selectedOutlet}
            />
          </TabsContent>
        </Tabs>
      </div>

      <POSSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        outlet={selectedOutlet}
      />
      <CreateOutletDialog
        open={showCreateOutlet}
        onOpenChange={setShowCreateOutlet}
      />
    </DashboardLayout>
  );
}
