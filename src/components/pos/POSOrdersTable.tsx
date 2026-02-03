import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, Send, XCircle, Clock, ChefHat, CheckCircle, Receipt } from "lucide-react";
import { format } from "date-fns";
import {
  POSOrder,
  POSOrderStatus,
  useUpdatePOSOrderStatus,
  useCancelPOSOrder,
  usePostOrderToFolio,
  useActiveFolios,
} from "@/hooks/usePOS";

const statusConfig: Record<POSOrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  preparing: { label: "Preparing", variant: "default", icon: <ChefHat className="h-3 w-3" /> },
  ready: { label: "Ready", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
  served: { label: "Served", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
  posted: { label: "Posted", variant: "outline", icon: <Receipt className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

interface POSOrdersTableProps {
  orders: POSOrder[];
  outletId: string;
}

export function POSOrdersTable({ orders, outletId }: POSOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);

  const updateStatus = useUpdatePOSOrderStatus();
  const cancelOrder = useCancelPOSOrder();
  const postToFolio = usePostOrderToFolio();
  const { data: folios = [] } = useActiveFolios();

  const handleStatusChange = (orderId: string, status: POSOrderStatus) => {
    updateStatus.mutate();
  };

  const handleCancel = (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      cancelOrder.mutate();
    }
  };

  const handlePostToFolio = () => {
    if (!selectedOrder || !selectedFolioId) return;
    
    postToFolio.mutate();
    setShowPostDialog(false);
    setSelectedOrder(null);
    setSelectedFolioId(null);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const config = statusConfig[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        {order.table_number || order.room?.room_number ? `Room ${order.room?.room_number}` : "-"}
                      </TableCell>
                      <TableCell>
                        {order.items?.length || 0} items
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{Number(order.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {order.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "preparing")}
                              >
                                <ChefHat className="mr-2 h-4 w-4" />
                                Start Preparing
                              </DropdownMenuItem>
                            )}
                            {order.status === "preparing" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "ready")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Ready
                              </DropdownMenuItem>
                            )}
                            {order.status === "ready" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, "served")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Served
                              </DropdownMenuItem>
                            )}
                            {order.status === "served" && !order.posted_at && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSelectedFolioId(order.folio_id);
                                  setShowPostDialog(true);
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Post to Folio
                              </DropdownMenuItem>
                            )}
                            {!["posted", "cancelled"].includes(order.status) && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancel(order.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && format(new Date(selectedOrder.created_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Table</p>
                  <p className="font-medium">{selectedOrder.table_number || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Covers</p>
                  <p className="font-medium">{selectedOrder.covers}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between rounded-lg border p-2">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.item_name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                      <p className="font-medium">৳{Number(item.total_price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>৳{Number(selectedOrder.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>৳{Number(selectedOrder.service_charge).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>৳{Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post to Folio Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Order to Folio</DialogTitle>
            <DialogDescription>
              Select the guest folio to charge this order to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Folio</Label>
              <Select
                value={selectedFolioId || ""}
                onValueChange={setSelectedFolioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folio" />
                </SelectTrigger>
                <SelectContent>
                  {folios.map((folio) => (
                    <SelectItem key={folio.id} value={folio.id}>
                      {folio.folio_number} - {folio.guest_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOrder && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-sm text-muted-foreground">Amount to Post</p>
                <p className="text-2xl font-bold">
                  ৳{Number(selectedOrder.total_amount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostToFolio}
              disabled={!selectedFolioId || postToFolio.isPending}
            >
              {postToFolio.isPending ? "Posting..." : "Post to Folio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
