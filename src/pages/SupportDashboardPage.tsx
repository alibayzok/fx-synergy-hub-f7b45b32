import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupport } from '@/hooks/useSupport';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, ArrowLeft, CheckCircle2, MessageCircle, Headset, ImagePlus, X, Loader2,
  Users, AlertTriangle, Clock, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  content: string;
  attachments: string[];
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Agent {
  id: string;
  user_id: string;
  is_active: boolean;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-primary/20 text-primary',
  high: 'bg-orange-500/20 text-orange-500',
  urgent: 'bg-destructive/20 text-destructive',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

const SupportDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isSupportAgent, uploadAttachment } = useSupport();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<Record<string, Profile>>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAgentManager, setShowAgentManager] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    // Auto-close stale tickets (48h inactive)
    await supabase.rpc('close_stale_support_tickets');
    let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    const ticketList = (data || []) as Ticket[];
    setTickets(ticketList);

    const userIds = [...new Set(ticketList.map(t => t.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds);
      const map: Record<string, Profile> = {};
      (profileData || []).forEach(p => { map[p.user_id] = p as Profile; });
      setProfiles(map);
    }
    setLoading(false);
  }, [filter]);

  const fetchAgents = useCallback(async () => {
    const { data } = await supabase.from('support_agents').select('*');
    const agentList = (data || []) as Agent[];
    setAgents(agentList);

    const agentUserIds = agentList.map(a => a.user_id);
    if (agentUserIds.length > 0) {
      const { data: profileData } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', agentUserIds);
      const map: Record<string, Profile> = {};
      (profileData || []).forEach(p => { map[p.user_id] = p as Profile; });
      setAgentProfiles(map);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { if (isAdmin) fetchAgents(); }, [isAdmin, fetchAgents]);

  useEffect(() => {
    const channel = supabase.channel('dashboard-support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  // Redirect if not agent/admin
  useEffect(() => {
    if (!authLoading && !isSupportAgent && !isAdmin) navigate('/');
  }, [authLoading, isSupportAgent, isAdmin, navigate]);

  const openChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
  };

  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase.channel(`dashboard-msgs-${selectedTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new as Message]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !selectedTicket || !user) return;
    setSending(true);
    let attachmentUrls: string[] = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      for (const file of pendingFiles) {
        const url = await uploadAttachment(file, selectedTicket.id);
        if (url) attachmentUrls.push(url);
      }
      setUploading(false);
    }
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id, sender_id: user.id,
      content: input.trim() || '📎 مرفق', is_admin: true, attachments: attachmentUrls,
    } as any);
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', selectedTicket.id);
    setInput('');
    setPendingFiles([]);
    setSending(false);
  };

  const handleClose = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'closed' } as any).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
    fetchTickets();
  };

  const handleReopen = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'open' } as any).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
    fetchTickets();
  };

  const handlePriorityChange = async (ticketId: string, priority: string) => {
    await supabase.from('support_tickets').update({ priority } as any).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, priority } : null);
    fetchTickets();
  };

  const handleAssign = async (ticketId: string, agentUserId: string) => {
    const val = agentUserId === 'unassigned' ? null : agentUserId;
    await supabase.from('support_tickets').update({ assigned_to: val } as any).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, assigned_to: val } : null);
    fetchTickets();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index));

  const addAgent = async () => {
    if (!newAgentEmail.trim()) return;
    // Find user by username or display_name
    const { data } = await supabase.from('profiles').select('user_id').or(`username.eq.${newAgentEmail.trim()},display_name.eq.${newAgentEmail.trim()}`).limit(1);
    if (data && data.length > 0) {
      await supabase.from('support_agents').insert({ user_id: data[0].user_id } as any);
      setNewAgentEmail('');
      fetchAgents();
    }
  };

  const removeAgent = async (agentId: string) => {
    await supabase.from('support_agents').delete().eq('id', agentId);
    fetchAgents();
  };

  const getUserName = (userId: string) => {
    const p = profiles[userId] || agentProfiles[userId];
    return p?.display_name || p?.username || 'مستخدم';
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  if (authLoading) return <AppLayout><div className="flex-1 flex items-center justify-center text-muted-foreground">جاري التحميل...</div></AppLayout>;

  return (
    <AppLayout showNotifications={false}>
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (selectedTicket) { setSelectedTicket(null); setPendingFiles([]); }
            else if (showAgentManager) setShowAgentManager(false);
            else navigate(-1);
          }}>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">
              {selectedTicket ? selectedTicket.subject : showAgentManager ? 'إدارة الموظفين' : 'لوحة الدعم الفني'}
            </h1>
          </div>
          {!selectedTicket && !showAgentManager && isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowAgentManager(true)} className="gap-1">
              <Users className="w-4 h-4" /> الموظفين
            </Button>
          )}
        </div>
      </header>

      {/* Agent Manager */}
      {showAgentManager && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex gap-2">
            <Input value={newAgentEmail} onChange={e => setNewAgentEmail(e.target.value)}
              placeholder="اسم المستخدم (username)..." className="flex-1" />
            <Button onClick={addAgent} disabled={!newAgentEmail.trim()}>إضافة</Button>
          </div>
          <div className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30">
                <div className="flex items-center gap-3">
                  {agentProfiles[agent.user_id]?.avatar_url && (
                    <img src={agentProfiles[agent.user_id].avatar_url!} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{getUserName(agent.user_id)}</p>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs">
                      {agent.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => removeAgent(agent.id)}>حذف</Button>
              </div>
            ))}
            {agents.length === 0 && <p className="text-center text-muted-foreground py-8">لم يتم إضافة موظفين بعد</p>}
          </div>
        </div>
      )}

      {/* Ticket Chat */}
      {selectedTicket && !showAgentManager && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ticket info bar */}
          <div className="px-4 py-2 border-b border-border/30 flex flex-wrap items-center gap-2 bg-card/30">
            <Badge className={cn("text-xs", priorityColors[selectedTicket.priority])}>
              {priorityLabels[selectedTicket.priority]}
            </Badge>
            <Badge variant={selectedTicket.status === 'open' ? 'default' : 'secondary'} className="text-xs">
              {selectedTicket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
            </Badge>
            <span className="text-xs text-muted-foreground">{getUserName(selectedTicket.user_id)}</span>
            <div className="flex-1" />
            <Select value={selectedTicket.priority} onValueChange={v => handlePriorityChange(selectedTicket.id, v)}>
              <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {agents.length > 0 && (
              <Select value={selectedTicket.assigned_to || 'unassigned'} onValueChange={v => handleAssign(selectedTicket.id, v)}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="تعيين" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">غير معيّن</SelectItem>
                  {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{getUserName(a.user_id)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {selectedTicket.status === 'open' ? (
              <Button size="sm" variant="outline" onClick={() => handleClose(selectedTicket.id)} className="h-7 text-xs gap-1">
                <CheckCircle2 className="w-3 h-3" /> إغلاق
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleReopen(selectedTicket.id)} className="h-7 text-xs gap-1">
                إعادة فتح
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn("max-w-[80%] p-3 rounded-2xl",
                msg.is_admin ? "bg-primary/10 border border-primary/20 ms-auto" : "bg-card border border-border/30 me-auto")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{msg.is_admin ? '🛡️ الدعم' : getUserName(selectedTicket.user_id)}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), 'HH:mm', { locale: ar })}</span>
                </div>
                {msg.content && msg.content !== '📎 مرفق' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="مرفق" className="w-24 h-24 object-cover rounded-lg border border-border/30 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedTicket.status === 'open' && (
            <div className="p-3 border-t border-border/30 space-y-2">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/50">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(i)} className="absolute top-0 end-0 p-0.5 bg-destructive text-destructive-foreground rounded-bl-lg">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="اكتب ردك..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={sending} />
                <Button size="icon" onClick={handleSend} disabled={(!input.trim() && pendingFiles.length === 0) || sending}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tickets List */}
      {!selectedTicket && !showAgentManager && (
        <div className="flex-1 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 p-4">
            <div className="p-3 rounded-xl bg-card/50 border border-border/30 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{openCount}</p>
              <p className="text-xs text-muted-foreground">مفتوحة</p>
            </div>
            <div className="p-3 rounded-xl bg-card/50 border border-border/30 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
              <p className="text-xl font-bold">{urgentCount}</p>
              <p className="text-xs text-muted-foreground">عالية/عاجلة</p>
            </div>
            <div className="p-3 rounded-xl bg-card/50 border border-border/30 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">موظفين</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['open', 'all', 'closed'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f === 'open' ? 'مفتوحة' : f === 'closed' ? 'مغلقة' : 'الكل'}
              </Button>
            ))}
          </div>

          {/* List */}
          <div className="px-4 pb-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">لا توجد تذاكر</p>
              </div>
            ) : tickets.map(ticket => (
              <button key={ticket.id} onClick={() => openChat(ticket)}
                className="w-full text-start p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {profiles[ticket.user_id]?.avatar_url && (
                      <img src={profiles[ticket.user_id].avatar_url!} className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="font-semibold text-sm">{getUserName(ticket.user_id)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(ticket.updated_at), 'dd/MM HH:mm', { locale: ar })}</span>
                </div>
                <p className="text-sm text-foreground truncate mb-1">{ticket.subject}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                    {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                  </Badge>
                  <Badge className={cn("text-xs", priorityColors[ticket.priority])}>
                    {priorityLabels[ticket.priority]}
                  </Badge>
                  {ticket.status === 'open' && (() => {
                    const hoursLeft = Math.max(0, 4 - (Date.now() - new Date(ticket.updated_at).getTime()) / 3600000);
                    return (
                      <span className={cn("text-xs", hoursLeft < 6 ? "text-destructive" : "text-muted-foreground")}>
                        ⏱ {hoursLeft < 1 ? 'أقل من ساعة' : `${Math.floor(hoursLeft)} ساعة`}
                      </span>
                    );
                  })()}
                  {ticket.assigned_to && (
                    <span className="text-xs text-muted-foreground">← {getUserName(ticket.assigned_to)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default SupportDashboardPage;
