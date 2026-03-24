import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SlaIndicator from './SlaIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, MessageCircle, Loader2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

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
  sla_deadline: string | null;
  sla_breached: boolean;
  first_response_at: string | null;
  sla_notified: boolean;
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

interface SupportTicketListProps {
  tickets: Ticket[];
  loading: boolean;
  filter: 'all' | 'open' | 'closed';
  onFilterChange: (filter: 'all' | 'open' | 'closed') => void;
  agentFilter: string;
  onAgentFilterChange: (agentId: string) => void;
  agents: Agent[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  getUserName: (userId: string) => string;
  profiles: Record<string, Profile>;
}

const SupportTicketList = ({
  tickets, loading, filter, onFilterChange,
  agentFilter, onAgentFilterChange, agents,
  selectedTicketId, onSelectTicket, getUserName, profiles
}: SupportTicketListProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Status Filter */}
      <div className="flex items-center gap-1.5 p-3 border-b border-border/30">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {(['open', 'all', 'closed'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'ghost'}
            onClick={() => onFilterChange(f)} className="h-7 text-xs px-2.5">
            {f === 'open' ? 'مفتوحة' : f === 'closed' ? 'مغلقة' : 'الكل'}
          </Button>
        ))}
      </div>

      {/* Agent Filter */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
        <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Select value={agentFilter} onValueChange={onAgentFilterChange}>
          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">تذاكري</SelectItem>
            <SelectItem value="all">كل التذاكر</SelectItem>
            {agents.map(a => (
              <SelectItem key={a.user_id} value={a.user_id}>{getUserName(a.user_id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">لا توجد تذاكر</p>
            </div>
          ) : tickets.map(ticket => (
            <button key={ticket.id} onClick={() => onSelectTicket(ticket)}
              className={cn(
                "w-full text-start p-3 rounded-lg transition-all",
                selectedTicketId === ticket.id
                  ? "bg-primary/10 border border-primary/30 shadow-sm"
                  : "hover:bg-card/80 border border-transparent"
              )}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {profiles[ticket.user_id]?.avatar_url ? (
                    <img src={profiles[ticket.user_id].avatar_url!} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                      {getUserName(ticket.user_id).charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-xs">{getUserName(ticket.user_id)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(ticket.updated_at, 'dd/MM HH:mm', 'ar')}
                </span>
              </div>
              <p className="text-sm font-medium truncate mb-1.5">{ticket.subject}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                  {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                </Badge>
                <Badge className={cn("text-[10px] px-1.5 py-0", priorityColors[ticket.priority])}>
                  {priorityLabels[ticket.priority]}
                </Badge>
                <SlaIndicator
                  slaDeadline={ticket.sla_deadline}
                  slaBreached={ticket.sla_breached}
                  firstResponseAt={ticket.first_response_at}
                  status={ticket.status}
                  compact
                />
                {ticket.escalated_to && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-500">مصعّدة</Badge>
                )}
                {ticket.assigned_to && (
                  <span className="text-[10px] text-muted-foreground">← {getUserName(ticket.assigned_to)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SupportTicketList;
