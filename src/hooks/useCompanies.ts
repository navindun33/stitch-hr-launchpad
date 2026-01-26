import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Company {
  id: string;
  name: string;
  code: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'approved')
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompanyByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['company-by-code', code],
    queryFn: async () => {
      if (!code) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('code', code.toLowerCase())
        .eq('status', 'approved')
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!code,
  });
}

export function useDepartments(companyId: string | undefined) {
  return useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    },
    enabled: !!companyId,
  });
}
