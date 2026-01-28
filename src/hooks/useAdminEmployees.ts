import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: {
      name: string;
      email: string;
      department: string;
      hourly_rate: number;
      phone?: string;
      supervisor_id?: string;
      user_id?: string;
      company_id?: string;
      nic_number?: string;
      bank_name?: string;
      bank_account_number?: string;
      bank_branch?: string;
      work_type?: 'office' | 'remote' | 'hybrid';
    }) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-count'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string;
      name?: string;
      email?: string;
      department?: string;
      hourly_rate?: number;
      phone?: string;
      supervisor_id?: string | null;
      avatar_url?: string | null;
      nic_number?: string | null;
      bank_name?: string | null;
      bank_account_number?: string | null;
      bank_branch?: string | null;
      work_type?: 'office' | 'remote' | 'hybrid';
    }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-count'] });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      user_id, 
      role 
    }: { 
      user_id: string;
      role: 'admin' | 'manager' | 'employee';
    }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({ user_id, role }, { onConflict: 'user_id,role' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      user_id, 
      role 
    }: { 
      user_id: string;
      role: 'admin' | 'manager' | 'employee';
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
}
