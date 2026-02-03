import { useState, useCallback } from "react";
import { useTenant } from "./useTenant";
import { useToast } from "@/hooks/use-toast";

export interface Department {
  id: string;
  name: string;
  code: string;
  manager_id: string | null;
  created_at: string;
}

// Mock data for departments since the table doesn't exist yet
const MOCK_DEPARTMENTS: Department[] = [
  { id: "1", name: "Front Desk", code: "FD", manager_id: null, created_at: new Date().toISOString() },
  { id: "2", name: "Housekeeping", code: "HK", manager_id: null, created_at: new Date().toISOString() },
  { id: "3", name: "Maintenance", code: "MT", manager_id: null, created_at: new Date().toISOString() },
  { id: "4", name: "Kitchen", code: "KT", manager_id: null, created_at: new Date().toISOString() },
  { id: "5", name: "Restaurant", code: "RS", manager_id: null, created_at: new Date().toISOString() },
];

export function useDepartments() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [departments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [isLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createDepartment = useCallback(
    async ({ name, code }: { name: string; code: string }) => {
      setIsCreating(true);
      // Mock creation - in reality this would call Supabase
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Department Created",
        description: `${name} department has been created. (Note: hr_departments table not yet available)`,
      });
      setIsCreating(false);
    },
    [toast]
  );

  return {
    departments,
    isLoading,
    createDepartment,
    isCreating,
  };
}
