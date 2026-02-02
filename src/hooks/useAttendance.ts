import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  is_remote: boolean;
  status: string;
  created_at: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number;
  company_id: string | null;
}

export function useOfficeLocations() {
  return useQuery({
    queryKey: ['office-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*');
      
      if (error) throw error;
      return (data ?? []).map((l) => ({
        ...l,
        latitude: typeof l.latitude === 'number' ? l.latitude : Number(l.latitude),
        longitude: typeof l.longitude === 'number' ? l.longitude : Number(l.longitude),
        radius_meters: typeof l.radius_meters === 'number' ? l.radius_meters : Number(l.radius_meters),
      })) as OfficeLocation[];
    },
  });
}

export function useActiveAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['active-attendance', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data as AttendanceRecord | null;
    },
    enabled: !!employeeId,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      employeeId,
      latitude,
      longitude,
      isRemote = false,
    }: {
      employeeId: string;
      latitude?: number;
      longitude?: number;
      isRemote?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employeeId,
          clock_in_latitude: latitude,
          clock_in_longitude: longitude,
          is_remote: isRemote,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-attendance'] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      recordId,
      latitude,
      longitude,
    }: {
      recordId: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          clock_out_time: new Date().toISOString(),
          clock_out_latitude: latitude,
          clock_out_longitude: longitude,
          status: 'completed',
        })
        .eq('id', recordId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-attendance'] });
    },
  });
}
