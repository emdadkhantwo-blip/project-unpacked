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
    await updateOrderStatus.mutateAsync({ orderId, status: "served" });
  };

  const handleMarkReady = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "ready" });
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
      await updateOutlet.mutateAsync({
        id: outletId,
        updates: {
          settings: {
            ...currentSettings,
            tableLayout: layoutData as Json,
          } as Json,
        },
      });
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
      await closeTable.mutateAsync({
        tableNumber: tableToClose.tableNumber,
        outletId,
      });
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
                    disabled={updateOutlet.isPending}
                    className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <Save className="h-4 w-4" />
                    Save Layout
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-sm font-normal mr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted border" />
                      <span className="text-muted-foreground">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Preparing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="text-muted-foreground">Served</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="gap-1"
                  >
                    <Move className="h-4 w-4" />
                    Edit Layout
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            id="table-grid-container"
            className="grid grid-cols-4 gap-4 relative"
            style={{ minHeight: `${3 * CELL_SIZE + 32}px` }}
          >
            {sortedTables.map((table) => {
              const tableInfo = getTableInfo(table.id);
              const status = statusConfig[tableInfo?.primaryStatus || ""] || null;
              const isOccupied = !!tableInfo;

              if (isEditMode) {
                const hasOrders = tableOrders[table.id]?.length > 0;
                return (
                  <motion.div
                    key={table.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={() => setDraggedTable(table.id)}
                    onDragEnd={(_, info) => handleDragEnd(table.id, info)}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-200",
                      "min-h-[140px] cursor-grab active:cursor-grabbing",
                      "border-dashed border-primary/50 bg-primary/5",
                      draggedTable === table.id && "shadow-2xl ring-2 ring-primary"
                    )}
                    style={{
                      gridColumn: table.x + 1,
                      gridRow: table.y + 1,
                    }}
                  >
                    <Move className="absolute top-2 right-2 h-4 w-4 text-primary/50" />
                    {!hasOrders && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        className="absolute top-2 left-2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                        title="Delete table"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <span className="text-2xl font-bold text-primary">
                      {table.id}
                    </span>
                    <span className="mt-2 text-sm text-muted-foreground">
                      {table.seats} seats
                    </span>
                    {hasOrders && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-700">
                        In use
                      </Badge>
                    )}
                  </motion.div>
                );
              }

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    if (tableInfo) {
                      setSelectedTable(tableInfo);
                    } else {
                      onSelectEmptyTable?.(table.id);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-200",
                    "min-h-[140px]",
                    isOccupied
                      ? cn(
                          status?.bgColor, 
                          status?.borderColor,
                          "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
                          tableInfo.primaryStatus === "ready" && "ring-2 ring-emerald-300 animate-pulse"
                        )
                      : "border-dashed border-muted-foreground/30 bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  )}
                  style={{
                    gridColumn: table.x + 1,
                    gridRow: table.y + 1,
                  }}
                >
                  <span className={cn(
                    "text-2xl font-bold",
                    isOccupied ? status?.color : "text-muted-foreground"
                  )}>
                    {table.id}
                  </span>
                  
                  {isOccupied ? (
                    <>
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <Users className={cn("h-4 w-4", status?.color)} />
                        <span className={status?.color}>{tableInfo.totalCovers} guests</span>
                      </div>
                      <Badge 
                        className={cn(
                          "mt-3 gap-1",
                          status?.bgColor,
                          status?.color,
                          "border",
                          status?.borderColor
                        )}
                      >
                        {status?.icon}
                        <span>{status?.label}</span>
                      </Badge>
                      <p className={cn("mt-2 font-bold", status?.color)}>
                        ৳{tableInfo.totalAmount.toFixed(0)}
                      </p>
                    </>
                  ) : (
                    <span className="mt-2 text-sm text-muted-foreground">
                      {table.seats} seats
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {isEditMode && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Drag tables to rearrange the floor plan. Tables will swap positions when dropped on each other.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table Detail Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              {selectedTable?.tableNumber} - Table Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <Users className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalCovers}</p>
                  <p className="text-xs text-white/80">Guests</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <UtensilsCrossed className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.orders.length}</p>
                  <p className="text-xs text-white/80">Orders</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none">
                <CardContent className="p-4 text-center text-white">
                  <span className="text-white/80">৳</span>
                  <p className="mt-1 text-2xl font-bold">{selectedTable?.totalAmount.toFixed(0)}</p>
                  <p className="text-xs text-white/80">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {selectedTable?.orders.map((order) => {
                  const orderStatus = statusConfig[order.status];
                  return (
                    <Card key={order.id} className={cn("border-l-4", orderStatus?.bgColor, orderStatus?.borderColor?.replace("border-", "border-l-"))}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{order.order_number}</span>
                              <Badge className={cn("border gap-1", orderStatus?.bgColor, orderStatus?.color, orderStatus?.borderColor)}>
                                {orderStatus?.icon}
                                <span>{orderStatus?.label}</span>
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "h:mm a")} • {order.covers} covers
                            </p>
                            {order.notes && (
                              <p className="mt-1 text-sm italic text-muted-foreground">
                                "{order.notes}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">৳{Number(order.total_amount).toFixed(0)}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 space-y-1 border-t pt-3">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                <span className="font-medium">{item.quantity}x</span> {item.item_name}
                                {item.notes && (
                                  <span className="ml-1 text-amber-600">({item.notes})</span>
                                )}
                              </span>
                              <span className="font-medium">৳{Number(item.total_price).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          {order.status === "preparing" && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
                              variant="outline"
                              onClick={() => handleMarkReady(order.id)}
                              disabled={updateOrderStatus.isPending}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white"
                              onClick={() => handleMarkServed(order.id)}
                              disabled={updateOrderStatus.isPending}
                            >
                              <UtensilsCrossed className="mr-1 h-4 w-4" />
                              Mark Served
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Close Table Action */}
            <div className="border-t pt-4 mt-4">
              <Button
                className="w-full gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700"
                onClick={() => selectedTable && setTableToClose(selectedTable)}
                disabled={closeTable.isPending}
              >
                <DoorClosed className="h-4 w-4" />
                Close Table
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Table Confirmation Dialog */}
      <AlertDialog open={!!tableToClose} onOpenChange={() => setTableToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-rose-500" />
              Close Table {tableToClose?.tableNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all {tableToClose?.orders.length} order{(tableToClose?.orders.length || 0) > 1 ? 's' : ''} as posted. 
              The table will become available for new guests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-xl font-bold">৳{tableToClose?.totalAmount.toFixed(0)}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseTable}
              className="bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700"
              disabled={closeTable.isPending}
            >
              {closeTable.isPending ? "Closing..." : "Close Table"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Table
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new table. It will be placed in the first available position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-id">Table ID / Name *</Label>
              <Input
                id="table-id"
                placeholder="e.g., T9, VIP1, Patio 1"
                value={newTableId}
                onChange={(e) => setNewTableId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTable();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-seats">Number of Seats</Label>
              <Select 
                value={newTableSeats.toString()} 
                onValueChange={(v) => setNewTableSeats(parseInt(v))}
              >
                <SelectTrigger id="table-seats">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 seats</SelectItem>
                  <SelectItem value="4">4 seats</SelectItem>
                  <SelectItem value="6">6 seats</SelectItem>
                  <SelectItem value="8">8 seats</SelectItem>
                  <SelectItem value="10">10 seats</SelectItem>
                  <SelectItem value="12">12 seats</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTable} className="gap-1">
              <Plus className="h-4 w-4" />
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
