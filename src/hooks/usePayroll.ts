import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  hours_worked: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    department: string;
  };
}

export function usePayrollRecords() {
  return useQuery({
    queryKey: ['payroll-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          employee:employees(id, name, department)
        `)
        .order('period_end', { ascending: false });
      
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
}

export function useMyPayroll(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['my-payroll', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('period_end', { ascending: false });
      
      if (error) throw error;
      return data as PayrollRecord[];
    },
    enabled: !!employeeId,
  });
}

export function useCreatePayrollRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: {
      employee_id: string;
      period_start: string;
      period_end: string;
      hours_worked: number;
      hourly_rate: number;
      gross_pay: number;
      deductions?: number;
      net_pay: number;
    }) => {
      const { data, error } = await supabase
        .from('payroll_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
    },
  });
}

export function useUpdatePayrollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string; 
      status: 'pending' | 'processed' | 'paid';
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('payroll_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      queryClient.invalidateQueries({ queryKey: ['my-payroll'] });
    },
  });
}
