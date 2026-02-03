import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ChefHat, CheckCircle, Timer, Volume2, VolumeX, Flame, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useKitchenOrders, useUpdatePOSOrderStatus, POSOrderStatus } from "@/hooks/usePOS";
import { useKitchenNotifications } from "@/hooks/useKitchenNotifications";
import { cn } from "@/lib/utils";

interface KitchenDisplayProps {
  outletId: string;
}

export function KitchenDisplay({ outletId }: KitchenDisplayProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { data: orders = [], isLoading } = useKitchenOrders(outletId);
  const updateStatus = useUpdatePOSOrderStatus();
  
  // Real-time notifications with sound
  useKitchenNotifications({ outletId, enabled: soundEnabled });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");

  const handleStatusChange = (orderId: string, status: POSOrderStatus) => {
    updateStatus.mutate({ orderId, status });
  };

  const OrderCard = ({ order, isPreparing = false }: { order: typeof orders[0]; isPreparing?: boolean }) => {
    const minutesAgo = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
    const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
    const isUrgent = minutesAgo > 15;
    const isWarning = minutesAgo > 10 && minutesAgo <= 15;

    // Time-based gradient for urgency
    const getCardStyle = () => {
      if (isPreparing) return "border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent";
      if (isUrgent) return "border-l-rose-500 bg-gradient-to-r from-rose-50 to-transparent ring-2 ring-rose-200";
      if (isWarning) return "border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent";
      return "border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent";
    };

    const getTimeBadgeStyle = () => {
      if (isUrgent) return "bg-rose-100 text-rose-700 border-rose-200";
      if (isWarning) return "bg-amber-100 text-amber-700 border-amber-200";
      return "bg-blue-100 text-blue-700 border-blue-200";
    };

    return (
      <Card className={cn(
        "transition-all duration-300 hover:shadow-lg border-l-4",
        getCardStyle()
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">
                #{order.order_number.split("-").pop()}
              </CardTitle>
              {isUrgent && !isPreparing && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 rounded-full animate-pulse">
                  <Flame className="h-3 w-3 text-rose-600" />
                  <span className="text-xs font-medium text-rose-600">URGENT</span>
                </div>
              )}
              {isWarning && !isUrgent && !isPreparing && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600">Hurry</span>
                </div>
              )}
            </div>
            <Badge className={cn("gap-1 border", getTimeBadgeStyle())}>
              <Timer className="h-3 w-3" />
              {timeAgo}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {order.table_number && (
              <span className="px-2 py-0.5 bg-muted rounded-md font-medium">
                Table {order.table_number}
              </span>
            )}
            {order.room?.room_number && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">
                Room {order.room.room_number}
              </span>
            )}
            {order.covers && <span>• {order.covers} covers</span>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                  "bg-white/80 hover:bg-white"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white",
                  isPreparing ? "bg-gradient-to-br from-orange-500 to-amber-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                )}>
                  {item.quantity}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{item.item_name}</p>
                  {item.notes && (
                    <div className="mt-1 flex items-start gap-1 text-sm bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                      <span className="text-amber-700">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-3 rounded-xl bg-purple-50 border border-purple-200 p-3 text-sm">
              <div className="flex items-center gap-1 text-purple-700 font-medium mb-1">
                📝 Order Notes
              </div>
              <p className="text-purple-900">{order.notes}</p>
            </div>
          )}

          <div className="mt-4">
            {!isPreparing ? (
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg"
                onClick={() => handleStatusChange(order.id, "preparing")}
                disabled={updateStatus.isPending}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Start Preparing
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                onClick={() => handleStatusChange(order.id, "ready")}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Ready
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading kitchen display...</div>
      </div>
    );
  }

  return (
    <div className="relative grid h-full grid-cols-2 gap-6">
      {/* Sound Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "absolute right-0 top-0 z-10 transition-colors",
          soundEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted"
        )}
        onClick={() => setSoundEnabled(!soundEnabled)}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Sound On
          </>
        ) : (
          <>
            <VolumeX className="mr-2 h-4 w-4" />
            Sound Off
          </>
        )}
      </Button>
      
      {/* Pending Orders */}
      <div className="flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pending</h2>
            <p className="text-xs text-muted-foreground">Waiting to be prepared</p>
          </div>
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 text-lg px-3">
            {pendingOrders.length}
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p>No pending orders</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preparing Orders */}
      <div className="flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <ChefHat className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Preparing</h2>
            <p className="text-xs text-muted-foreground">Currently being cooked</p>
          </div>
          <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 text-lg px-3">
            {preparingOrders.length}
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} order={order} isPreparing />
            ))}
            {preparingOrders.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground">
                <ChefHat className="h-8 w-8 mb-2 opacity-50" />
                <p>No orders being prepared</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
