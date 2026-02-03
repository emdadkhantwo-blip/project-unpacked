import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Base64 encoded notification sound (short bell chime)
const NOTIFICATION_SOUND_BASE64 = "data:audio/wav;base64,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";

interface UseKitchenNotificationsProps {
  outletId?: string;
  enabled?: boolean;
}

export function useKitchenNotifications({ outletId, enabled = true }: UseKitchenNotificationsProps) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
    audioRef.current.volume = 0.7;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
      });
    }
  }, []);

  useEffect(() => {
    if (!outletId || !enabled) return;

    const channel = supabase
      .channel(`kitchen-orders-${outletId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pos_orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        (payload) => {
          // New order received
          const newOrder = payload.new as { id: string; order_number: string; status: string };
          
          // Only notify for pending orders (new orders coming in)
          if (newOrder.status === "pending") {
            // Skip notification on initial load
            if (!isInitialLoadRef.current) {
              playNotificationSound();
              
              toast({
                title: "🔔 New Order!",
                description: `Order #${newOrder.order_number.split("-").pop()} has arrived`,
                duration: 5000,
              });
            }
            
            previousOrderIdsRef.current.add(newOrder.id);
          }
          
          // Invalidate queries to refresh the display
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders", outletId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pos_orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        () => {
          // Order updated - just refresh the display
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders", outletId] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Mark initial load as complete after a short delay
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      isInitialLoadRef.current = true;
    };
  }, [outletId, enabled, queryClient, playNotificationSound]);

  return {
    playNotificationSound,
  };
}
