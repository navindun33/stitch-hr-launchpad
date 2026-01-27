import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  parent_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_employee?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  creator?: {
    id: string;
    name: string;
  };
  subtasks?: Task[];
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_employee:employees!tasks_assigned_to_fkey(id, name, avatar_url),
          creator:employees!tasks_created_by_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
  });
}

// Helper function to build task tree from flat list
export function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];

  // First pass: create a map of all tasks
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, subtasks: [] });
  });

  // Second pass: build the tree structure
  tasks.forEach(task => {
    const taskWithSubtasks = taskMap.get(task.id)!;
    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id)!;
      parent.subtasks = parent.subtasks || [];
      parent.subtasks.push(taskWithSubtasks);
    } else {
      rootTasks.push(taskWithSubtasks);
    }
  });

  return rootTasks;
}

export function useMyTasks(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['my-tasks', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', employeeId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      assigned_to?: string;
      created_by?: string;
      parent_id?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      title?: string;
      description?: string;
      assigned_to?: string | null;
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string | null;
    }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Set completed_at when status changes to completed
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status) {
        updateData.completed_at = null;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
}
