import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
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

export function useReferences() {
  const { tenant, currentProperty } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["references", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("references")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      return data as Reference[];
    },
    enabled: !!tenantId,
  });
}

export function useActiveReferences() {
  const { tenant, currentProperty } = useTenant();
  const tenantId = tenant?.id;
  const propertyId = currentProperty?.id;

  return useQuery({
    queryKey: ["references", "active", tenantId, propertyId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from("references")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      // Filter by property or global (null property_id)
      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Reference[];
    },
    enabled: !!tenantId,
  });
}

export function useReferenceStats() {
  const { data: references } = useReferences();

  const stats = {
    total: references?.length || 0,
    active: references?.filter((r) => r.is_active).length || 0,
    inactive: references?.filter((r) => !r.is_active).length || 0,
    avgDiscount:
      references && references.length > 0
        ? Math.round(
            references.reduce((sum, r) => sum + (r.discount_percentage || 0), 0) /
              references.length
          )
        : 0,
  };

  return stats;
}

export function useCreateReference() {
  const queryClient = useQueryClient();
  const { tenant, currentProperty } = useTenant();
  const tenantId = tenant?.id;
  const propertyId = currentProperty?.id;

  return useMutation({
    mutationFn: async (input: CreateReferenceInput) => {
      if (!tenantId) throw new Error("No tenant selected");

      const { data, error } = await supabase
        .from("references")
        .insert({
          tenant_id: tenantId,
          property_id: input.property_id || null,
          name: input.name,
          code: input.code.toUpperCase(),
          discount_percentage: input.discount_percentage || 0,
          discount_type: input.discount_type || "percentage",
          fixed_discount: input.fixed_discount || 0,
          is_active: input.is_active !== false,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast.success("Reference created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating reference:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("A reference with this code already exists");
      } else {
        toast.error("Failed to create reference");
      }
    },
  });
}

export function useUpdateReference() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (input: UpdateReferenceInput) => {
      if (!tenantId) throw new Error("No tenant selected");

      const { id, ...updateData } = input;

      // Convert code to uppercase if provided
      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
      }

      const { data, error } = await supabase
        .from("references")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast.success("Reference updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating reference:", error);
      toast.error("Failed to update reference");
    },
  });
}

export function useDeleteReference() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant selected");

      const { error } = await supabase
        .from("references")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast.success("Reference deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    },
  });
}

export function useToggleReferenceStatus() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!tenantId) throw new Error("No tenant selected");

      const { data, error } = await supabase
        .from("references")
        .update({ is_active })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast.success(`Reference ${data.is_active ? "activated" : "deactivated"}`);
    },
    onError: (error: any) => {
      console.error("Error toggling reference status:", error);
      toast.error("Failed to update reference status");
    },
  });
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
