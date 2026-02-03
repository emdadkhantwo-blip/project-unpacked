import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function usePOSNotifications() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  useEffect(() => {
    if (!tenantId) return;

    // Subscribe to POS orders changes
    const ordersChannel = supabase
      .channel(`pos-orders-realtime-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pos_orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // Invalidate POS-related queries
          queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
          queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });

          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as { order_number: string; table_number: string | null };
            toast({
              title: "🍽️ New Order",
              description: `Order ${newOrder.order_number}${newOrder.table_number ? ` - Table ${newOrder.table_number}` : ""}`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as { status: string; order_number: string };
            const oldOrder = payload.old as { status?: string };

            if (oldOrder?.status !== updatedOrder.status) {
              const statusMessages: Record<string, { title: string; emoji: string }> = {
                preparing: { title: "Order Preparing", emoji: "👨‍🍳" },
                ready: { title: "Order Ready!", emoji: "✅" },
                served: { title: "Order Served", emoji: "🍽️" },
                cancelled: { title: "Order Cancelled", emoji: "❌" },
                posted: { title: "Order Posted to Folio", emoji: "💰" },
              };

              const message = statusMessages[updatedOrder.status];
              if (message) {
                toast({
                  title: `${message.emoji} ${message.title}`,
                  description: `Order ${updatedOrder.order_number}`,
                  variant: updatedOrder.status === "cancelled" ? "destructive" : "default",
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Subscribe to POS order items changes
    const itemsChannel = supabase
      .channel(`pos-order-items-realtime-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pos_order_items",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["pos-orders"] });
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
          queryClient.invalidateQueries({ queryKey: ["waiter-orders"] });
          queryClient.invalidateQueries({ queryKey: ["pos-order-items"] });

          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as { status: string; item_name: string };
            const oldItem = payload.old as { status?: string };

            if (oldItem?.status !== updatedItem.status && updatedItem.status === "ready") {
              toast({
                title: "🔔 Item Ready",
                description: `${updatedItem.item_name} is ready to serve`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [tenantId, queryClient]);
}
