import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { toast } from '@/hooks/use-toast';

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

export function useRatePeriods() {
  const { tenant, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const ratePeriods = useQuery({
    queryKey: ['rate-periods', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from('rate_periods')
        .select(`
          *,
          room_type:room_types(id, name, base_rate)
        `)
        .eq('property_id', currentProperty.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as RatePeriod[];
    },
    enabled: !!currentProperty?.id,
  });

  const createRatePeriod = useMutation({
    mutationFn: async (input: CreateRatePeriodInput) => {
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      const { data, error } = await supabase
        .from('rate_periods')
        .insert({
          ...input,
          tenant_id: tenant.id,
          property_id: currentProperty.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-periods'] });
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
      toast({ title: 'Rate period created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create rate period', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateRatePeriod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RatePeriod> & { id: string }) => {
      const { data, error } = await supabase
        .from('rate_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-periods'] });
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
      toast({ title: 'Rate period updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update rate period', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteRatePeriod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rate_periods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-periods'] });
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
      toast({ title: 'Rate period deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete rate period', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const toggleRatePeriod = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('rate_periods')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-periods'] });
      queryClient.invalidateQueries({ queryKey: ['daily-rates'] });
    },
  });

  return {
    ratePeriods: ratePeriods.data || [],
    isLoading: ratePeriods.isLoading,
    error: ratePeriods.error,
    createRatePeriod,
    updateRatePeriod,
    deleteRatePeriod,
    toggleRatePeriod,
  };
}
