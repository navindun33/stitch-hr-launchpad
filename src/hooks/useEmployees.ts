import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  department: string;
  hourly_rate: number;
  supervisor_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useEmployeeCount() {
  return useQuery({
    queryKey: ['employees-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCurrentEmployee(userId: string | undefined) {
  return useQuery({
    queryKey: ['current-employee', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Employee | null;
    },
    enabled: !!userId,
  });
}
