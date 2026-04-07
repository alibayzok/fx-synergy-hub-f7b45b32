import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, Clock, MessageSquare, Phone, Mail, Send, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ── Contact User Dialog ──────────────────────────────────────────────────
const ContactUserDialog = ({ userId, displayName, isArabic }: {
  userId: string;
  displayName: string;
  isArabic: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [senderName, setSenderName] = useState(isArabic ? 'إدارة المنصة' : 'Platform Admin');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existingConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      let conversationId: string | null = null;

      if (existingConvs && existingConvs.length > 0) {
        const convIds = existingConvs.map(c => c.conversation_id);
        const { data: sharedConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)
          .in('conversation_id', convIds);

        if (sharedConv && sharedConv.length > 0) {
          conversationId = sharedConv[0].conversation_id;
        }
      }

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert([{ created_by: user.id, type: 'direct' as any, name: null }])
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;

        await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: user.id, is_admin: true },
            { conversation_id: conversationId, user_id: userId, is_admin: false },
          ]);
      }

      const fullMessage = `[${senderName}]: ${messageContent}`;
      const { error: msgError } = await supabase
        .from('direct_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content: fullMessage,
        }]);

      if (msgError) throw msgError;

      toast.success(isArabic ? 'تم إرسال الرسالة ✅' : 'Message sent ✅');
      setOpen(false);
      setMessageContent('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(isArabic ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <MessageSquare className="w-3.5 h-3.5" />
          {isArabic ? 'مراسلة' : 'Message'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-primary" />
            {isArabic ? `مراسلة ${displayName}` : `Message ${displayName}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {isArabic ? 'اسم المرسل' : 'Sender Name'}
            </label>
            <Input
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder={isArabic ? 'إدارة المنصة' : 'Platform Admin'}
              className="text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {isArabic ? 'الرسالة' : 'Message'}
            </label>
            <Textarea
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
              className="min-h-[100px] resize-none text-sm"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || sending}
            className="w-full gap-2"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isArabic ? 'إرسال' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ───────────────────────────────────────────────────────
export const AnalystRequestsManagement = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['admin-analyst-requests'],
    queryFn: async () => {
      console.log('[AnalystRequests] Fetching approved_analysts...');
      const { data, error } = await supabase
        .from('approved_analysts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[AnalystRequests] Error fetching:', error);
        throw error;
      }
      console.log('[AnalystRequests] Fetched rows:', data?.length, data);

      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, phone, country')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      }));
    },
  });

  // Realtime subscription to auto-refresh when new requests arrive
  useEffect(() => {
    const channel = supabase
      .channel('analyst-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approved_analysts' },
        (payload) => {
          console.log('[AnalystRequests] Realtime event:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-analyst-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleAction = async (id: string, userId: string, status: 'approved' | 'rejected') => {
    const notes = adminNotes[id] || null;
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    console.log('[AnalystRequests] Approving request:', { id, userId, status, adminId: currentUser?.id });
    
    const { data: updateData, error, count } = await supabase
      .from('approved_analysts')
      .update({
        status,
        admin_notes: notes,
        reviewed_by: currentUser?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    console.log('[AnalystRequests] Update result:', { updateData, error, count });

    if (error) {
      console.error('[AnalystRequests] Update error:', error);
      toast.error(isArabic ? 'فشل في تحديث الطلب: ' + error.message : 'Failed to update: ' + error.message);
      return;
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('[AnalystRequests] No rows updated - RLS may be blocking');
      toast.error(isArabic ? 'لم يتم تحديث أي صف - تحقق من الصلاحيات' : 'No rows updated - check permissions');
      return;
    }

    try {
      const notifTitle = status === 'approved'
        ? (isArabic ? 'تم قبول طلبك كمحلل ✅' : 'Analyst request approved ✅')
        : (isArabic ? 'تم رفض طلبك كمحلل ❌' : 'Analyst request rejected ❌');
      const notifMessage = status === 'approved'
        ? (isArabic ? 'تهانينا! تم اعتمادك كمحلل معتمد. يمكنك الآن نشر تحليلاتك.' : 'Congratulations! You are now an approved analyst.')
        : (isArabic ? 'للأسف تم رفض طلبك.' + (notes ? ' السبب: ' + notes : '') : 'Unfortunately your request was rejected.' + (notes ? ' Reason: ' + notes : ''));

      await supabase.from('user_notifications').insert([{
        user_id: userId,
        type: 'analyst_status',
        title: notifTitle,
        message: notifMessage,
        data: { status, admin_notes: notes },
      }]);
    } catch (e) {
      console.error('Error sending notification:', e);
    }

    toast.success(status === 'approved'
      ? (isArabic ? 'تمت الموافقة ✅' : 'Approved ✅')
      : (isArabic ? 'تم الرفض' : 'Rejected')
    );
    queryClient.invalidateQueries({ queryKey: ['admin-analyst-requests'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('approved_analysts').delete().eq('id', id);
    if (error) {
      toast.error(isArabic ? 'فشل في الحذف' : 'Failed to delete');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['admin-analyst-requests'] });
    toast.success(isArabic ? 'تم الحذف ✅' : 'Deleted ✅');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" />{isArabic ? 'معلق' : 'Pending'}</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><Check className="w-3 h-3" />{isArabic ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><X className="w-3 h-3" />{isArabic ? 'مرفوض' : 'Rejected'}</Badge>;
      default: return null;
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const others = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div className="flex-1">
          <h2 className="text-lg font-bold">{isArabic ? 'طلبات المحللين' : 'Analyst Requests'}</h2>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'إدارة طلبات الانضمام كمحلل معتمد' : 'Manage analyst approval requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <Badge className="bg-amber-500 text-white">{pending.length} {isArabic ? 'معلق' : 'pending'}</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {isArabic ? 'خطأ في جلب البيانات: ' : 'Error fetching data: '}{(fetchError as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">{isArabic ? 'لا توجد طلبات حالياً' : 'No requests currently'}</p>
          <p className="text-xs text-muted-foreground/60">
            {isArabic ? 'ستظهر الطلبات هنا عندما يتقدم مستخدم بطلب ليصبح محلل معتمد' : 'Requests will appear here when users apply to become analysts'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pending, ...others].map(req => (
            <div key={req.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              {/* User info row */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(req.profile?.display_name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">
                    {req.profile?.display_name || req.profile?.username || 'Unknown'}
                  </span>
                  {req.profile?.username && (
                    <span className="text-[11px] text-muted-foreground ms-1.5">@{req.profile.username}</span>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: isArabic ? ar : enUS })}</span>
                    {req.profile?.country && <span>· {req.profile.country}</span>}
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>

              {/* User message */}
              {req.message && (
                <div className="flex gap-2 items-start p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{req.message}</p>
                </div>
              )}

              {/* Contact options */}
              <div className="flex gap-2 flex-wrap">
                <ContactUserDialog
                  userId={req.user_id}
                  displayName={req.profile?.display_name || req.profile?.username || 'User'}
                  isArabic={isArabic}
                />
                {req.profile?.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => window.open(`tel:${req.profile.phone}`, '_blank')}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {isArabic ? 'اتصال' : 'Call'}
                  </Button>
                )}
              </div>

              {/* Actions for pending */}
              {req.status === 'pending' && (
                <div className="space-y-2">
                  <Textarea
                    value={adminNotes[req.id] || ''}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    placeholder={isArabic ? 'ملاحظات الأدمن (اختياري)...' : 'Admin notes (optional)...'}
                    className="min-h-[60px] resize-none text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, req.user_id, 'approved')}
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" /> {isArabic ? 'موافقة' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(req.id, req.user_id, 'rejected')}
                      className="flex-1 gap-1.5"
                    >
                      <X className="w-4 h-4" /> {isArabic ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Admin notes display for reviewed */}
              {req.status !== 'pending' && req.admin_notes && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium">{isArabic ? 'ملاحظات: ' : 'Notes: '}</span>
                    {req.admin_notes}
                  </p>
                </div>
              )}

              {/* Delete button with confirmation - all statuses */}
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      {isArabic ? 'حذف' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isArabic 
                          ? `هل أنت متأكد من حذف طلب ${req.profile?.display_name || 'هذا المستخدم'}؟ لا يمكن التراجع عن هذا الإجراء.`
                          : `Are you sure you want to delete ${req.profile?.display_name || 'this user'}'s request? This action cannot be undone.`
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(req.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isArabic ? 'حذف' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
