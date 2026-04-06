import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  attachments: string[];
  created_at: string;
}

export const useSupport = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);

  // Check if current user is a support agent
  useEffect(() => {
    if (!user) { setIsSupportAgent(false); return; }
    const check = async () => {
      const { data } = await supabase.rpc('is_support_agent', { p_user_id: user.id });
      setIsSupportAgent(!!data);
    };
    check();
  }, [user]);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTicket = async (subject: string, message: string, attachments: string[] = []) => {
    if (!user) return null;
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject } as any)
        .select()
        .single();
      if (error) throw error;

      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: (ticket as any).id,
          sender_id: user.id,
          content: message,
          is_admin: false,
          attachments,
        } as any);
      if (msgError) throw msgError;

      // Notify support agents about the new ticket
      const { data: agentsData } = await supabase.from('support_agents').select('user_id').eq('is_active', true);
      if (agentsData && agentsData.length > 0) {
        const notifications = agentsData
          .filter(a => a.user_id !== user.id)
          .map(agent => ({
            user_id: agent.user_id,
            title: 'تذكرة دعم جديدة',
            message: `تذكرة جديدة: ${subject}`,
            type: 'support_ticket',
            data: { ticket_id: (ticket as any).id },
          }));
        if (notifications.length > 0) {
          await supabase.from('user_notifications').insert(notifications);
        }
      }

      await fetchTickets();
      return ticket as SupportTicket;
    } catch (e) {
      console.error('Error creating ticket:', e);
      return null;
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return (data || []) as SupportMessage[];
  };

  const sendMessage = async (ticketId: string, content: string, attachments: string[] = [], asAgent = false) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        content,
        is_admin: asAgent,
        attachments,
      } as any)
      .select()
      .single();
    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', ticketId);
    return data as SupportMessage;
  };

  const closeTicket = async (ticketId: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'closed' } as any)
      .eq('id', ticketId);
    if (error) console.error('Error closing ticket:', error);
    else await fetchTickets();
  };

  const updateTicketPriority = async (ticketId: string, priority: string) => {
    await supabase.from('support_tickets').update({ priority } as any).eq('id', ticketId);
    await fetchTickets();
  };

  const assignTicket = async (ticketId: string, agentId: string | null) => {
    await supabase.from('support_tickets').update({ assigned_to: agentId } as any).eq('id', ticketId);
    await fetchTickets();
  };

  const uploadAttachment = async (file: File, ticketId: string) => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${ticketId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('support-attachments')
      .upload(path, file);
    if (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(path);
    return urlData?.publicUrl || path;
  };

  useEffect(() => {
    if (user) fetchTickets();
  }, [user, fetchTickets]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`support-tickets-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTickets]);

  return {
    tickets, loading, isSupportAgent,
    createTicket, fetchMessages, sendMessage, closeTicket,
    updateTicketPriority, assignTicket, uploadAttachment, fetchTickets,
  };
};
