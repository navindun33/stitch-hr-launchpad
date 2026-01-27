import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeShift {
  id: string;
  employee_id: string;
  shift_name: string;
  shift_start: string; // TIME format "HH:MM:SS"
  shift_end: string;
  days_of_week: number[]; // 0=Sunday, 1=Monday, etc.
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmployeeShifts(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee-shifts', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as EmployeeShift[];
    },
    enabled: !!employeeId,
  });
}

export function useAllShifts() {
  return useQuery({
    queryKey: ['all-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_shifts')
        .select('*')
        .order('employee_id');
      
      if (error) throw error;
      return data as EmployeeShift[];
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift: {
      employee_id: string;
      shift_name?: string;
      shift_start: string;
      shift_end: string;
      days_of_week?: number[];
    }) => {
      const { data, error } = await supabase
        .from('employee_shifts')
        .insert(shift)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['all-shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      shift_name?: string;
      shift_start?: string;
      shift_end?: string;
      days_of_week?: number[];
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('employee_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['all-shifts'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_shifts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['all-shifts'] });
    },
  });
}

// Helper function to check if current time is within shift
export function isWithinShift(shift: EmployeeShift): { 
  isValid: boolean; 
  isLate: boolean;
  hoursRemaining: number;
  message: string;
} {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  
  // Check if today is a shift day
  if (!shift.days_of_week.includes(dayOfWeek)) {
    return { isValid: false, isLate: false, hoursRemaining: 0, message: 'No shift assigned for today' };
  }
  
  const [startHour, startMin] = shift.shift_start.split(':').map(Number);
  const [endHour, endMin] = shift.shift_end.split(':').map(Number);
  
  const shiftStart = new Date(now);
  shiftStart.setHours(startHour, startMin, 0, 0);
  
  const shiftEnd = new Date(now);
  shiftEnd.setHours(endHour, endMin, 0, 0);
  
  // Handle overnight shifts
  if (endHour < startHour) {
    if (now.getHours() < endHour) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    } else {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }
  }
  
  const currentTime = now.getTime();
  const startTime = shiftStart.getTime();
  const endTime = shiftEnd.getTime();
  
  // Check if current time is before shift (with 30 min grace period before)
  const graceBeforeStart = startTime - (30 * 60 * 1000);
  
  if (currentTime < graceBeforeStart) {
    return { isValid: false, isLate: false, hoursRemaining: 0, message: 'Shift has not started yet' };
  }
  
  // Check if current time is after shift end
  if (currentTime > endTime) {
    return { isValid: false, isLate: false, hoursRemaining: 0, message: 'Shift has ended' };
  }
  
  // Check if late (more than 2 hours after start)
  const twoHoursLate = startTime + (2 * 60 * 60 * 1000);
  const isLate = currentTime > twoHoursLate;
  
  // Calculate hours remaining
  const hoursRemaining = Math.max(0, (endTime - currentTime) / (1000 * 60 * 60));
  
  return { 
    isValid: true, 
    isLate, 
    hoursRemaining,
    message: isLate ? 'Late clock in - more than 2 hours late' : 'Within shift time'
  };
}

export function formatShiftTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
