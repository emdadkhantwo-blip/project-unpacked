import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";

export interface PropertyInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  service_charge_rate?: number;
}

export function useCreateProperty() {
  const { tenant, refreshTenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PropertyInput) => {
      if (!tenant?.id) throw new Error("No tenant found");

      const { data, error } = await supabase
        .from("properties")
        .insert({
          tenant_id: tenant.id,
          name: input.name,
          code: input.code.toUpperCase(),
          address: input.address || null,
          city: input.city || null,
          country: input.country || null,
          phone: input.phone || null,
          email: input.email || null,
          tax_rate: input.tax_rate || 0,
          service_charge_rate: input.service_charge_rate || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      refreshTenant();
      toast({
        title: "Property Created",
        description: "New property has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProperty() {
  const { refreshTenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PropertyInput>;
    }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.code) {
        updateData.code = updates.code.toUpperCase();
      }

      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      refreshTenant();
      toast({
        title: "Property Updated",
        description: "Property has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProperty() {
  const { refreshTenant, currentProperty, setCurrentProperty, properties } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      refreshTenant();
      
      // If we deleted the current property, switch to another one
      if (currentProperty?.id === deletedId) {
        const remaining = properties.filter((p) => p.id !== deletedId);
        if (remaining.length > 0) {
          setCurrentProperty(remaining[0]);
        }
      }
      
      toast({
        title: "Property Deleted",
        description: "Property has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function usePropertyStats() {
  const { properties } = useTenant();

  const totalProperties = properties.length;
  // Properties table doesn't have status column yet
  const activeProperties = totalProperties;
  const inactiveProperties = 0;
  const maintenanceProperties = 0;

  return {
    totalProperties,
    activeProperties,
    inactiveProperties,
    maintenanceProperties,
  };
}
