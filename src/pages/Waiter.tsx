import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Utensils, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Plus,
  Timer,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePOSOutlets, useWaiterOrders, useWaiterStats, useUpdatePOSOrderStatus, POSOrder, POSOrderStatus } from "@/hooks/usePOS";
import { useWaiterNotifications } from "@/hooks/useWaiterNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

function WaiterStatsBar({ stats }: { stats: ReturnType<typeof useWaiterStats>["data"] }) {
  const statItems = [
    {
      label: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Preparing",
      value: stats?.preparing || 0,
      icon: Utensils,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Ready to Serve",
      value: stats?.ready || 0,
      icon: Bell,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Served Today",
      value: stats?.servedToday || 0,
      icon: CheckCircle2,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card 
          key={stat.label}
          className={cn(
            "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
            `bg-gradient-to-br ${stat.gradient}`
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
          
          <CardContent className="relative z-10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80 font-medium">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WaiterOrderCard({ order, onServe }: { order: POSOrder; onServe: (id: string) => void }) {
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
  const isReady = order.status === "ready";
  const isPreparing = order.status === "preparing";
  const isPending = order.status === "pending";

  const getCardStyle = () => {
    if (isReady) return "border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-transparent ring-2 ring-emerald-200";
    if (isPreparing) return "border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent";
    return "border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent";
  };

  const getStatusBadge = () => {
    if (isReady) return { className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Bell };
    if (isPreparing) return { className: "bg-blue-100 text-blue-700 border-blue-200", icon: Utensils };
    return { className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg border-l-4",
      getCardStyle(),
      isReady && "animate-pulse"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">
              #{order.order_number.split("-").pop()}
            </CardTitle>
            <Badge className={cn("border gap-1", statusBadge.className)}>
              <StatusIcon className="h-3 w-3" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {isReady && (
              <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
            )}
          </div>
          <Badge variant="outline" className="gap-1 bg-muted">
            <Timer className="h-3 w-3" />
            {timeAgo}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
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
        <div className="space-y-1.5">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm p-2 bg-white/50 rounded-lg">
              <span className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
                isReady ? "bg-emerald-500" : isPreparing ? "bg-blue-500" : "bg-amber-500"
              )}>
                {item.quantity}
              </span>
              <span className="font-medium">{item.item_name}</span>
              {item.notes && (
                <span className="text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded">
                  {item.notes}
                </span>
              )}
            </div>
          ))}
        </div>

        {isReady && (
          <Button 
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg" 
            onClick={() => onServe(order.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Served
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Waiter() {
  const navigate = useNavigate();
  const { data: outlets = [], isLoading: outletsLoading } = usePOSOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeOutletId = selectedOutletId || outlets[0]?.id;
  
  const { data: orders = [], isLoading: ordersLoading } = useWaiterOrders(activeOutletId);
  const { data: stats } = useWaiterStats(activeOutletId);
  const updateStatus = useUpdatePOSOrderStatus();
  
  // Real-time notifications with sound
  useWaiterNotifications({ outletId: activeOutletId, enabled: soundEnabled });

  const handleServe = (orderId: string) => {
    updateStatus.mutate({ orderId, status: "served" as POSOrderStatus });
  };

  // Group orders by status
  const readyOrders = orders.filter(o => o.status === "ready");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const pendingOrders = orders.filter(o => o.status === "pending");

  if (outletsLoading) {
    return (
      <DashboardLayout title="Waiter Dashboard">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (outlets.length === 0) {
    return (
      <DashboardLayout title="Waiter Dashboard">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto p-4 bg-blue-100 rounded-2xl w-fit mb-4">
              <Utensils className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="mt-4 text-lg font-medium">No Outlets Available</h2>
            <p className="text-sm text-muted-foreground">
              Contact your manager to set up POS outlets.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Waiter Dashboard">
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Utensils className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
              <p className="text-sm text-muted-foreground">Track and serve orders</p>
            </div>
            {readyOrders.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse text-sm px-3 py-1">
                <Bell className="mr-1 h-3 w-3" />
                {readyOrders.length} Ready!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute notifications" : "Enable notifications"}
              className={cn(
                soundEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""
              )}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            {outlets.length > 1 && (
              <Select value={activeOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger className="w-48 bg-muted/50 border-none">
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button 
              onClick={() => navigate("/pos")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <WaiterStatsBar stats={stats} />

        {/* Orders Grid */}
        <div className="grid flex-1 grid-cols-3 gap-6 min-h-0">
          {/* Ready Orders - Priority */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Bell className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold">Ready to Serve</h2>
                <p className="text-xs text-muted-foreground">Pick up now!</p>
              </div>
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200 text-lg px-3">
                {readyOrders.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {readyOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {readyOrders.length === 0 && (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground text-sm">
                    <Bell className="h-6 w-6 mb-2 opacity-50" />
                    No orders ready
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preparing Orders */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold">Preparing</h2>
                <p className="text-xs text-muted-foreground">In the kitchen</p>
              </div>
              <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200 text-lg px-3">
                {preparingOrders.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {preparingOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {preparingOrders.length === 0 && (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground text-sm">
                    <UtensilsCrossed className="h-6 w-6 mb-2 opacity-50" />
                    No orders preparing
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pending Orders */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold">Pending</h2>
                <p className="text-xs text-muted-foreground">Waiting for kitchen</p>
              </div>
              <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200 text-lg px-3">
                {pendingOrders.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {pendingOrders.map((order) => (
                  <WaiterOrderCard key={order.id} order={order} onServe={handleServe} />
                ))}
                {pendingOrders.length === 0 && (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground text-sm">
                    <Clock className="h-6 w-6 mb-2 opacity-50" />
                    No pending orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
