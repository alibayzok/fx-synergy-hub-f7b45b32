import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export const SupportManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    const ticketList = (data || []) as Ticket[];
    setTickets(ticketList);

    // Fetch profiles
    const userIds = [...new Set(ticketList.map(t => t.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);
      const map: Record<string, Profile> = {};
      (profileData || []).forEach(p => { map[p.user_id] = p as Profile; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const openChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
  };

  // Realtime messages
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`admin-support-msgs-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  const handleSend = async () => {
    if (!input.trim() || !selectedTicket || !user) return;
    setSending(true);
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      content: input.trim(),
      is_admin: true,
    } as any);
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', selectedTicket.id);
    setInput('');
    setSending(false);
  };

  const handleClose = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'closed' } as any).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
    }
    fetchTickets();
  };

  const getUserName = (userId: string) => {
    const p = profiles[userId];
    return p?.display_name || p?.username || 'مستخدم';
  };

  if (selectedTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-3 border-b border-border/30">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{selectedTicket.subject}</p>
            <p className="text-xs text-muted-foreground">{getUserName(selectedTicket.user_id)}</p>
          </div>
          <Badge variant={selectedTicket.status === 'open' ? 'default' : 'secondary'}>
            {selectedTicket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
          </Badge>
          {selectedTicket.status === 'open' && (
            <Button size="sm" variant="outline" onClick={() => handleClose(selectedTicket.id)} className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              إغلاق
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] p-3 rounded-2xl",
                msg.is_admin
                  ? "bg-primary/10 border border-primary/20 ms-auto"
                  : "bg-card border border-border/30 me-auto"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">
                  {msg.is_admin ? '🛡️ أنت (الدعم)' : getUserName(selectedTicket.user_id)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedTicket.status === 'open' && (
          <div className="p-3 border-t border-border/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="اكتب ردك..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={sending}
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={filter === 'open' ? 'default' : 'outline'} onClick={() => setFilter('open')}>
          مفتوحة
        </Button>
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          الكل
        </Button>
        <Button size="sm" variant={filter === 'closed' ? 'default' : 'outline'} onClick={() => setFilter('closed')}>
          مغلقة
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">لا توجد تذاكر {filter === 'open' ? 'مفتوحة' : filter === 'closed' ? 'مغلقة' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => openChat(ticket)}
              className="w-full text-start p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{getUserName(ticket.user_id)}</span>
                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                    {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(ticket.updated_at), 'dd/MM HH:mm', { locale: ar })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{ticket.subject}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
