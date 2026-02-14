import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ThreadAuthor {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface Thread {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  content: string;
  tag: 'question' | 'analysis' | 'alert' | 'help';
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  has_best_answer: boolean;
  created_at: string;
  updated_at: string;
  author?: ThreadAuthor;
}

export interface Reply {
  id: string;
  thread_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_best_answer: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: ThreadAuthor;
  user_liked?: boolean;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: ThreadAuthor;
}

export const useCommunity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch threads with author info
  const fetchThreads = useCallback(async (roomId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('threads')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch authors for threads
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const threadsWithAuthors = data.map(thread => ({
          ...thread,
          tag: thread.tag as Thread['tag'],
          author: profileMap.get(thread.user_id) || {
            user_id: thread.user_id,
            display_name: null,
            username: null,
            avatar_url: null
          }
        }));

        setThreads(threadsWithAuthors);
      } else {
        setThreads([]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new thread
  const createThread = async (data: {
    room_id: string;
    title: string;
    content: string;
    tag: Thread['tag'];
  }) => {
    if (!user) return null;

    try {
      const { data: thread, error } = await supabase
        .from('threads')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'تم إنشاء الموضوع بنجاح' });
      // Refresh the room that the thread belongs to (so it appears in the correct room filter)
      await fetchThreads(data.room_id);
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return null;
    }
  };

  // Delete a thread
  const deleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
      toast({ title: 'تم حذف الموضوع' });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads' },
        () => fetchThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchThreads]);

  return {
    threads,
    loading,
    fetchThreads,
    createThread,
    deleteThread
  };
};

// Hook for thread replies
export const useReplies = (threadId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReplies = useCallback(async () => {
    if (!threadId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('is_best_answer', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        // Check if current user liked each reply
        let likedReplyIds: string[] = [];
        if (user) {
          const { data: likes } = await supabase
            .from('reply_likes')
            .select('reply_id')
            .eq('user_id', user.id)
            .in('reply_id', data.map(r => r.id));
          likedReplyIds = likes?.map(l => l.reply_id) || [];
        }

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const repliesWithAuthors = data.map(reply => ({
          ...reply,
          author: profileMap.get(reply.user_id) || {
            user_id: reply.user_id,
            display_name: null,
            username: null,
            avatar_url: null
          },
          user_liked: likedReplyIds.includes(reply.id)
        }));

        setReplies(repliesWithAuthors);
      } else {
        setReplies([]);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId, user]);

  const createReply = async (content: string, parentId?: string) => {
    if (!user) return null;

    try {
      const { data: reply, error } = await supabase
        .from('replies')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          content,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'تم إضافة الرد' });
      await fetchReplies();
      return reply;
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return null;
    }
  };

  const updateReply = async (replyId: string, content: string) => {
    if (!user) return false;

    try {
      // RLS handles permission check - admins can update any reply, users only their own
      const { error } = await supabase
        .from('replies')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', replyId);

      if (error) throw error;

      toast({ title: 'تم تعديل الرد' });
      await fetchReplies();
      return true;
    } catch (error) {
      console.error('Error updating reply:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      toast({ title: 'تم حذف الرد' });
      await fetchReplies();
      return true;
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  const toggleLike = async (replyId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reply_likes')
          .insert({ reply_id: replyId, user_id: user.id });
      }
      await fetchReplies();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const markBestAnswer = async (replyId: string) => {
    try {
      // First, remove best answer from all other replies
      await supabase
        .from('replies')
        .update({ is_best_answer: false })
        .eq('thread_id', threadId);

      // Then mark this one as best
      await supabase
        .from('replies')
        .update({ is_best_answer: true })
        .eq('id', replyId);

      // Update thread
      await supabase
        .from('threads')
        .update({ has_best_answer: true })
        .eq('id', threadId);

      toast({ title: 'تم تحديد أفضل إجابة' });
      await fetchReplies();
    } catch (error) {
      console.error('Error marking best answer:', error);
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchReplies();
    }
  }, [threadId, fetchReplies]);

  useEffect(() => {
    const channel = supabase
      .channel(`replies-${threadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` },
        () => fetchReplies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, fetchReplies]);

  return {
    replies,
    loading,
    fetchReplies,
    createReply,
    updateReply,
    deleteReply,
    toggleLike,
    markBestAnswer
  };
};

// Hook for room chat
export const useRoomChat = (roomId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const messagesWithAuthors = data.map(msg => ({
          ...msg,
          author: profileMap.get(msg.user_id) || {
            user_id: msg.user_id,
            display_name: null,
            username: null,
            avatar_url: null
          }
        }));

        setMessages(messagesWithAuthors);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const sendMessage = async (content: string, isModerator: boolean = false) => {
    if (!user || !content.trim()) return null;

    // Import and use content moderation
    const { moderateContent, sanitizeContent, getModerationErrorMessage } = await import('@/lib/content-moderation');
    
    // Sanitize content first
    const sanitizedContent = sanitizeContent(content);
    
    // Check moderation
    const moderationResult = moderateContent(sanitizedContent, {}, isModerator);
    
    if (!moderationResult.isAllowed) {
      toast({ 
        title: getModerationErrorMessage(moderationResult, true),
        variant: 'destructive' 
      });
      return { blocked: true, reason: moderationResult.reason };
    }

    try {
      const { data: message, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: sanitizedContent
        })
        .select()
        .single();

      if (error) throw error;

      // Track daily quest - send_message
      import('@/lib/quest-tracker').then(({ trackQuestProgress }) => trackQuestProgress(user.id, 'send_message'));

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'فشل إرسال الرسالة', variant: 'destructive' });
      return null;
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    if (!user || !content.trim()) return false;

    try {
      // RLS handles permission check - admins can update any message, users only their own
      const { error } = await supabase
        .from('room_messages')
        .update({ content: content.trim() })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: content.trim() } : m
      ));
      toast({ title: 'تم تعديل الرسالة' });
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('room_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({ title: 'تم حذف الرسالة' });
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
  }, [roomId, fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMessage = payload.new as RoomMessage;
          
          // Fetch author info
          const { data: profile } = await supabase
            .from('profiles_public')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            author: profile || { user_id: newMessage.user_id, display_name: null, username: null, avatar_url: null }
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return {
    messages,
    loading,
    sendMessage,
    updateMessage,
    deleteMessage,
    fetchMessages
  };
};
