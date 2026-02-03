import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomTypes, type RoomType } from './useRoomTypes';
import { toast } from '@/hooks/use-toast';
import { format, eachDayOfInterval } from 'date-fns';

// Mock implementation - daily_rates and rate_periods tables don't exist yet
export interface DailyRate {
  id: string;
  tenant_id: string;
  property_id: string;
  room_type_id: string;
  date: string;
  calculated_rate: number;
  rate_period_id: string | null;
  is_manual_override: boolean;
  created_at: string;
  room_type?: {
    id: string;
    name: string;
    base_rate: number;
  };
  rate_period?: {
    id: string;
    name: string;
    rate_type: string;
  };
}

export interface RoomTypeWithRates {
  id: string;
  name: string;
  base_rate: number;
  rates: Record<string, number>; // date -> rate
  overrides: Record<string, boolean>; // date -> is_manual_override
}

export function useDailyRates(startDate: Date, endDate: Date) {
  const roomTypesQuery = useRoomTypes();
  const roomTypes: RoomType[] = roomTypesQuery.data || [];
  const queryClient = useQueryClient();

  // Generate mock rates from room types base_rate
  const ratesByRoomType: RoomTypeWithRates[] = roomTypes.map(rt => {
    const rates: Record<string, number> = {};
    const overrides: Record<string, boolean> = {};
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      rates[dateStr] = rt.base_rate;
      overrides[dateStr] = false;
    });
    
    return {
      id: rt.id,
      name: rt.name,
      base_rate: rt.base_rate,
      rates,
      overrides,
    };
  });

  const setDailyRate = useMutation({
    mutationFn: async ({ 
      room_type_id, 
      date, 
      rate,
      is_manual_override = true 
    }: { 
      room_type_id: string; 
      date: string; 
      rate: number;
      is_manual_override?: boolean;
    }) => {
      toast({
        title: "Feature Coming Soon",
        description: "Daily rate management requires additional database setup.",
      });
      return null;
    },
  });

  const calculateRatesForPeriod = useMutation({
    mutationFn: async ({ 
      room_type_id,
      startDate,
      endDate 
    }: { 
      room_type_id?: string;
      startDate: Date;
      endDate: Date;
    }) => {
      toast({
        title: "Feature Coming Soon",
        description: "Rate calculation requires additional database setup.",
      });
      return 0;
    },
  });

  return {
    dailyRates: [] as DailyRate[],
    ratesByRoomType,
    isLoading: roomTypesQuery.isLoading,
    error: null,
    setDailyRate,
    calculateRatesForPeriod,
  };
}
