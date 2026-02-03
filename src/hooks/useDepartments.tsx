import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";

export interface Department {
  id: string;
  name: string;
  code: string;
  manager_id: string | null;
  created_at: string;
}

export function useDepartments() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ["departments", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("hr_departments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("name");

      if (error) throw error;
      return data as Department[];
    },
    enabled: !!tenant?.id,
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      if (!tenant?.id) throw new Error("No tenant");

      const { data, error } = await supabase
        .from("hr_departments")
        .insert({
          tenant_id: tenant.id,
          name,
          code,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Department Created",
        description: "New department has been created.",
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

  return {
    departments: departmentsQuery.data || [],
    isLoading: departmentsQuery.isLoading,
    createDepartment: createDepartmentMutation.mutate,
    isCreating: createDepartmentMutation.isPending,
  };
}
