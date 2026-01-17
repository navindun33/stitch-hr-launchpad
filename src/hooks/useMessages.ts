import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useMessages(employeeId: string | undefined) {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    if (!employeeId) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, queryClient]);

  return useQuery({
    queryKey: ['messages', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${employeeId},receiver_id.eq.${employeeId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!employeeId,
  });
}

export function useUnreadCount(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['unread-count', employeeId],
    queryFn: async () => {
      if (!employeeId) return 0;
      
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', employeeId)
        .eq('is_read', false);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!employeeId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      senderId,
      receiverId,
      subject,
      content,
    }: {
      senderId: string;
      receiverId: string;
      subject?: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          subject,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}
