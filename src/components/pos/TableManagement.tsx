import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  UtensilsCrossed,
  ChefHat,
  CheckCircle,
  Move,
  Save,
  X,
  RotateCcw,
  Plus,
  Trash2,
  DoorClosed,
} from "lucide-react";
import { POSOrder, POSOutlet, useUpdatePOSOrderStatus, useUpdatePOSOutlet, useCloseTable } from "@/hooks/usePOS";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface TableManagementProps {
  orders: POSOrder[];
  outletId: string;
  onSelectEmptyTable?: (tableId: string) => void;
  outlet?: POSOutlet;
}

interface TableInfo {
  tableNumber: string;
  orders: POSOrder[];
  totalCovers: number;
  totalAmount: number;
  primaryStatus: string;
  lastOrderTime: string;
}

interface TablePosition {
  id: string;
  name: string;
  seats: number;
  x: number;
  y: number;
}

const statusConfig: Record<string, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  gradient: string;
  label: string; 
  icon: React.ReactNode;
}> = {
  pending: { 
    color: "text-amber-700", 
    bgColor: "bg-amber-100", 
    borderColor: "border-amber-300",
    gradient: "from-amber-500 to-orange-600",
    label: "Pending", 
    icon: <Clock className="h-4 w-4" /> 
  },
  preparing: { 
    color: "text-blue-700", 
    bgColor: "bg-blue-100", 
    borderColor: "border-blue-300",
    gradient: "from-blue-500 to-indigo-600",
    label: "Preparing", 
    icon: <ChefHat className="h-4 w-4" /> 
  },
  ready: { 
    color: "text-emerald-700", 
    bgColor: "bg-emerald-100", 
    borderColor: "border-emerald-300",
    gradient: "from-emerald-500 to-teal-600",
    label: "Ready", 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  served: { 
    color: "text-purple-700", 
    bgColor: "bg-purple-100", 
    borderColor: "border-purple-300",
    gradient: "from-purple-500 to-violet-600",
    label: "Served", 
    icon: <UtensilsCrossed className="h-4 w-4" /> 
  },
};

// Default table layout
const defaultTableLayout: TablePosition[] = [
  { id: "T1", name: "Table 1", seats: 2, x: 0, y: 0 },
  { id: "T2", name: "Table 2", seats: 4, x: 1, y: 0 },
  { id: "T3", name: "Table 3", seats: 4, x: 2, y: 0 },
  { id: "T4", name: "Table 4", seats: 6, x: 3, y: 0 },
  { id: "T5", name: "Table 5", seats: 2, x: 0, y: 1 },
  { id: "T6", name: "Table 6", seats: 4, x: 1, y: 1 },
  { id: "T7", name: "Table 7", seats: 6, x: 2, y: 1 },
  { id: "T8", name: "Table 8", seats: 8, x: 3, y: 1 },
  { id: "B1", name: "Bar 1", seats: 2, x: 0, y: 2 },
  { id: "B2", name: "Bar 2", seats: 2, x: 1, y: 2 },
  { id: "B3", name: "Bar 3", seats: 4, x: 2, y: 2 },
  { id: "B4", name: "Bar 4", seats: 4, x: 3, y: 2 },
];

const GRID_SIZE = 4;
const CELL_SIZE = 160; // pixels per grid cell

export function TableManagement({ orders, outletId, onSelectEmptyTable, outlet }: TableManagementProps) {
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tableLayout, setTableLayout] = useState<TablePosition[]>(defaultTableLayout);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  
  // Close table states
  const [tableToClose, setTableToClose] = useState<TableInfo | null>(null);
  
  // Add table states
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [newTableId, setNewTableId] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);
  
  const updateOrderStatus = useUpdatePOSOrderStatus();
  const updateOutlet = useUpdatePOSOutlet();
  const closeTable = useCloseTable();

  // Load saved layout from outlet settings
  useEffect(() => {
    if (outlet?.settings && typeof outlet.settings === 'object') {
      const settings = outlet.settings as { tableLayout?: TablePosition[] };
      if (settings.tableLayout && Array.isArray(settings.tableLayout)) {
        setTableLayout(settings.tableLayout);
      }
    }
  }, [outlet?.settings]);

  // Group orders by table
  const tableOrders = orders.reduce<Record<string, POSOrder[]>>((acc, order) => {
    if (order.table_number && !["posted", "cancelled"].includes(order.status)) {
      const key = order.table_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
    }
    return acc;
  }, {});

  // Calculate table info
  const getTableInfo = (tableNumber: string): TableInfo | null => {
    const tableOrdersList = tableOrders[tableNumber];
    if (!tableOrdersList || tableOrdersList.length === 0) return null;

    const totalCovers = tableOrdersList.reduce((sum, o) => sum + (o.covers || 1), 0);
    const totalAmount = tableOrdersList.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    // Get primary status (worst status first: pending > preparing > ready > served)
    const statusPriority = ["pending", "preparing", "ready", "served"];
    const primaryStatus = statusPriority.find(s => 
      tableOrdersList.some(o => o.status === s)
    ) || "served";

    const lastOrderTime = tableOrdersList
      .map(o => o.created_at)
      .sort()
      .reverse()[0];

    return {
      tableNumber,
      orders: tableOrdersList,
      totalCovers,
      totalAmount,
      primaryStatus,
      lastOrderTime,
    };
  };

  const handleMarkServed = async (orderId: string) => {
    await updateOrderStatus.mutateAsync();
  };

  const handleMarkReady = async (orderId: string) => {
    await updateOrderStatus.mutateAsync();
  };

  const handleDragEnd = (tableId: string, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    setDraggedTable(null);
    
    // Get the grid container bounds
    const gridContainer = document.getElementById('table-grid-container');
    if (!gridContainer) return;
    
    const rect = gridContainer.getBoundingClientRect();
    const table = tableLayout.find(t => t.id === tableId);
    if (!table) return;

    // Calculate new position based on drag offset
    const currentPixelX = table.x * CELL_SIZE;
    const currentPixelY = table.y * CELL_SIZE;
    
    const newPixelX = currentPixelX + info.offset.x;
    const newPixelY = currentPixelY + info.offset.y;
    
    // Snap to grid
    const newX = Math.round(newPixelX / CELL_SIZE);
    const newY = Math.round(newPixelY / CELL_SIZE);
    
    // Clamp to bounds
    const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
    const clampedY = Math.max(0, Math.min(2, newY)); // 3 rows (0, 1, 2)
    
    // Check if position is already occupied
    const isOccupied = tableLayout.some(t => 
      t.id !== tableId && t.x === clampedX && t.y === clampedY
    );
    
    if (isOccupied) {
      // Swap positions with the table at the target location
      setTableLayout(prev => prev.map(t => {
        if (t.id === tableId) {
          return { ...t, x: clampedX, y: clampedY };
        }
        if (t.x === clampedX && t.y === clampedY) {
          return { ...t, x: table.x, y: table.y };
        }
        return t;
      }));
    } else {
      // Move to empty spot
      setTableLayout(prev => prev.map(t => 
        t.id === tableId ? { ...t, x: clampedX, y: clampedY } : t
      ));
    }
  };

  const handleSaveLayout = async () => {
    try {
      const currentSettings = (outlet?.settings as Record<string, Json>) || {};
      // Convert to JSON-compatible format
      const layoutData = tableLayout.map(t => ({
        id: t.id,
        name: t.name,
        seats: t.seats,
        x: t.x,
        y: t.y,
      }));
      await updateOutlet.mutateAsync();
      toast.success("Floor plan layout saved!");
      setIsEditMode(false);
    } catch (error) {
      toast.error("Failed to save layout");
    }
  };

  const handleResetLayout = () => {
    setTableLayout(defaultTableLayout);
  };

  const handleCancelEdit = () => {
    // Reload from outlet settings
    if (outlet?.settings && typeof outlet.settings === 'object') {
      const settings = outlet.settings as { tableLayout?: TablePosition[] };
      if (settings.tableLayout && Array.isArray(settings.tableLayout)) {
        setTableLayout(settings.tableLayout);
      } else {
        setTableLayout(defaultTableLayout);
      }
    } else {
      setTableLayout(defaultTableLayout);
    }
    setIsEditMode(false);
  };

  // Handle close table action
  const handleCloseTable = async () => {
    if (!tableToClose) return;
    
    try {
      await closeTable.mutateAsync();
      setTableToClose(null);
      setSelectedTable(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle add table
  const handleAddTable = () => {
    const trimmedId = newTableId.trim();
    
    if (!trimmedId) {
      toast.error("Please enter a table ID");
      return;
    }
    
    // Validate unique ID
    if (tableLayout.some(t => t.id.toLowerCase() === trimmedId.toLowerCase())) {
      toast.error("Table ID already exists");
      return;
    }
    
    // Find first empty grid position
    const occupiedPositions = new Set(
      tableLayout.map(t => `${t.x},${t.y}`)
    );
    
    let newX = 0, newY = 0;
    let found = false;
    
    // Check existing grid first
    outer: for (let y = 0; y <= 2; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!occupiedPositions.has(`${x},${y}`)) {
          newX = x;
          newY = y;
          found = true;
          break outer;
        }
      }
    }
    
    // If no space found, add to a new row
    if (!found) {
      newX = 0;
      newY = Math.max(...tableLayout.map(t => t.y)) + 1;
    }
    
    // Add to layout
    setTableLayout(prev => [...prev, {
      id: trimmedId,
      name: trimmedId,
      seats: newTableSeats,
      x: newX,
      y: newY,
    }]);
    
    setShowAddTableDialog(false);
    setNewTableId("");
    setNewTableSeats(4);
    toast.success(`Table ${trimmedId} added`);
  };

  // Handle delete table in edit mode
  const handleDeleteTable = (tableId: string) => {
    // Check if table has active orders
    const hasOrders = tableOrders[tableId]?.length > 0;
    if (hasOrders) {
      toast.error("Cannot delete table with active orders");
      return;
    }
    
    setTableLayout(prev => prev.filter(t => t.id !== tableId));
  };

  const stats = [
    {
      label: "Occupied Tables",
      value: Object.keys(tableOrders).length,
      icon: UtensilsCrossed,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Pending Orders",
      value: orders.filter(o => o.status === "pending" && o.table_number).length,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Ready to Serve",
      value: orders.filter(o => o.status === "ready" && o.table_number).length,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Total Covers",
      value: orders.filter(o => !["posted", "cancelled"].includes(o.status) && o.table_number)
        .reduce((sum, o) => sum + (o.covers || 1), 0),
      icon: Users,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  // Sort tables by position for rendering
  const sortedTables = useMemo(() => {
    return [...tableLayout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }, [tableLayout]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label}
            className={cn(
              "relative overflow-hidden border-none shadow-lg",
              `bg-gradient-to-br ${stat.gradient}`
            )}
          >
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <CardContent className="relative z-10 flex items-center gap-4 p-4">
              <div className="rounded-xl bg-white/20 p-3">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Grid */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              Floor Plan
              {isEditMode && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                  Edit Mode
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTableDialog(true)}
                    className="gap-1 border-primary text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Add Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetLayout}
                    className="gap-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveLayout}
                    className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                    disabled={updateOutlet.isPending}
                  >
                    <Save className="h-4 w-4" />
                    Save Layout
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="gap-1"
                >
                  <Move className="h-4 w-4" />
                  Edit Layout
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            id="table-grid-container"
            className="relative grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {sortedTables.map((table) => {
              const info = getTableInfo(table.id);
              const isOccupied = !!info;
              const config = info ? statusConfig[info.primaryStatus] : null;

              return (
                <motion.div
                  key={table.id}
                  className={cn(
                    "relative rounded-xl border-2 p-4 transition-all cursor-pointer",
                    isOccupied
                      ? cn("bg-gradient-to-br", config?.gradient, "border-transparent text-white")
                      : "bg-muted/50 border-dashed border-muted-foreground/30 hover:border-primary/50",
                    isEditMode && "cursor-move"
                  )}
                  style={{
                    gridColumn: table.x + 1,
                    gridRow: table.y + 1,
                  }}
                  drag={isEditMode}
                  dragMomentum={false}
                  onDragStart={() => setDraggedTable(table.id)}
                  onDragEnd={(_, info) => handleDragEnd(table.id, info)}
                  onClick={() => {
                    if (!isEditMode) {
                      if (isOccupied) {
                        setSelectedTable(info);
                      } else {
                        onSelectEmptyTable?.(table.id);
                      }
                    }
                  }}
                  whileHover={{ scale: isEditMode ? 1.02 : 1 }}
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white hover:bg-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{table.id}</span>
                    {isOccupied ? (
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {config?.icon}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs opacity-50">
                        {table.seats} seats
                      </Badge>
                    )}
                  </div>
                  {isOccupied && info && (
                    <div className="mt-2 text-sm opacity-90">
                      <p>{info.totalCovers} covers • {info.orders.length} order(s)</p>
                      <p className="font-semibold">৳{info.totalAmount.toFixed(0)}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table Detail Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Table {selectedTable?.tableNumber}
              {selectedTable && (
                <Badge className={cn("ml-2", statusConfig[selectedTable.primaryStatus]?.bgColor, statusConfig[selectedTable.primaryStatus]?.color)}>
                  {statusConfig[selectedTable.primaryStatus]?.label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTable?.totalCovers} covers • {selectedTable?.orders.length} active order(s)
            </DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4">
                {selectedTable.orders.map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">#{order.order_number.split("-").pop()}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(order.created_at), "HH:mm")}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.item_name}</span>
                          <span className="text-muted-foreground">৳{Number(item.total_price).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {order.status === "preparing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMarkReady(order.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ready
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMarkServed(order.id)}
                        >
                          <UtensilsCrossed className="mr-1 h-3 w-3" />
                          Served
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedTable(null)}
            >
              Close
            </Button>
            {selectedTable && selectedTable.orders.every(o => o.status === "served") && (
              <Button
                variant="default"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                onClick={() => setTableToClose(selectedTable)}
              >
                <DoorClosed className="mr-2 h-4 w-4" />
                Close Table
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Table Confirmation */}
      <AlertDialog open={!!tableToClose} onOpenChange={(open) => !open && setTableToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Table {tableToClose?.tableNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all orders as complete and free up the table. 
              Total bill: ৳{tableToClose?.totalAmount.toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseTable}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              {closeTable.isPending ? "Closing..." : "Close Table"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Enter the table ID and number of seats.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Table ID</Label>
              <Input
                placeholder="e.g., T9 or VIP1"
                value={newTableId}
                onChange={(e) => setNewTableId(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label>Seats</Label>
              <Select
                value={newTableSeats.toString()}
                onValueChange={(v) => setNewTableSeats(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 4, 6, 8, 10, 12].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} seats
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable}>
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
