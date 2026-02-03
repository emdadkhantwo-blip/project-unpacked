import { toast } from "@/hooks/use-toast";

export interface PayrollPeriod {
  id: string;
  tenant_id: string;
  property_id: string | null;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  status: "draft" | "processing" | "finalized";
  finalized_at: string | null;
  finalized_by: string | null;
}

export interface PayrollEntry {
  id: string;
  period_id: string;
  profile_id: string;
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  overtime_pay: number;
  gross_pay: number;
  net_pay: number;
  attendance_days: number;
  staff_name: string;
  staff_avatar: string | null;
  staff_id: string | null;
  department_name: string | null;
}

// Note: HR payroll tables don't exist yet - returning mock data

export function usePayroll() {
  const usePayrollEntries = (_periodId: string | null) => {
    return {
      data: [] as PayrollEntry[],
      isLoading: false,
      error: null,
    };
  };

  const generatePayroll = {
    mutate: () => {
      toast({ title: "Info", description: "Payroll module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Payroll module not yet configured" });
      return null;
    },
    isPending: false,
  };

  const finalizePayroll = {
    mutate: () => {
      toast({ title: "Info", description: "Payroll module not yet configured" });
    },
    mutateAsync: async () => {
      toast({ title: "Info", description: "Payroll module not yet configured" });
    },
    isPending: false,
  };

  const calculateTotals = (entries: PayrollEntry[]) => {
    return entries.reduce(
      (acc, entry) => ({
        totalBasic: acc.totalBasic + entry.basic_salary,
        totalOvertime: acc.totalOvertime + entry.overtime_pay,
        totalGross: acc.totalGross + entry.gross_pay,
        totalNet: acc.totalNet + entry.net_pay,
      }),
      { totalBasic: 0, totalOvertime: 0, totalGross: 0, totalNet: 0 }
    );
  };

  return {
    periods: [] as PayrollPeriod[],
    isLoading: false,
    usePayrollEntries,
    generatePayroll,
    finalizePayroll,
    calculateTotals,
  };
}
