import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Clock, Flame, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KitchenDisplay } from "@/components/pos/KitchenDisplay";
import { usePOSOutlets, useKitchenOrders } from "@/hooks/usePOS";
import { usePOSNotifications } from "@/hooks/usePOSNotifications";
import { cn } from "@/lib/utils";

function KitchenStatsBar({ outletId }: { outletId?: string }) {
  const { data: orders = [] } = useKitchenOrders(outletId);
  
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const readyCount = orders.filter(o => o.status === "ready").length;
  const urgentCount = orders.filter(o => {
    const isUrgent = new Date().getTime() - new Date(o.created_at).getTime() > 15 * 60 * 1000;
    return isUrgent && o.status === "pending";
  }).length;

  const stats = [
    {
      label: "Pending Orders",
      value: pendingCount,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Preparing",
      value: preparingCount,
      icon: ChefHat,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Ready to Serve",
      value: readyCount,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Urgent (15+ min)",
      value: urgentCount,
      icon: Flame,
      gradient: "from-rose-500 to-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
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

export default function Kitchen() {
  const { data: outlets = [], isLoading: outletsLoading } = usePOSOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  // Enable real-time notifications for POS orders
  usePOSNotifications();

  // Auto-select first outlet
  const activeOutletId = selectedOutletId || outlets[0]?.id;

  if (outletsLoading) {
    return (
      <DashboardLayout title="Kitchen Display">
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (outlets.length === 0) {
    return (
      <DashboardLayout title="Kitchen Display">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto p-4 bg-orange-100 rounded-2xl w-fit mb-4">
              <ChefHat className="h-12 w-12 text-orange-600" />
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
    <DashboardLayout title="Kitchen Display">
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Header with outlet selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">Real-time order management</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse">
              <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Live
            </Badge>
          </div>
          
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
        </div>

        {/* Stats */}
        <KitchenStatsBar outletId={activeOutletId} />

        {/* Kitchen Display */}
        <div className="flex-1 min-h-0">
          {activeOutletId && <KitchenDisplay outletId={activeOutletId} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
