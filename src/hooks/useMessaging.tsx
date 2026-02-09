import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: DirectMessage;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_admin?: boolean;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useConversations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get all conversations the user is part of
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Fetch conversations
      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      // Fetch participants for each conversation
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('*')
        .in('conversation_id', conversationIds);

      // Fetch profiles for participants
      const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', participantUserIds);

      // Fetch last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const myParticipation = allParticipants?.find(
            p => p.conversation_id === conv.id && p.user_id === user.id
          );
          
          const { count: unreadCount } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', myParticipation?.last_read_at || '1970-01-01');

          // Get participants with profiles
          const convParticipants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
          const participantsWithProfiles = convParticipants.map(p => ({
            ...p,
            profile: profiles?.find(pr => pr.user_id === p.user_id)
          }));

          return {
            ...conv,
            participants: participantsWithProfiles,
            last_message: lastMsg || undefined,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
      setUnreadTotal(conversationsWithDetails.reduce((acc, c) => acc + (c.unread_count || 0), 0));
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Start a new direct conversation
  const startDirectConversation = async (targetUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existingParticipations) {
        for (const part of existingParticipations) {
          const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', part.conversation_id)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (otherPart) {
            // Check if it's a direct conversation
            const { data: conv } = await supabase
              .from('conversations')
              .select('type')
              .eq('id', part.conversation_id)
              .eq('type', 'direct')
              .maybeSingle();

            if (conv) {
              return part.conversation_id;
            }
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user.id, is_admin: true },
          { conversation_id: newConv.id, user_id: targetUserId, is_admin: false }
        ]);

      if (partError) throw partError;

      fetchConversations();
      return newConv.id;
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast.error(t('common.error'));
      return null;
    }
  };

  // Create a group conversation
  const createGroupConversation = async (name: string, memberIds: string[]): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator as admin
      const participants = [
        { conversation_id: newConv.id, user_id: user.id, is_admin: true },
        ...memberIds.map(id => ({ conversation_id: newConv.id, user_id: id }))
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      fetchConversations();
      toast.success(t('messages.groupCreated'));
      return newConv.id;
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error(t('common.error'));
      return null;
    }
  };

  return {
    conversations,
    loading,
    unreadTotal,
    fetchConversations,
    startDirectConversation,
    createGroupConversation
  };
};

export const useConversationMessages = (conversationId: string | null) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch conversation details
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      setConversation(convData);

      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', senderIds);

      const messagesWithSenders = (messagesData || []).map(msg => ({
        ...msg,
        sender: profiles?.find(p => p.user_id === msg.sender_id)
      }));

      setMessages(messagesWithSenders);

      // Update last_read_at
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, sender: profile }]);

          // Update last_read_at if we're viewing
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Send message
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!user || !conversationId || !content.trim()) return false;

    // Import and use content moderation for direct messages
    const { moderateContent, sanitizeContent, getModerationErrorMessage } = await import('@/lib/content-moderation');
    
    // Sanitize content
    const sanitizedContent = sanitizeContent(content);
    
    // Check moderation (links allowed in DMs, but spam detection active)
    const moderationResult = moderateContent(sanitizedContent, { 
      allowLinks: true, // Allow links in direct messages
      spamDetection: true 
    });
    
    if (!moderationResult.isAllowed) {
      toast.error(getModerationErrorMessage(moderationResult, true));
      return false;
    }

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: sanitizedContent
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  return {
    messages,
    conversation,
    loading,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
};
