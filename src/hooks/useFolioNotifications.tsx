import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useFolioNotifications() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  useEffect(() => {
    if (!propertyId) return;

    // Subscribe to folios changes
    const foliosChannel = supabase
      .channel(`folios-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "folios",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["folios"] });
          queryClient.invalidateQueries({ queryKey: ["folio-stats"] });

          if (payload.eventType === "INSERT") {
            const newFolio = payload.new as { folio_number: string };
            toast({
              title: "New Folio Created",
              description: `Folio ${newFolio.folio_number} has been created`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedFolio = payload.new as { status: string; folio_number: string };
            const oldFolio = payload.old as { status?: string };

            if (oldFolio?.status !== updatedFolio.status) {
              toast({
                title: "Folio Updated",
                description: `Folio ${updatedFolio.folio_number} status: ${updatedFolio.status}`,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to payments changes
    const paymentsChannel = supabase
      .channel(`payments-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["folios"] });
          queryClient.invalidateQueries({ queryKey: ["folio-stats"] });
          queryClient.invalidateQueries({ queryKey: ["payments"] });

          if (payload.eventType === "INSERT") {
            const newPayment = payload.new as { amount: number; payment_method: string };
            toast({
              title: "Payment Received",
              description: `${newPayment.payment_method.replace("_", " ")} payment of $${newPayment.amount.toFixed(2)}`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to folio_items changes
    const itemsChannel = supabase
      .channel(`folio-items-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "folio_items",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["folios"] });
          queryClient.invalidateQueries({ queryKey: ["folio-items"] });
          queryClient.invalidateQueries({ queryKey: ["folio-stats"] });

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as { description: string; total_price: number };
            toast({
              title: "Charge Added",
              description: `${newItem.description}: $${newItem.total_price.toFixed(2)}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foliosChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [propertyId, queryClient]);
}
