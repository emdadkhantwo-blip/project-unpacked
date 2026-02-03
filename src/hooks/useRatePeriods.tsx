import { toast } from "@/hooks/use-toast";

export type RatePeriodType = 'weekend' | 'seasonal' | 'event' | 'last_minute' | 'holiday';
export type RateAdjustmentType = 'fixed' | 'percentage' | 'override';

export interface RatePeriod {
  id: string;
  tenant_id: string;
  property_id: string;
  room_type_id: string | null;
  name: string;
  rate_type: RatePeriodType;
  amount: number;
  adjustment_type: RateAdjustmentType;
  start_date: string | null;
  end_date: string | null;
  days_of_week: number[] | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room_type?: {
    id: string;
    name: string;
    base_rate: number;
  };
}

export interface CreateRatePeriodInput {
  name: string;
  room_type_id?: string | null;
  rate_type: RatePeriodType;
  amount: number;
  adjustment_type: RateAdjustmentType;
  start_date?: string | null;
  end_date?: string | null;
  days_of_week?: number[] | null;
  priority?: number;
  is_active?: boolean;
}

// Note: rate_periods table doesn't exist yet - returning mock data

export function useRatePeriods() {
  const createRatePeriod = {
    mutate: () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const updateRatePeriod = {
    mutate: () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const deleteRatePeriod = {
    mutate: () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Rate periods module not yet configured" });
    },
    isPending: false,
  };

  const toggleRatePeriod = {
    mutate: () => {},
    mutateAsync: async () => null,
    isPending: false,
  };

  return {
    ratePeriods: [] as RatePeriod[],
    isLoading: false,
    error: null,
    createRatePeriod,
    updateRatePeriod,
    deleteRatePeriod,
    toggleRatePeriod,
  };
}
