import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

export function useHousekeepingNotifications() {
  const queryClient = useQueryClient();
  const { currentProperty } = useTenant();
  const propertyId = currentProperty?.id;

  useEffect(() => {
    if (!propertyId) return;

    // Subscribe to housekeeping_tasks changes
    const housekeepingChannel = supabase
      .channel(`housekeeping-realtime-${propertyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "housekeeping_tasks",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          // Invalidate housekeeping-related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["housekeeping-stats"] });
          queryClient.invalidateQueries({ queryKey: ["my-housekeeping-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["my-housekeeping-stats"] });
          // Also refresh room data since housekeeping affects room status
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
          queryClient.invalidateQueries({ queryKey: ["room-stats"] });

          // Show notification based on event type
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as { task_type: string };
            toast({
              title: "New Housekeeping Task",
              description: `A new ${newTask.task_type.replace("_", " ")} task has been created`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as { status: string; task_type: string };
            const oldTask = payload.old as { status?: string };
            
            // Only notify for status changes
            if (oldTask?.status !== updatedTask.status) {
              const statusMessages: Record<string, string> = {
                in_progress: "Task started",
                completed: "Task completed",
                pending: "Task set to pending",
              };
              
              const message = statusMessages[updatedTask.status] || `Status changed to ${updatedTask.status}`;
              toast({
                title: "Housekeeping Update",
                description: `${updatedTask.task_type.replace("_", " ")} - ${message}`,
              });
            }
          } else if (payload.eventType === "DELETE") {
            toast({
              title: "Task Deleted",
              description: "A housekeeping task has been removed",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(housekeepingChannel);
    };
  }, [propertyId, queryClient]);
}
