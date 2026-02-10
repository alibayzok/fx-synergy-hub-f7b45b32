import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupport } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Headset, Users, MessageCircle, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SupportStats from '@/components/support/SupportStats';
import SupportTicketList from '@/components/support/SupportTicketList';
import SupportChat from '@/components/support/SupportChat';
import SupportAgentManager from '@/components/support/SupportAgentManager';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  escalated_at: string | null;
  escalated_by: string | null;
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

const SupportDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isSupportAgent } = useSupport();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<Record<string, Profile>>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [activeTab, setActiveTab] = useState<'tickets' | 'agents'>('tickets');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    await supabase.rpc('close_stale_support_tickets');
    
    // Fetch all tickets for stats
    const { data: allData } = await supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    const all = (allData || []) as Ticket[];
    setAllTickets(all);

    // Apply filter
    let filtered = all;
    if (filter !== 'all') filtered = all.filter(t => t.status === filter);
    setTickets(filtered);

    // Fetch profiles
    const userIds = [...new Set(all.map(t => t.user_id).concat(all.filter(t => t.assigned_to).map(t => t.assigned_to!)))];
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
  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    const channel = supabase.channel('dashboard-support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

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

  const getUserName = (userId: string) => {
    const p = profiles[userId] || agentProfiles[userId];
    return p?.display_name || p?.username || 'مستخدم';
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

  const handleTransfer = async (data: { type: 'transfer' | 'escalate'; target: string; reason: string }) => {
    if (!selectedTicket || !user) return;
    const updateData: any = {
      escalation_reason: data.reason || null,
      escalated_at: new Date().toISOString(),
      escalated_by: user.id,
    };
    if (data.type === 'escalate') {
      updateData.escalated_to = data.target;
    } else {
      updateData.assigned_to = data.target;
    }
    await supabase.from('support_tickets').update(updateData).eq('id', selectedTicket.id);

    const targetName = getUserName(data.target);
    const actionText = data.type === 'escalate' ? `تم تصعيد التذكرة إلى ${targetName}` : `تم تحويل التذكرة إلى ${targetName}`;
    const fullMsg = data.reason ? `${actionText}\nالسبب: ${data.reason}` : actionText;
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id, sender_id: user.id,
      content: `⚡ ${fullMsg}`, is_admin: true, attachments: [],
    } as any);

    setSelectedTicket(prev => prev ? { ...prev, ...updateData } : null);
    fetchTickets();
  };

  // Stats
  const openCount = allTickets.filter(t => t.status === 'open').length;
  const closedCount = allTickets.filter(t => t.status === 'closed').length;
  const urgentCount = allTickets.filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status === 'open').length;
  const escalatedCount = allTickets.filter(t => t.escalated_to && t.status === 'open').length;

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Headset className="w-8 h-8 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">جاري تحميل لوحة الدعم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="shrink-0 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
          <Headset className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-base">لوحة الدعم الفني</h1>
          <div className="flex-1" />
          
          {isAdmin && (
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="tickets" className="text-xs h-7 gap-1.5 px-3">
                  <MessageCircle className="w-3.5 h-3.5" /> التذاكر
                </TabsTrigger>
                <TabsTrigger value="agents" className="text-xs h-7 gap-1.5 px-3">
                  <Users className="w-3.5 h-3.5" /> الموظفين
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </header>

      {/* Agent Manager Tab */}
      {activeTab === 'agents' && isAdmin && (
        <SupportAgentManager
          agents={agents}
          agentProfiles={agentProfiles}
          onRefresh={fetchAgents}
          getUserName={getUserName}
        />
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          {/* Stats Bar */}
          <div className="shrink-0 border-b border-border/30 bg-card/20">
            <SupportStats
              openCount={openCount}
              urgentCount={urgentCount}
              agentCount={agents.filter(a => a.is_active).length}
              closedCount={closedCount}
              escalatedCount={escalatedCount}
            />
          </div>

          {/* Main Content - Split Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Ticket List Sidebar */}
            <div className={cn(
              "border-e border-border/30 bg-card/20 overflow-hidden transition-all duration-200",
              selectedTicket ? "hidden md:flex md:w-80 lg:w-96 flex-col" : "w-full md:w-80 lg:w-96 flex flex-col"
            )}>
              <SupportTicketList
                tickets={tickets}
                loading={loading}
                filter={filter}
                onFilterChange={setFilter}
                selectedTicketId={selectedTicket?.id || null}
                onSelectTicket={openChat}
                getUserName={getUserName}
                profiles={profiles}
              />
            </div>

            {/* Chat Area */}
            {selectedTicket ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile back button */}
                <div className="md:hidden shrink-0 border-b border-border/30 px-2 py-1.5">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-xs gap-1">
                    <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> رجوع للقائمة
                  </Button>
                </div>
                <SupportChat
                  ticket={selectedTicket}
                  messages={messages}
                  agents={agents}
                  userId={user?.id || ''}
                  getUserName={getUserName}
                  onClose={handleClose}
                  onReopen={handleReopen}
                  onPriorityChange={handlePriorityChange}
                  onAssign={handleAssign}
                  onTransfer={handleTransfer}
                  onTicketUpdate={setSelectedTicket}
                />
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center bg-muted/5">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <LayoutDashboard className="w-8 h-8 text-primary/50" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">اختر تذكرة</p>
                    <p className="text-xs text-muted-foreground/70">اختر تذكرة من القائمة لعرض المحادثة</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SupportDashboardPage;
