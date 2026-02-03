import { toast } from "@/hooks/use-toast";

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

// Note: packages table doesn't exist yet - returning mock data

export function usePackages() {
  const createPackage = {
    mutate: () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const updatePackage = {
    mutate: () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const deletePackage = {
    mutate: () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Packages module not yet configured" });
    },
    isPending: false,
  };

  const togglePackage = {
    mutate: () => {},
    mutateAsync: async () => null,
    isPending: false,
  };

  return {
    packages: [] as Package[],
    isLoading: false,
    error: null,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackage,
  };
}
