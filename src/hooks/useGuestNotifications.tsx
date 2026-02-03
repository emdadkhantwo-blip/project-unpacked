import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useGuestNotifications() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`guests-realtime-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // Invalidate guest-related queries
          queryClient.invalidateQueries({ queryKey: ["guests"] });
          queryClient.invalidateQueries({ queryKey: ["guest-stats"] });

          if (payload.eventType === "INSERT") {
            const newGuest = payload.new as { first_name: string; last_name: string; is_vip: boolean };
            toast({
              title: "New Guest Added",
              description: `${newGuest.first_name} ${newGuest.last_name}${newGuest.is_vip ? " (VIP)" : ""}`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedGuest = payload.new as { first_name: string; last_name: string; is_blacklisted: boolean };
            const oldGuest = payload.old as { is_blacklisted?: boolean };

            if (oldGuest?.is_blacklisted !== updatedGuest.is_blacklisted) {
              toast({
                title: updatedGuest.is_blacklisted ? "Guest Blacklisted" : "Guest Removed from Blacklist",
                description: `${updatedGuest.first_name} ${updatedGuest.last_name}`,
                variant: updatedGuest.is_blacklisted ? "destructive" : "default",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}
