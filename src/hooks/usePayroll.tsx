import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";

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
  // Joined
  staff_name: string;
  staff_avatar: string | null;
  staff_id: string | null;
  department_name: string | null;
}

export function usePayroll() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch payroll periods
  const {
    data: periods = [],
    isLoading: periodsLoading,
  } = useQuery({
    queryKey: ["payroll-periods", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("hr_payroll_periods")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      return data as PayrollPeriod[];
    },
    enabled: !!tenantId,
  });

  // Fetch payroll entries for a specific period
  const fetchPayrollEntries = async (periodId: string): Promise<PayrollEntry[]> => {
    const { data, error } = await supabase
      .from("hr_payroll_entries")
      .select(`
        *,
        profile:profiles!hr_payroll_entries_profile_id_fkey(full_name, avatar_url),
        hr_staff:hr_staff_profiles!inner(
          staff_id,
          department:hr_departments(name)
        )
      `)
      .eq("period_id", periodId);

    if (error) throw error;

    return (data || []).map((entry) => ({
      id: entry.id,
      period_id: entry.period_id,
      profile_id: entry.profile_id,
      basic_salary: entry.basic_salary || 0,
      allowances: (entry.allowances as Record<string, number>) || {},
      deductions: (entry.deductions as Record<string, number>) || {},
      overtime_pay: entry.overtime_pay || 0,
      gross_pay: entry.gross_pay || 0,
      net_pay: entry.net_pay || 0,
      attendance_days: entry.attendance_days || 0,
      staff_name: (entry.profile as any)?.full_name || "Unknown",
      staff_avatar: (entry.profile as any)?.avatar_url || null,
      staff_id: (entry.hr_staff as any)?.staff_id || null,
      department_name: (entry.hr_staff as any)?.department?.name || null,
    }));
  };

  // Use selected period query
  const usePayrollEntries = (periodId: string | null) => {
    return useQuery({
      queryKey: ["payroll-entries", periodId],
      queryFn: () => (periodId ? fetchPayrollEntries(periodId) : []),
      enabled: !!periodId,
    });
  };

  // Generate payroll for a month
  const generatePayroll = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!tenantId || !user?.id) throw new Error("Not authenticated");

      // Calculate start and end dates
      const periodDate = new Date(year, month - 1, 1);
      const startDate = format(startOfMonth(periodDate), "yyyy-MM-dd");
      const endDate = format(endOfMonth(periodDate), "yyyy-MM-dd");

      // Check if period already exists
      const { data: existingPeriod } = await supabase
        .from("hr_payroll_periods")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      let periodId = existingPeriod?.id;

      if (!periodId) {
        // Create new period
        const { data: newPeriod, error: periodError } = await supabase
          .from("hr_payroll_periods")
          .insert({
            tenant_id: tenantId,
            month,
            year,
            start_date: startDate,
            end_date: endDate,
            status: "draft",
          })
          .select("id")
          .single();

        if (periodError) throw periodError;
        periodId = newPeriod.id;
      }

      // Get all active staff profiles with salaries
      const { data: staffProfiles, error: staffError } = await supabase
        .from("hr_staff_profiles")
        .select(`
          profile_id,
          salary_amount,
          profile:profiles!hr_staff_profiles_profile_id_fkey(is_active)
        `)
        .eq("tenant_id", tenantId);

      if (staffError) throw staffError;

      // Filter active staff
      const activeStaff = (staffProfiles || []).filter(
        (sp) => (sp.profile as any)?.is_active !== false
      );

      // Delete existing entries for this period (to regenerate)
      await supabase
        .from("hr_payroll_entries")
        .delete()
        .eq("period_id", periodId);

      // Create payroll entries for each staff
      const entries = activeStaff.map((staff) => {
        const basicSalary = staff.salary_amount || 0;
        const grossPay = basicSalary;
        const netPay = grossPay; // Simplified - no deductions in this demo

        return {
          tenant_id: tenantId,
          period_id: periodId,
          profile_id: staff.profile_id,
          basic_salary: basicSalary,
          allowances: {},
          deductions: {},
          overtime_pay: 0,
          gross_pay: grossPay,
          net_pay: netPay,
          attendance_days: 0,
        };
      });

      if (entries.length > 0) {
        const { error: entriesError } = await supabase
          .from("hr_payroll_entries")
          .insert(entries);

        if (entriesError) throw entriesError;
      }

      return periodId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      toast({ title: "Payroll generated", description: "Payroll entries have been created." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Finalize payroll
  const finalizePayroll = useMutation({
    mutationFn: async (periodId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hr_payroll_periods")
        .update({
          status: "finalized",
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .eq("id", periodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      toast({ title: "Payroll finalized" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Calculate totals for a period
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
    periods,
    isLoading: periodsLoading,
    usePayrollEntries,
    generatePayroll,
    finalizePayroll,
    calculateTotals,
  };
}
