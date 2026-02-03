import { toast } from "sonner";

export interface Reference {
  id: string;
  tenant_id: string;
  property_id: string | null;
  name: string;
  code: string;
  discount_percentage: number;
  discount_type: 'percentage' | 'fixed';
  fixed_discount: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReferenceInput {
  name: string;
  code: string;
  discount_percentage?: number;
  discount_type?: 'percentage' | 'fixed';
  fixed_discount?: number;
  is_active?: boolean;
  notes?: string;
  property_id?: string;
}

export interface UpdateReferenceInput extends Partial<CreateReferenceInput> {
  id: string;
}

// Note: references table doesn't exist yet - returning mock data

export function useReferences() {
  return {
    data: [] as Reference[],
    isLoading: false,
    error: null,
  };
}

export function useActiveReferences() {
  return {
    data: [] as Reference[],
    isLoading: false,
    error: null,
  };
}

export function useReferenceStats() {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    avgDiscount: 0,
  };
}

export function useCreateReference() {
  return {
    mutate: () => {
      toast.info("References module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("References module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useUpdateReference() {
  return {
    mutate: () => {
      toast.info("References module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("References module not yet configured");
      return null;
    },
    isPending: false,
  };
}

export function useDeleteReference() {
  return {
    mutate: () => {
      toast.info("References module not yet configured");
    },
    mutateAsync: async () => {
      toast.info("References module not yet configured");
    },
    isPending: false,
  };
}

export function useToggleReferenceStatus() {
  return {
    mutate: () => {},
    mutateAsync: async () => null,
    isPending: false,
  };
}

// Helper function to calculate discount
export function calculateDiscount(
  reference: Reference | null,
  subtotal: number
): number {
  if (!reference) return 0;

  if (reference.discount_type === "fixed") {
    return Math.min(reference.fixed_discount, subtotal);
  }

  return Math.round((subtotal * reference.discount_percentage) / 100);
}
