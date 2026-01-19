import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'unpaid';
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    department: string;
    avatar_url: string | null;
  };
  approver?: {
    id: string;
    name: string;
  };
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_leave: number;
  sick_leave: number;
  personal_leave: number;
  annual_used: number;
  sick_used: number;
  personal_used: number;
  created_at: string;
  updated_at: string;
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees!leave_requests_employee_id_fkey(id, name, department, avatar_url),
          approver:employees!leave_requests_approved_by_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeaveRequest[];
    },
  });
}

export function useMyLeaveRequests(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['my-leave-requests', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!employeeId,
  });
}

export function useLeaveBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['leave-balance', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .maybeSingle();
      
      if (error) throw error;
      return data as LeaveBalance | null;
    },
    enabled: !!employeeId,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      employee_id: string;
      leave_type: 'annual' | 'sick' | 'personal' | 'unpaid';
      start_date: string;
      end_date: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(request)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
    },
  });
}

export function useRespondToLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      approved_by
    }: { 
      id: string; 
      status: 'approved' | 'rejected';
      approved_by: string;
    }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status,
          approved_by,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
    },
  });
}
