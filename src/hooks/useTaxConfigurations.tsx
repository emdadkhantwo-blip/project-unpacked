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

// Note: tax_configurations and tax_exemptions tables don't exist yet - returning mock data

export function useTaxConfigurations() {
  const createTaxConfiguration = {
    mutate: () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const updateTaxConfiguration = {
    mutate: () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const deleteTaxConfiguration = {
    mutate: () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Tax configuration module not yet configured" });
    },
    isPending: false,
  };

  const createTaxExemption = {
    mutate: () => {
      toast({ title: "Info", description: "Tax exemption module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Tax exemption module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const deleteTaxExemption = {
    mutate: () => {
      toast({ title: "Info", description: "Tax exemption module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Tax exemption module not yet configured" });
    },
    isPending: false,
  };

  // Calculate taxes for a given amount and charge type
  const calculateTaxes = (
    amount: number,
    _chargeType: TaxAppliesTo,
    _corporateAccountId?: string,
    _guestId?: string
  ): { breakdown: TaxBreakdown; totalTax: number; netAmount: number } => {
    // No tax configurations available yet
    return {
      breakdown: {},
      totalTax: 0,
      netAmount: amount,
    };
  };

  return {
    taxConfigurations: [] as TaxConfiguration[],
    taxExemptions: [] as TaxExemption[],
    isLoading: false,
    error: null,
    createTaxConfiguration,
    updateTaxConfiguration,
    deleteTaxConfiguration,
    createTaxExemption,
    deleteTaxExemption,
    calculateTaxes,
  };
}
