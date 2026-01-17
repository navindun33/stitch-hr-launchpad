import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RemoteClockInRequest {
  id: string;
  employee_id: string;
  supervisor_id: string;
  requested_at: string;
  latitude: number;
  longitude: number;
  reason: string | null;
  status: string;
  responded_at: string | null;
  created_at: string;
}

export function usePendingRemoteRequests(supervisorId: string | undefined) {
  return useQuery({
    queryKey: ['pending-remote-requests', supervisorId],
    queryFn: async () => {
      if (!supervisorId) return [];
      
      const { data, error } = await supabase
        .from('remote_clockin_requests')
        .select('*')
        .eq('supervisor_id', supervisorId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data as RemoteClockInRequest[];
    },
    enabled: !!supervisorId,
  });
}

export function useMyPendingRequest(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['my-pending-request', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('remote_clockin_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (error) throw error;
      return data as RemoteClockInRequest | null;
    },
    enabled: !!employeeId,
  });
}

export function useCreateRemoteRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      employeeId,
      supervisorId,
      latitude,
      longitude,
      reason,
    }: {
      employeeId: string;
      supervisorId: string;
      latitude: number;
      longitude: number;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('remote_clockin_requests')
        .insert({
          employee_id: employeeId,
          supervisor_id: supervisorId,
          latitude,
          longitude,
          reason,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pending-request'] });
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: 'approved' | 'rejected';
    }) => {
      const { data, error } = await supabase
        .from('remote_clockin_requests')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-remote-requests'] });
    },
  });
}
