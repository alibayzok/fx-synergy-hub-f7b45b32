import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupport } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Send, CheckCircle2, ImagePlus, X, Loader2,
  ArrowUpRight, Forward, RotateCcw, User, Shield, Clock
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

interface Agent {
  id: string;
  user_id: string;
  is_active: boolean;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
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

interface SupportChatProps {
  ticket: Ticket;
  messages: Message[];
  agents: Agent[];
  userId: string;
  getUserName: (userId: string) => string;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onAssign: (id: string, agentId: string) => void;
  onTransfer: (data: { type: 'transfer' | 'escalate'; target: string; reason: string }) => void;
  onTicketUpdate: (ticket: Ticket) => void;
}

const SupportChat = ({
  ticket, messages, agents, userId,
  getUserName, onClose, onReopen, onPriorityChange, onAssign, onTransfer, onTicketUpdate
}: SupportChatProps) => {
  const { uploadAttachment } = useSupport();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferType, setTransferType] = useState<'transfer' | 'escalate'>('transfer');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !userId) return;
    setSending(true);
    let attachmentUrls: string[] = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      for (const file of pendingFiles) {
        const url = await uploadAttachment(file, ticket.id);
        if (url) attachmentUrls.push(url);
      }
      setUploading(false);
    }
    await supabase.from('support_messages').insert({
      ticket_id: ticket.id, sender_id: userId,
      content: input.trim() || '📎 مرفق', is_admin: true, attachments: attachmentUrls,
    } as any);
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() } as any).eq('id', ticket.id);
    setInput('');
    setPendingFiles([]);
    setSending(false);
  };

  const openTransferDialog = (type: 'transfer' | 'escalate') => {
    setTransferType(type);
    setTransferTarget('');
    setTransferReason('');
    setShowTransferDialog(true);
  };

  const handleTransferSubmit = () => {
    if (!transferTarget) return;
    onTransfer({ type: transferType, target: transferTarget, reason: transferReason });
    setShowTransferDialog(false);
  };

  const removeFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index));
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const timeSinceUpdate = () => {
    const hours = (Date.now() - new Date(ticket.updated_at).getTime()) / 3600000;
    if (hours < 1) return 'أقل من ساعة';
    return `${Math.floor(hours)} ساعة`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Ticket Header */}
      <div className="border-b border-border/30 bg-card/30">
        {/* Title & Actions */}
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{getUserName(ticket.user_id)}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">آخر تحديث: {timeSinceUpdate()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={cn("text-xs", priorityColors[ticket.priority])}>
              {priorityLabels[ticket.priority]}
            </Badge>
            <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-xs">
              {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
            </Badge>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 flex-wrap bg-muted/20">
          <Select value={ticket.priority} onValueChange={v => onPriorityChange(ticket.id, v)}>
            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          {agents.length > 0 && (
            <Select value={ticket.assigned_to || 'unassigned'} onValueChange={v => onAssign(ticket.id, v)}>
              <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="تعيين لموظف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">غير معيّن</SelectItem>
                {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{getUserName(a.user_id)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex-1" />

          {ticket.status === 'open' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => openTransferDialog('transfer')} className="h-7 text-xs gap-1">
                <Forward className="w-3 h-3" /> تحويل
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openTransferDialog('escalate')} className="h-7 text-xs gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                <ArrowUpRight className="w-3 h-3" /> تصعيد
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onClose(ticket.id)} className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                <CheckCircle2 className="w-3 h-3" /> إغلاق
              </Button>
            </>
          )}
          {ticket.status === 'closed' && (
            <Button size="sm" variant="ghost" onClick={() => onReopen(ticket.id)} className="h-7 text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> إعادة فتح
            </Button>
          )}
        </div>

        {/* Escalation Banner */}
        {ticket.escalated_to && (
          <div className="px-4 py-2 bg-orange-500/5 border-t border-orange-500/20 flex items-center gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-orange-500 font-medium">
              مصعّدة إلى: {getUserName(ticket.escalated_to)}
            </span>
            {ticket.escalation_reason && (
              <span className="text-xs text-muted-foreground">— {ticket.escalation_reason}</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">لا توجد رسائل بعد</div>
        )}
        {messages.map(msg => {
          const isSystem = msg.content.startsWith('⚡');
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/30">
                  <p className="text-xs text-muted-foreground">{msg.content}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={cn("max-w-[75%] flex gap-2",
              msg.is_admin ? "ms-auto flex-row-reverse" : "me-auto")}>
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs",
                msg.is_admin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {msg.is_admin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className={cn("p-3 rounded-2xl",
                msg.is_admin
                  ? "bg-primary/10 border border-primary/20 rounded-se-sm"
                  : "bg-card border border-border/30 rounded-ss-sm")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.is_admin ? getUserName(msg.sender_id) : getUserName(ticket.user_id)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                  </span>
                </div>
                {msg.content && msg.content !== '📎 مرفق' && (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
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
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {ticket.status === 'open' && (
        <div className="p-3 border-t border-border/30 bg-card/30">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
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
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0 h-9 w-9">
              <ImagePlus className="w-4 h-4" />
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="اكتب ردك..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={sending} className="h-9" />
            <Button size="icon" onClick={handleSend} disabled={(!input.trim() && pendingFiles.length === 0) || sending} className="h-9 w-9">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {transferType === 'escalate' ? (
                <><ArrowUpRight className="w-5 h-5 text-orange-500" /> تصعيد التذكرة</>
              ) : (
                <><Forward className="w-5 h-5 text-primary" /> تحويل التذكرة</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {transferType === 'escalate' ? 'تصعيد إلى' : 'تحويل إلى'}
              </label>
              <Select value={transferTarget} onValueChange={setTransferTarget}>
                <SelectTrigger><SelectValue placeholder="اختر الشخص..." /></SelectTrigger>
                <SelectContent>
                  {agents.filter(a => a.user_id !== userId).map(a => (
                    <SelectItem key={a.user_id} value={a.user_id}>{getUserName(a.user_id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">سبب {transferType === 'escalate' ? 'التصعيد' : 'التحويل'}</label>
              <Textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="اكتب السبب هنا..." rows={3} />
            </div>
            <Button onClick={handleTransferSubmit} disabled={!transferTarget} className="w-full gap-2">
              {transferType === 'escalate' ? (
                <><ArrowUpRight className="w-4 h-4" /> تصعيد</>
              ) : (
                <><Forward className="w-4 h-4" /> تحويل</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportChat;
