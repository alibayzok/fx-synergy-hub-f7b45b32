import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  created_at: string;
}

export const useSupport = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTicket = async (subject: string, message: string) => {
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
        .insert({ ticket_id: (ticket as any).id, sender_id: user.id, content: message, is_admin: false } as any);
      if (msgError) throw msgError;

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

  const sendMessage = async (ticketId: string, content: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('support_messages')
      .insert({ ticket_id: ticketId, sender_id: user.id, content, is_admin: false } as any)
      .select()
      .single();
    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    // Update ticket timestamp
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

  useEffect(() => {
    if (user) fetchTickets();
  }, [user, fetchTickets]);

  // Realtime for tickets
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

  return { tickets, loading, createTicket, fetchMessages, sendMessage, closeTicket, fetchTickets };
};
