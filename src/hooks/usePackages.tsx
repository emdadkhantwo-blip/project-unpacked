import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export type PackageAdjustmentType = 'fixed' | 'percentage';

export interface PackageInclusion {
  name: string;
  description?: string;
  icon?: string;
}

export interface Package {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  description: string | null;
  code: string;
  price_adjustment: number;
  adjustment_type: PackageAdjustmentType;
  valid_from: string | null;
  valid_until: string | null;
  min_nights: number;
  is_active: boolean;
  inclusions: PackageInclusion[];
  applicable_room_types: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageInput {
  name: string;
  description?: string;
  code: string;
  price_adjustment: number;
  adjustment_type: PackageAdjustmentType;
  valid_from?: string | null;
  valid_until?: string | null;
  min_nights?: number;
  is_active?: boolean;
  inclusions?: PackageInclusion[];
  applicable_room_types?: string[] | null;
}

// Helper to convert DB data to our Package type
const toPackage = (data: any): Package => ({
  ...data,
  inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
});

export function usePackages() {
  const { tenant, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const packages = useQuery({
    queryKey: ['packages', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('property_id', currentProperty.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toPackage);
    },
    enabled: !!currentProperty?.id,
  });

  const createPackage = useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      const { data, error } = await supabase
        .from('packages')
        .insert({
          name: input.name,
          description: input.description,
          code: input.code,
          price_adjustment: input.price_adjustment,
          adjustment_type: input.adjustment_type,
          valid_from: input.valid_from,
          valid_until: input.valid_until,
          min_nights: input.min_nights,
          is_active: input.is_active,
          applicable_room_types: input.applicable_room_types,
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          inclusions: (input.inclusions || []) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return toPackage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Package created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create package', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, inclusions, ...updates }: Partial<Package> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (inclusions !== undefined) {
        updateData.inclusions = inclusions as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toPackage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Package updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update package', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Package deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete package', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const togglePackage = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('packages')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  return {
    packages: packages.data || [],
    isLoading: packages.isLoading,
    error: packages.error,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackage,
  };
}
