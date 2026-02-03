import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  plan_type: "starter" | "growth" | "pro";
  price_monthly: number;
  max_properties: number;
  max_rooms: number;
  max_staff: number;
  features: Record<string, unknown>;
  created_at: string;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      return data as Plan[];
    },
  });
}

// Helper to get plan display info
export const getPlanDisplayInfo = (planType: string) => {
  switch (planType) {
    case "starter":
      return {
        label: "Starter",
        description: "Perfect for small hotels getting started",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        borderColor: "border-blue-200 dark:border-blue-800",
      };
    case "growth":
      return {
        label: "Growth",
        description: "For growing hotels with multiple needs",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        borderColor: "border-purple-200 dark:border-purple-800",
      };
    case "pro":
      return {
        label: "Premium",
        description: "Enterprise-grade for large operations",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        borderColor: "border-amber-200 dark:border-amber-800",
      };
    default:
      return {
        label: planType,
        description: "",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        borderColor: "border-border",
      };
  }
};
