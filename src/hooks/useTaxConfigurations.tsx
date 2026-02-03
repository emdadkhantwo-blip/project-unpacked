import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { toast } from '@/hooks/use-toast';

export type TaxAppliesTo = 'room' | 'food' | 'service' | 'other' | 'all';
export type TaxExemptionType = 'full' | 'partial';
export type TaxExemptionEntityType = 'corporate_account' | 'guest';

export interface TaxConfiguration {
  id: string;
  tenant_id: string;
  property_id: string;
  name: string;
  code: string;
  rate: number;
  is_compound: boolean;
  applies_to: TaxAppliesTo[];
  is_inclusive: boolean;
  is_active: boolean;
  calculation_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxExemption {
  id: string;
  tenant_id: string;
  tax_configuration_id: string;
  entity_type: TaxExemptionEntityType;
  entity_id: string;
  exemption_type: TaxExemptionType;
  exemption_rate: number;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  tax_configuration?: TaxConfiguration;
}

export interface CreateTaxConfigurationInput {
  name: string;
  code: string;
  rate: number;
  is_compound?: boolean;
  applies_to?: TaxAppliesTo[];
  is_inclusive?: boolean;
  is_active?: boolean;
  calculation_order?: number;
}

export interface TaxBreakdown {
  [taxCode: string]: {
    name: string;
    rate: number;
    amount: number;
    is_compound: boolean;
  };
}

export function useTaxConfigurations() {
  const { tenant, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const taxConfigurations = useQuery({
    queryKey: ['tax-configurations', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return [];
      
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('property_id', currentProperty.id)
        .order('calculation_order');

      if (error) throw error;
      return data as TaxConfiguration[];
    },
    enabled: !!currentProperty?.id,
  });

  const taxExemptions = useQuery({
    queryKey: ['tax-exemptions', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id || !tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('tax_exemptions')
        .select(`
          *,
          tax_configuration:tax_configurations(*)
        `)
        .eq('tenant_id', tenant.id);

      if (error) throw error;
      return data as TaxExemption[];
    },
    enabled: !!currentProperty?.id && !!tenant?.id,
  });

  const createTaxConfiguration = useMutation({
    mutationFn: async (input: CreateTaxConfigurationInput) => {
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      const { data, error } = await supabase
        .from('tax_configurations')
        .insert({
          ...input,
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          applies_to: input.applies_to || ['all'],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({ title: 'Tax configuration created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create tax configuration', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateTaxConfiguration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaxConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({ title: 'Tax configuration updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update tax configuration', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteTaxConfiguration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({ title: 'Tax configuration deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete tax configuration', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const createTaxExemption = useMutation({
    mutationFn: async (input: Omit<TaxExemption, 'id' | 'created_at' | 'tax_configuration'>) => {
      if (!tenant?.id) throw new Error('No tenant selected');

      const { data, error } = await supabase
        .from('tax_exemptions')
        .insert({
          ...input,
          tenant_id: tenant.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-exemptions'] });
      toast({ title: 'Tax exemption created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create tax exemption', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteTaxExemption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_exemptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-exemptions'] });
      toast({ title: 'Tax exemption deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete tax exemption', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Calculate taxes for a given amount and charge type
  const calculateTaxes = (
    amount: number,
    chargeType: TaxAppliesTo,
    corporateAccountId?: string,
    guestId?: string
  ): { breakdown: TaxBreakdown; totalTax: number; netAmount: number } => {
    const activeTaxes = (taxConfigurations.data || [])
      .filter(tax => {
        if (!tax.is_active) return false;
        if (tax.applies_to.includes('all')) return true;
        return tax.applies_to.includes(chargeType);
      })
      .sort((a, b) => a.calculation_order - b.calculation_order);

    const exemptions = taxExemptions.data || [];
    const breakdown: TaxBreakdown = {};
    let runningAmount = amount;
    let totalTax = 0;

    // Separate compound and non-compound taxes
    const nonCompoundTaxes = activeTaxes.filter(t => !t.is_compound);
    const compoundTaxes = activeTaxes.filter(t => t.is_compound);

    // Calculate non-compound taxes first
    for (const tax of nonCompoundTaxes) {
      // Check for exemptions
      let effectiveRate = tax.rate;
      const exemption = exemptions.find(e => {
        if (e.tax_configuration_id !== tax.id) return false;
        if (e.entity_type === 'corporate_account' && e.entity_id === corporateAccountId) return true;
        if (e.entity_type === 'guest' && e.entity_id === guestId) return true;
        return false;
      });

      if (exemption) {
        if (exemption.exemption_type === 'full') {
          effectiveRate = 0;
        } else {
          effectiveRate = tax.rate * (1 - exemption.exemption_rate / 100);
        }
      }

      const taxAmount = amount * (effectiveRate / 100);
      totalTax += taxAmount;
      
      breakdown[tax.code] = {
        name: tax.name,
        rate: effectiveRate,
        amount: Math.round(taxAmount * 100) / 100,
        is_compound: false,
      };
    }

    // Calculate compound taxes on (amount + non-compound taxes)
    const baseForCompound = amount + totalTax;
    for (const tax of compoundTaxes) {
      let effectiveRate = tax.rate;
      const exemption = exemptions.find(e => {
        if (e.tax_configuration_id !== tax.id) return false;
        if (e.entity_type === 'corporate_account' && e.entity_id === corporateAccountId) return true;
        if (e.entity_type === 'guest' && e.entity_id === guestId) return true;
        return false;
      });

      if (exemption) {
        if (exemption.exemption_type === 'full') {
          effectiveRate = 0;
        } else {
          effectiveRate = tax.rate * (1 - exemption.exemption_rate / 100);
        }
      }

      const taxAmount = baseForCompound * (effectiveRate / 100);
      totalTax += taxAmount;
      
      breakdown[tax.code] = {
        name: tax.name,
        rate: effectiveRate,
        amount: Math.round(taxAmount * 100) / 100,
        is_compound: true,
      };
    }

    return {
      breakdown,
      totalTax: Math.round(totalTax * 100) / 100,
      netAmount: Math.round((amount + totalTax) * 100) / 100,
    };
  };

  return {
    taxConfigurations: taxConfigurations.data || [],
    taxExemptions: taxExemptions.data || [],
    isLoading: taxConfigurations.isLoading,
    error: taxConfigurations.error,
    createTaxConfiguration,
    updateTaxConfiguration,
    deleteTaxConfiguration,
    createTaxExemption,
    deleteTaxExemption,
    calculateTaxes,
  };
}
