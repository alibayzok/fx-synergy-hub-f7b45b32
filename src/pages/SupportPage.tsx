import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSupport, SupportTicket, SupportMessage } from '@/hooks/useSupport';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Plus, MessageCircle, LogIn, CheckCircle2, ImagePlus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate as formatDateUtil } from '@/lib/date-utils';

type View = 'list' | 'chat' | 'new';

const SupportPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getBoolean } = useAppSettings();
  const supportEnabled = getBoolean('enable_support', true);
  const { tickets, loading, createTicket, fetchMessages, sendMessage, closeTicket, uploadAttachment } = useSupport();

  const [view, setView] = useState<View>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!supportEnabled) navigate('/', { replace: true });
  }, [supportEnabled, navigate]);

  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`support-msgs-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  if (!supportEnabled) return null;

  const openChat = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView('chat');
    const msgs = await fetchMessages(ticket.id);
    setMessages(msgs);
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSending(true);
    // Upload files first
    let attachmentUrls: string[] = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      const tempId = Date.now().toString();
      for (const file of pendingFiles) {
        const url = await uploadAttachment(file, tempId);
        if (url) attachmentUrls.push(url);
      }
      setUploading(false);
    }
    const ticket = await createTicket(newSubject.trim(), newMessage.trim(), attachmentUrls);
    setSending(false);
    if (ticket) {
      setNewSubject('');
      setNewMessage('');
      setPendingFiles([]);
      await openChat(ticket);
    }
  };

  const handleSend = async () => {
    if ((!chatInput.trim() && pendingFiles.length === 0) || !selectedTicket) return;
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
    await sendMessage(selectedTicket.id, chatInput.trim() || '📎 مرفق', attachmentUrls);
    setChatInput('');
    setPendingFiles([]);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">تسجيل الدخول مطلوب</h2>
            <p className="text-muted-foreground">يجب تسجيل الدخول للتواصل مع الدعم</p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            تسجيل الدخول
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNotifications={false}>
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (view === 'chat' || view === 'new') { setView('list'); setPendingFiles([]); }
            else navigate(-1);
          }}>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {view === 'new' ? 'تذكرة جديدة' : view === 'chat' ? selectedTicket?.subject : 'الدعم الفني'}
            </h1>
            {view === 'chat' && selectedTicket && (
              <Badge variant={selectedTicket.status === 'open' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                {selectedTicket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
              </Badge>
            )}
          </div>
          {view === 'list' && (
            <Button size="sm" onClick={() => setView('new')} className="gap-1">
              <Plus className="w-4 h-4" /> جديد
            </Button>
          )}
          {view === 'chat' && selectedTicket?.status === 'open' && (
            <Button size="sm" variant="outline" onClick={() => closeTicket(selectedTicket.id)} className="gap-1">
              <CheckCircle2 className="w-4 h-4" /> إغلاق
            </Button>
          )}
        </div>
      </header>

      {/* List */}
      {view === 'list' && (
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground">لا توجد تذاكر دعم</p>
              <p className="text-sm text-muted-foreground">اضغط "جديد" للتواصل مع الدعم</p>
            </div>
          ) : tickets.map(ticket => (
            <button key={ticket.id} onClick={() => openChat(ticket)}
              className="w-full text-start p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-foreground truncate flex-1">{ticket.subject}</p>
                <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-xs ms-2">
                  {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateUtil(ticket.updated_at, 'dd MMM yyyy - HH:mm', i18n.language)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* New Ticket */}
      {view === 'new' && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الموضوع</label>
            <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="عنوان مختصر للمشكلة..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الرسالة</label>
            <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اشرح مشكلتك بالتفصيل..." rows={5} />
          </div>
          {/* File attachments */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <ImagePlus className="w-4 h-4" /> إرفاق صور
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/50">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeFile(i)}
                      className="absolute top-0 end-0 p-0.5 bg-destructive text-destructive-foreground rounded-bl-lg">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleCreateTicket} disabled={!newSubject.trim() || !newMessage.trim() || sending} className="w-full gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'جاري الإرسال...' : 'إرسال'}
          </Button>
        </div>
      )}

      {/* Chat */}
      {view === 'chat' && selectedTicket && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn(
                "max-w-[80%] p-3 rounded-2xl",
                msg.is_admin ? "bg-primary/10 border border-primary/20 self-start me-auto" : "bg-card border border-border/30 self-end ms-auto"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{msg.is_admin ? '🛡️ الدعم' : 'أنت'}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateUtil(msg.created_at, 'HH:mm', i18n.language)}</span>
                </div>
                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
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

          {selectedTicket.status === 'open' && (
            <div className="p-3 border-t border-border/30 bg-background/80 backdrop-blur-sm space-y-2">
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
                <Button variant="ghost" size="icon" onClick={() => chatFileInputRef.current?.click()} className="shrink-0">
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <input ref={chatFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="اكتب رسالتك..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={sending} />
                <Button size="icon" onClick={handleSend} disabled={(!chatInput.trim() && pendingFiles.length === 0) || sending}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {selectedTicket.status === 'closed' && (
            <div className="p-3 border-t border-border/30 text-center text-sm text-muted-foreground">هذه التذكرة مغلقة</div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default SupportPage;
