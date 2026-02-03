import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { useRoomTypes, type RoomType } from './useRoomTypes';
import { toast } from '@/hooks/use-toast';
import { format, eachDayOfInterval, getDay } from 'date-fns';

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
  const { tenant, currentProperty } = useTenant();
  const roomTypesQuery = useRoomTypes();
  const roomTypes: RoomType[] = roomTypesQuery.data || [];
  const queryClient = useQueryClient();

  const dailyRates = useQuery({
    queryKey: ['daily-rates', currentProperty?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_rates')
        .select(`
          *,
          room_type:room_types(id, name, base_rate),
          rate_period:rate_periods(id, name, rate_type)
        `)
        .eq('property_id', currentProperty.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      if (error) throw error;
      return data as DailyRate[];
    },
    enabled: !!currentProperty?.id,
  });

  // Organize rates by room type for calendar view
  const ratesByRoomType: RoomTypeWithRates[] = roomTypes.map(rt => {
    const rates: Record<string, number> = {};
    const overrides: Record<string, boolean> = {};
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dailyRate = dailyRates.data?.find(
        dr => dr.room_type_id === rt.id && dr.date === dateStr
      );
      
      rates[dateStr] = dailyRate?.calculated_rate ?? rt.base_rate;
      overrides[dateStr] = dailyRate?.is_manual_override ?? false;
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
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      const { data, error } = await supabase
        .from('daily_rates')
        .upsert({
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          room_type_id,
          date,
          calculated_rate: rate,
          is_manual_override,
        }, {
          onConflict: 'property_id,room_type_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update rate', 
        description: error.message,
        variant: 'destructive' 
      });
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
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      // Fetch rate periods for the property
      const { data: ratePeriods, error: rpError } = await supabase
        .from('rate_periods')
        .select('*')
        .eq('property_id', currentProperty.id)
        .eq('is_active', true);

      if (rpError) throw rpError;

      // Fetch room types to calculate for
      const roomTypesToProcess = room_type_id 
        ? roomTypes.filter(rt => rt.id === room_type_id)
        : roomTypes;

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const ratesToInsert: Array<{
        tenant_id: string;
        property_id: string;
        room_type_id: string;
        date: string;
        calculated_rate: number;
        rate_period_id: string | null;
        is_manual_override: boolean;
      }> = [];

      for (const rt of roomTypesToProcess) {
        for (const day of days) {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday
          
          // Find applicable rate periods, sorted by priority
          const applicablePeriods = ratePeriods
            ?.filter(rp => {
              // Check if applies to this room type (null means all)
              if (rp.room_type_id && rp.room_type_id !== rt.id) return false;
              
              // Check date range for seasonal/event rates
              if (rp.start_date && rp.end_date) {
                if (dateStr < rp.start_date || dateStr > rp.end_date) return false;
              }
              
              // Check days of week for weekend rates
              if (rp.days_of_week && rp.days_of_week.length > 0) {
                if (!rp.days_of_week.includes(dayOfWeek)) return false;
              }
              
              return true;
            })
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

          let calculatedRate = rt.base_rate;
          let appliedPeriodId: string | null = null;

          // Apply the highest priority rate period
          if (applicablePeriods && applicablePeriods.length > 0) {
            const period = applicablePeriods[0];
            appliedPeriodId = period.id;
            
            switch (period.adjustment_type) {
              case 'override':
                calculatedRate = period.amount;
                break;
              case 'fixed':
                calculatedRate = rt.base_rate + period.amount;
                break;
              case 'percentage':
                calculatedRate = rt.base_rate * (1 + period.amount / 100);
                break;
            }
          }

          ratesToInsert.push({
            tenant_id: tenant.id,
            property_id: currentProperty.id,
            room_type_id: rt.id,
            date: dateStr,
            calculated_rate: Math.round(calculatedRate * 100) / 100,
            rate_period_id: appliedPeriodId,
            is_manual_override: false,
          });
        }
      }

      // Upsert all rates (don't override manual overrides)
      for (const rate of ratesToInsert) {
        await supabase
          .from('daily_rates')
          .upsert(rate, {
            onConflict: 'property_id,room_type_id,date',
            ignoreDuplicates: false,
          });
      }

      return ratesToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
      toast({ title: `Calculated ${count} daily rates` });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to calculate rates', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    dailyRates: dailyRates.data || [],
    ratesByRoomType,
    isLoading: dailyRates.isLoading,
    error: dailyRates.error,
    setDailyRate,
    calculateRatesForPeriod,
  };
}
