import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export interface LiveSession {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  host_id: string;
  stream_url: string | null;
  thumbnail_url: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  is_vip: boolean;
  max_viewers: number;
  current_viewers: number;
  created_at: string;
  host_name?: string;
  host_avatar?: string;
}

export interface LiveSessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export const useLiveSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ['live-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true });
      if (error) throw error;

      if (!data?.length) return [];

      const hostIds = [...new Set(data.map((s: any) => s.host_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', hostIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return data.map((s: any) => {
        const host = profileMap.get(s.host_id) as any;
        return {
          ...s,
          host_name: host?.display_name || 'محلل',
          host_avatar: host?.avatar_url,
        };
      }) as LiveSession[];
    },
  });

  return {
    sessions: sessions.data || [],
    isLoading: sessions.isLoading,
    refetch: sessions.refetch,
  };
};

export const useLiveSessionChat = (sessionId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<LiveSessionMessage[]>([]);

  // Fetch initial messages
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('live_session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        setMessages(
          data.map((m: any) => {
            const profile = profileMap.get(m.user_id) as any;
            return {
              ...m,
              user_name: profile?.display_name || 'مستخدم',
              user_avatar: profile?.avatar_url,
            };
          })
        );
      }
    };

    fetchMessages();
  }, [sessionId]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_session_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', newMsg.user_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              user_name: (profile as any)?.display_name || 'مستخدم',
              user_avatar: (profile as any)?.avatar_url,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = async (content: string) => {
    if (!user?.id || !content.trim()) return;
    await supabase.from('live_session_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      content: content.trim(),
    });
  };

  return { messages, sendMessage };
};
